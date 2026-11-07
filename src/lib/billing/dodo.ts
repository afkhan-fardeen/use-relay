// Dodo Payments helpers (server side): config, webhook signature (Standard Webhooks),
// signed account token, checkout session, customer portal and plan change.
// Dodo is our Merchant of Record. Docs: https://docs.dodopayments.com

import { createHmac, timingSafeEqual } from "node:crypto";
import { APPS, type AppSlug } from "../apps.ts";
import { paidPlans } from "./plans.ts";

export type DodoMode = "test_mode" | "live_mode";

/** Fails loudly if unset or wrong, so we never run against the wrong account by accident. */
export function dodoMode(): DodoMode {
  const m = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (m !== "test_mode" && m !== "live_mode") throw new Error('DODO_PAYMENTS_ENVIRONMENT must be "test_mode" or "live_mode"');
  return m;
}

export function apiBase(): string {
  if (process.env.NODE_ENV !== "production" && process.env.DODO_API_BASE) return process.env.DODO_API_BASE;
  return dodoMode() === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

/** Env name for a product: DODO_PRODUCT_EXPORT_STARTER, DODO_PRODUCT_QR_PRO, ... */
export const productEnvName = (app: AppSlug, plan: string) => `DODO_PRODUCT_${app.toUpperCase()}_${plan.toUpperCase()}`;

/** product ID → which app and plan it buys, from env. */
export function productMap(): Record<string, { app: AppSlug; plan: string }> {
  const out: Record<string, { app: AppSlug; plan: string }> = {};
  for (const a of APPS) {
    for (const plan of paidPlans(a.slug)) {
      const id = process.env[productEnvName(a.slug, plan)];
      if (id) out[id] = { app: a.slug, plan };
    }
  }
  return out;
}

export function productIds(app: AppSlug): Record<string, string> {
  const out: Record<string, string> = {};
  for (const plan of paidPlans(app)) {
    const id = process.env[productEnvName(app, plan)];
    if (id) out[plan] = id;
  }
  return out;
}

/** An app's billing is "on" only when Dodo is configured and at least one product exists for that app. */
export function billingConfigured(app: AppSlug): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PAYMENTS_WEBHOOK_KEY && Object.keys(productIds(app)).length > 0);
}

// ───────── webhook signature (Standard Webhooks) ─────────
// signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`, HMAC-SHA256, base64.
// The secret may start with "whsec_"; the rest is base64.
export type SignatureResult = { ok: true } | { ok: false; reason: string };

export function verifyDodoSignature(
  rawBody: string,
  h: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowMs = Date.now(),
  toleranceSec = 300,
): SignatureResult {
  if (!h.id || !h.timestamp || !h.signature) return { ok: false, reason: "missing_signature" };
  if (!/^\d+$/.test(h.timestamp)) return { ok: false, reason: "malformed_signature" };
  if (Math.abs(nowMs / 1000 - Number(h.timestamp)) > toleranceSec) return { ok: false, reason: "stale_timestamp" };

  const keyBytes = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf8");
  const expected = createHmac("sha256", keyBytes).update(`${h.id}.${h.timestamp}.${rawBody}`).digest();
  for (const part of h.signature.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    const given = Buffer.from(sig, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: "bad_signature" };
}

// ───────── signed account token: proves which account a checkout was started for ─────────
// The account id goes into checkout metadata. We sign it on the server so nobody can attach a
// purchase to someone else's account by editing a request.
function tokenKey(): Buffer {
  const k = process.env.MASTER_KEY;
  if (!k) throw new Error("MASTER_KEY is not set");
  return createHmac("sha256", Buffer.from(k, "base64")).update("billing-checkout-token").digest();
}

export function signAccount(accountId: string): string {
  return createHmac("sha256", tokenKey()).update(accountId).digest("hex");
}

export function verifyAccountSignature(accountId: string, sig: unknown): boolean {
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const expected = Buffer.from(signAccount(accountId), "hex");
  const given = Buffer.from(sig, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ───────── API calls ─────────
async function dodo<T>(method: string, path: string, body?: unknown, timeout = 15_000): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const key = process.env.DODO_PAYMENTS_API_KEY;
  if (!key) return { ok: false, status: 0, detail: "Billing isn't configured." };
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      method,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as (T & { message?: string; code?: string }) | null;
    if (!res.ok) return { ok: false, status: res.status, detail: String(json?.message ?? json?.code ?? `HTTP ${res.status}`).slice(0, 200) };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, detail: "We couldn't reach our payment provider. Try again." };
  }
}

/** Hosted checkout for one plan. Returns the URL to send the customer to. */
export async function createCheckout(o: { productId: string; email: string; name?: string; accountId: string; app: AppSlug; plan: string; returnUrl: string }): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const r = await dodo<{ checkout_url?: string | null }>("POST", "/checkouts", {
    product_cart: [{ product_id: o.productId, quantity: 1 }],
    customer: { email: o.email, ...(o.name ? { name: o.name } : {}) },
    return_url: o.returnUrl,
    metadata: { account_id: o.accountId, sig: signAccount(o.accountId), app: o.app, plan: o.plan },
  });
  if (!r.ok) return { ok: false, error: "We couldn't start checkout. Try again." };
  const url = r.data.checkout_url;
  if (!url || !(url.startsWith("https://") || process.env.NODE_ENV !== "production")) return { ok: false, error: "We couldn't start checkout. Try again." };
  return { ok: true, url };
}

/** Customer portal link (payment method, invoices, cancel). */
export async function createPortalLink(customerId: string): Promise<string | null> {
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) return null;
  const r = await dodo<{ link?: string }>("POST", `/customers/${customerId}/customer-portal/session`);
  const url = r.ok ? r.data.link : null;
  return url && (url.startsWith("https://") || process.env.NODE_ENV !== "production") ? url : null;
}

/** Switch an existing subscription to another plan (prorated). The webhook then updates our records. */
export async function changeSubscriptionPlan(subscriptionId: string, productId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId) || !/^pdt_[A-Za-z0-9]+$/.test(productId)) return { ok: false, error: "Invalid subscription." };
  const r = await dodo("POST", `/subscriptions/${subscriptionId}/change-plan`, { product_id: productId, quantity: 1, proration_billing_mode: "prorated_immediately" }, 20_000);
  return r.ok ? { ok: true } : { ok: false, error: r.detail || "The plan couldn't be changed. Try again." };
}
