// Processes a Dodo Payments webhook delivery: verify → record once → apply → mark processed.
// Safe to retry: deliveries are at-least-once and can arrive out of order.

import { reportError } from "../report.ts";
import { supabaseAdmin } from "../supabase/admin.ts";
import { productMap, verifyAccountSignature, verifyDodoSignature } from "./dodo.ts";

export type WebhookResult = { status: number; body: Record<string, unknown> };
export type WebhookHeaders = { id: string | null; timestamp: string | null; signature: string | null };

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Dodo subscription status → our status. null = nothing to record. */
const STATUS: Record<string, "active" | "past_due" | "paused" | "canceled" | null> = {
  active: "active", // includes the free trial: access is granted
  past_due: "past_due", // renewal failed, still retrying: keep access
  on_hold: "paused", // retries exhausted: no access until payment is fixed
  paused: "paused",
  cancelled: "canceled",
  expired: "canceled",
  failed: "canceled",
  pending: null,
};

export async function processDodoWebhook(rawBody: string, h: WebhookHeaders, now = Date.now()): Promise<WebhookResult> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) return { status: 503, body: { error: "billing_not_configured" } };

  const sig = verifyDodoSignature(rawBody, h, secret, now);
  if (!sig.ok) return { status: 401, body: { error: sig.reason } };

  let event: Json;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }
  const eventId = String(h.id);
  const eventType = String(event.type ?? "");
  if (!eventType) return { status: 400, body: { error: "missing_fields" } };

  const db = supabaseAdmin();

  // Record the delivery. If we've fully processed this event before, acknowledge and stop.
  const ins = await db
    .from("billing_events")
    .insert({ event_id: eventId, event_type: eventType, occurred_at: event.timestamp ?? null })
    .select("event_id");
  if (ins.error) {
    const { data: prior } = await db.from("billing_events").select("status").eq("event_id", eventId).maybeSingle();
    if (prior && prior.status !== "received" && prior.status !== "error") return { status: 200, body: { ok: true, duplicate: true } };
    // else: a previous attempt didn't finish; fall through and process again.
  }

  const finish = async (status: "processed" | "ignored" | "error", detail?: string) => {
    await db.from("billing_events").update({ status, detail: detail ?? null, processed_at: new Date().toISOString() }).eq("event_id", eventId);
  };

  try {
    if (!eventType.startsWith("subscription.") || event.data?.payload_type === "Payment") {
      await finish("ignored", "event type not handled");
      return { status: 200, body: { ok: true, ignored: true } };
    }
    const result = await applySubscription(event);
    await finish(result.applied ? "processed" : "ignored", result.reason);
    return { status: 200, body: { ok: true, applied: result.applied, reason: result.reason } };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    reportError("billing webhook", e, { eventId, eventType });
    await finish("error", message.slice(0, 300));
    return { status: 500, body: { error: "processing_failed" } }; // Dodo will retry
  }
}

async function applySubscription(event: Json): Promise<{ applied: boolean; reason?: string }> {
  const db = supabaseAdmin();
  const sub: Json = event.data ?? {};
  const subscriptionId = String(sub.subscription_id ?? "");
  const occurredAt = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();
  if (!subscriptionId.startsWith("sub_")) return { applied: false, reason: "no subscription id" };

  const status = STATUS[String(sub.status ?? "")];
  if (status === undefined) return { applied: false, reason: `unknown status ${sub.status}` };
  if (status === null) return { applied: false, reason: "pending" };

  // Which plan? The subscription's product.
  const map = productMap();
  const productId = String(sub.product_id ?? "");
  if (!map[productId]) return { applied: false, reason: "unknown product" };
  const { app, plan } = map[productId];

  // Which account? Trust only a signed account id (set by our checkout), or a subscription we already know.
  const { data: known } = await db.from("subscriptions").select("account_id").eq("provider_subscription_id", subscriptionId).maybeSingle();
  let accountId: string | null = known?.account_id ?? null;
  if (!accountId) {
    const md = (sub.metadata ?? {}) as Json;
    const candidate = typeof md.account_id === "string" ? md.account_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(candidate) || !verifyAccountSignature(candidate, md.sig)) return { applied: false, reason: "unverified account" };
    const { data: acc } = await db.from("accounts").select("id").eq("id", candidate).maybeSingle();
    if (!acc) return { applied: false, reason: "account not found" };
    accountId = acc.id;
  }

  // Ignore events older than what we already applied (out-of-order delivery).
  const { data: current } = await db.from("subscriptions").select("provider_subscription_id, status, last_event_at").eq("account_id", accountId).eq("app", app).maybeSingle();
  if (current?.last_event_at && occurredAt < current.last_event_at && current.provider_subscription_id === subscriptionId) {
    return { applied: false, reason: "stale event" };
  }
  // One live subscription per account per app: don't let a second one overwrite an active one.
  if (current && current.provider_subscription_id !== subscriptionId && ["active", "trialing", "past_due"].includes(current.status)) {
    return { applied: false, reason: "account already has an active subscription" };
  }

  const customerId = sub.customer?.customer_id ?? sub.customer_id;
  const periodEnd = status === "canceled" ? null : (sub.next_billing_date ?? null);
  const row = {
    account_id: accountId,
    app,
    provider_customer_id: typeof customerId === "string" ? customerId : null,
    provider_subscription_id: subscriptionId,
    product_id: productId,
    plan,
    status,
    current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
    cancel_at_period_end: status !== "canceled" && sub.cancel_at_next_billing_date === true,
    last_event_at: occurredAt,
    updated_at: new Date().toISOString(),
  };
  const up = await db.from("subscriptions").upsert(row, { onConflict: "account_id,app" });
  if (up.error) throw new Error(`upsert failed: ${up.error.message}`);

  await db.from("audit_log").insert({ account_id: accountId, action: "billing.subscription", target: subscriptionId, meta: { app, plan, status } });
  return { applied: true };
}
