// Paddle helpers (server side): config, webhook signature, checkout token, portal link.
// Docs followed: Paddle-Signature header is "ts=<unix>;h1=<hex>"; h1 = HMAC-SHA256(secret, `${ts}:${rawBody}`).

import { createHmac, timingSafeEqual } from "node:crypto";
import { PAID_PLANS, type PaidPlan } from "./plans.ts";

export type PaddleEnv = "sandbox" | "production";

export function paddleEnv(): PaddleEnv {
  return process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";
}

/** price ID → plan, from env (PADDLE_PRICE_STARTER / _PRO / _AGENCY). */
export function priceMap(): Record<string, PaidPlan> {
  const out: Record<string, PaidPlan> = {};
  for (const p of PAID_PLANS) {
    const id = process.env[`PADDLE_PRICE_${p.toUpperCase()}`];
    if (id) out[id] = p;
  }
  return out;
}

export function priceIds(): Partial<Record<PaidPlan, string>> {
  const out: Partial<Record<PaidPlan, string>> = {};
  for (const p of PAID_PLANS) {
    const id = process.env[`PADDLE_PRICE_${p.toUpperCase()}`];
    if (id) out[p] = id;
  }
  return out;
}

/** Billing is "on" only when the client token, webhook secret and at least one price are configured. */
export function billingConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && process.env.PADDLE_WEBHOOK_SECRET && Object.keys(priceMap()).length > 0);
}

// ───────── webhook signature ─────────
export type SignatureResult = { ok: true } | { ok: false; reason: string };

export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, nowMs = Date.now(), toleranceSec = 300): SignatureResult {
  if (!header) return { ok: false, reason: "missing_signature" };
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1 || !/^\d+$/.test(ts) || !/^[0-9a-f]{64}$/i.test(h1)) return { ok: false, reason: "malformed_signature" };
  if (Math.abs(nowMs / 1000 - Number(ts)) > toleranceSec) return { ok: false, reason: "stale_timestamp" };

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest();
  const given = Buffer.from(h1, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}

// ───────── checkout token: proves which account a checkout was opened for ─────────
// The browser passes account_id into Paddle as custom data. Without a signature a user could
// attach their purchase to someone else's account, so we sign it on the server.
function tokenKey(): Buffer {
  const k = process.env.MASTER_KEY;
  if (!k) throw new Error("MASTER_KEY is not set");
  return createHmac("sha256", Buffer.from(k, "base64")).update("paddle-checkout-token").digest();
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

// ───────── customer portal (manage payment method, cancel, invoices) ─────────
export function apiBase(): string {
  if (process.env.NODE_ENV !== "production" && process.env.PADDLE_API_BASE) return process.env.PADDLE_API_BASE;
  return paddleEnv() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export async function createPortalLink(customerId: string, subscriptionId?: string | null): Promise<string | null> {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !/^ctm_[a-z0-9]+$/i.test(customerId)) return null;
  try {
    const res = await fetch(`${apiBase()}/customers/${customerId}/portal-sessions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
    const url = body.data?.urls?.general?.overview;
    if (!url) return null;
    const secure = url.startsWith("https://") || process.env.NODE_ENV !== "production";
    return secure ? url : null;
  } catch {
    return null;
  }
}

/** Switch an existing subscription to another price (prorated). The webhook then updates our records. */
export async function changeSubscriptionPlan(subscriptionId: string, priceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) return { ok: false, error: "Billing isn't fully configured." };
  if (!/^sub_[a-z0-9]+$/i.test(subscriptionId) || !/^pri_[a-z0-9]+$/i.test(priceId)) return { ok: false, error: "Invalid subscription." };
  try {
    const res = await fetch(`${apiBase()}/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ items: [{ price_id: priceId, quantity: 1 }], proration_billing_mode: "prorated_immediately" }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { error?: { detail?: string } } | null;
    return { ok: false, error: body?.error?.detail?.slice(0, 200) || "Paddle couldn't change the plan. Try again." };
  } catch {
    return { ok: false, error: "We couldn't reach Paddle. Try again." };
  }
}
