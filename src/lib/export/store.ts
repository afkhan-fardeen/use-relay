// Loads a store's saved credentials and mints a fresh Shopify token (tokens last ~24h).

import { decryptSecret } from "../crypto.ts";
import { FRIENDLY, ShopifyError, mintToken } from "../shopify.ts";
import { supabaseAdmin } from "../supabase/admin.ts";

export type StoreAccess = { id: string; domain: string; token: string; scopes: string[]; accountId: string };

export async function loadStoreAccess(storeId: string, accountId?: string): Promise<StoreAccess> {
  const db = supabaseAdmin();
  const { data: store } = await db
    .from("stores")
    .select("id, account_id, shop_domain, client_id, status, granted_scopes")
    .eq("id", storeId)
    .maybeSingle();
  if (!store || (accountId && store.account_id !== accountId)) throw new ShopifyError("shop_not_found", "Store not found.");
  if (store.status === "disconnected") throw new ShopifyError("app_not_installed", "This store is disconnected. Reconnect it in Stores.");

  const { data: secret } = await db.from("store_secrets").select("blob").eq("store_id", store.id).maybeSingle();
  if (!secret) throw new ShopifyError("invalid_credentials", "This store has no saved credentials. Reconnect it in Stores.");

  let clientSecret: string;
  try {
    clientSecret = decryptSecret(store.id, secret.blob);
  } catch {
    throw new ShopifyError("unexpected", FRIENDLY.unexpected);
  }
  const token = await mintToken(store.shop_domain, store.client_id, clientSecret);
  return { id: store.id, domain: store.shop_domain, token, scopes: store.granted_scopes ?? [], accountId: store.account_id };
}

// Short-lived token cache for interactive previews (tokens last ~24h; we keep them 20 minutes).
const cache = new Map<string, { access: StoreAccess; exp: number }>();

export async function loadStoreAccessCached(storeId: string, accountId: string): Promise<StoreAccess> {
  const hit = cache.get(storeId);
  if (hit && hit.exp > Date.now() && hit.access.accountId === accountId) return hit.access;
  const access = await loadStoreAccess(storeId, accountId);
  cache.set(storeId, { access, exp: Date.now() + 20 * 60_000 });
  return access;
}

export function forgetStoreAccess(storeId: string) {
  cache.delete(storeId);
}
