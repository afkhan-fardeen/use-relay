"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/dal";
import { getEntitlements } from "@/lib/billing/entitlements";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { FRIENDLY, ShopifyError, fetchShopInfo, mintToken, normalizeDomain } from "@/lib/shopify";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type StoreState = { ok?: boolean; error?: string; message?: string; values?: { domain: string; clientId: string } } | undefined;

const MAX_ATTEMPTS_PER_10_MIN = 10;

async function tooManyAttempts(accountId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await db
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("action", "store.connect_attempt")
    .gte("created_at", since);
  return (count ?? 0) >= MAX_ATTEMPTS_PER_10_MIN;
}

export async function connectStore(_prev: StoreState, formData: FormData): Promise<StoreState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (session.role !== "owner") return { error: "Only the account owner can connect stores." };

  const domainRaw = String(formData.get("domain") ?? "").trim();
  const domain = normalizeDomain(domainRaw);
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  // Keep what they typed (never the secret) so a failed attempt doesn't wipe the form.
  const fail = (error: string): StoreState => ({ error, values: { domain: domainRaw, clientId } });
  if (!domain) return fail("Enter your store address, like your-store.myshopify.com.");
  if (clientId.length < 8 || clientId.length > 200) return fail("Enter the Client ID from your app's Settings page.");
  if (clientSecret.length < 8 || clientSecret.length > 400) return fail("Enter the Client secret from your app's Settings page.");

  // Credential testing is a brute-force target, so limit attempts per account.
  if (await tooManyAttempts(session.accountId)) return fail("Too many attempts. Wait a few minutes and try again.");
  const db = supabaseAdmin();
  await db.from("audit_log").insert({ account_id: session.accountId, actor_id: session.userId, action: "store.connect_attempt", target: domain });

  let info;
  try {
    const token = await mintToken(domain, clientId, clientSecret);
    info = await fetchShopInfo(domain, token);
  } catch (e) {
    return fail(e instanceof ShopifyError ? e.message : FRIENDLY.unexpected);
  }
  if (info.scopes.length === 0) {
    return fail("The app is installed but has no permissions. In the Dev Dashboard, add the read scopes, release a version, and approve it on the store.");
  }

  // Is this store already connected? Only to this same account.
  const { data: existing } = await db.from("stores").select("id, account_id").eq("shop_domain", domain).maybeSingle();
  if (existing && existing.account_id !== session.accountId) {
    return fail("This store is already connected to another Klyroo account.");
  }

  if (!existing) {
    const ent = await getEntitlements(session.accountId);
    const { count } = await db.from("stores").select("id", { count: "exact", head: true }).eq("account_id", session.accountId).neq("status", "disconnected");
    if ((count ?? 0) >= ent.limits.maxStores) {
      return fail(`Your ${ent.plan} plan includes ${ent.limits.maxStores} store${ent.limits.maxStores === 1 ? "" : "s"}. Upgrade in Billing to connect more.`);
    }
  }

  const storeId = existing?.id ?? randomUUID();
  const row = {
    client_id: clientId,
    status: "connected",
    granted_scopes: info.scopes,
    currency_code: info.currencyCode,
    last_checked_at: new Date().toISOString(),
    last_error: null,
  };
  const saved = existing
    ? await db.from("stores").update(row).eq("id", storeId)
    : await db.from("stores").insert({ id: storeId, account_id: session.accountId, shop_domain: domain, ...row });
  if (saved.error) return fail("We couldn't save the store. Try again.");

  const sec = await db
    .from("store_secrets")
    .upsert({ store_id: storeId, blob: encryptSecret(storeId, clientSecret), key_version: 1, updated_at: new Date().toISOString() });
  if (sec.error) return fail("We couldn't save the credentials securely. Try again.");

  await db.from("audit_log").insert({ account_id: session.accountId, actor_id: session.userId, action: "store.connected", target: domain, meta: { scopes: info.scopes } });
  revalidatePath("/export/stores");
  return { ok: true, message: `Connected ${info.name} (${domain}).` };
}

/** Re-check a saved store: mint a fresh token and re-read permissions. */
export async function testStore(_prev: StoreState, formData: FormData): Promise<StoreState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  const storeId = String(formData.get("storeId") ?? "");

  const db = supabaseAdmin();
  const { data: store } = await db.from("stores").select("id, account_id, shop_domain, client_id").eq("id", storeId).maybeSingle();
  if (!store || store.account_id !== session.accountId) return { error: "Store not found." };
  const { data: secret } = await db.from("store_secrets").select("blob").eq("store_id", store.id).maybeSingle();
  if (!secret) return { error: "No saved credentials. Reconnect this store." };

  try {
    const token = await mintToken(store.shop_domain, store.client_id, decryptSecret(store.id, secret.blob));
    const info = await fetchShopInfo(store.shop_domain, token);
    await db
      .from("stores")
      .update({ status: "connected", granted_scopes: info.scopes, currency_code: info.currencyCode, last_checked_at: new Date().toISOString(), last_error: null })
      .eq("id", store.id);
    revalidatePath("/export/stores");
    return { ok: true, message: `Connection is healthy. ${info.scopes.length} permission${info.scopes.length === 1 ? "" : "s"} granted.` };
  } catch (e) {
    const message = e instanceof ShopifyError ? e.message : FRIENDLY.unexpected;
    const terminal = e instanceof ShopifyError && ["invalid_credentials", "app_not_installed", "wrong_organization", "shop_not_found"].includes(e.code);
    await db
      .from("stores")
      .update({ ...(terminal ? { status: "needs_attention" } : {}), last_checked_at: new Date().toISOString(), last_error: message })
      .eq("id", store.id);
    revalidatePath("/export/stores");
    return { error: message };
  }
}

export async function disconnectStore(_prev: StoreState, formData: FormData): Promise<StoreState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (session.role !== "owner") return { error: "Only the account owner can disconnect stores." };
  const storeId = String(formData.get("storeId") ?? "");

  const db = supabaseAdmin();
  const { data: store } = await db.from("stores").select("id, account_id, shop_domain").eq("id", storeId).maybeSingle();
  if (!store || store.account_id !== session.accountId) return { error: "Store not found." };

  // Remove the stored secret; keep history rows.
  await db.from("store_secrets").delete().eq("store_id", store.id);
  await db.from("stores").update({ status: "disconnected", last_error: null }).eq("id", store.id);
  await db.from("audit_log").insert({ account_id: session.accountId, actor_id: session.userId, action: "store.disconnected", target: store.shop_domain });
  revalidatePath("/export/stores");
  return { ok: true, message: "Store disconnected and its credentials deleted." };
}
