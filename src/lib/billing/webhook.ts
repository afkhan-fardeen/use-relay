// Processes a Paddle webhook delivery: verify → record once → apply → mark processed.
// Safe to retry: Paddle may deliver the same event many times, and out of order.

import { supabaseAdmin } from "../supabase/admin.ts";
import { priceMap, verifyAccountSignature, verifyPaddleSignature } from "./paddle.ts";

export type WebhookResult = { status: number; body: Record<string, unknown> };

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const STATUSES = new Set(["trialing", "active", "past_due", "paused", "canceled"]);
const SUB_EVENTS = /^subscription\.(created|activated|updated|canceled|past_due|paused|resumed|trialing)$/;

export async function processPaddleWebhook(rawBody: string, signatureHeader: string | null, now = Date.now()): Promise<WebhookResult> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return { status: 503, body: { error: "billing_not_configured" } };

  const sig = verifyPaddleSignature(rawBody, signatureHeader, secret, now);
  if (!sig.ok) return { status: 401, body: { error: sig.reason } };

  let event: Json;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }
  const eventId = String(event.event_id ?? "");
  const eventType = String(event.event_type ?? "");
  if (!eventId || !eventType) return { status: 400, body: { error: "missing_fields" } };

  const db = supabaseAdmin();

  // Record the delivery. If we've fully processed this event before, acknowledge and stop.
  const ins = await db
    .from("paddle_events")
    .insert({ event_id: eventId, event_type: eventType, occurred_at: event.occurred_at ?? null })
    .select("event_id");
  if (ins.error) {
    const { data: prior } = await db.from("paddle_events").select("status").eq("event_id", eventId).maybeSingle();
    if (prior && prior.status !== "received" && prior.status !== "error") return { status: 200, body: { ok: true, duplicate: true } };
    // else: a previous attempt didn't finish; fall through and process again.
  }

  const finish = async (status: "processed" | "ignored" | "error", detail?: string) => {
    await db.from("paddle_events").update({ status, detail: detail ?? null, processed_at: new Date().toISOString() }).eq("event_id", eventId);
  };

  try {
    if (!SUB_EVENTS.test(eventType)) {
      await finish("ignored", "event type not handled");
      return { status: 200, body: { ok: true, ignored: true } };
    }
    const result = await applySubscription(event);
    await finish(result.applied ? "processed" : "ignored", result.reason);
    return { status: 200, body: { ok: true, applied: result.applied, reason: result.reason } };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("paddle webhook failed", { eventId, eventType, error: message });
    await finish("error", message.slice(0, 300));
    return { status: 500, body: { error: "processing_failed" } }; // Paddle will retry
  }
}

async function applySubscription(event: Json): Promise<{ applied: boolean; reason?: string }> {
  const db = supabaseAdmin();
  const sub: Json = event.data ?? {};
  const subscriptionId = String(sub.id ?? "");
  const occurredAt = event.occurred_at ? new Date(event.occurred_at).toISOString() : new Date().toISOString();
  if (!subscriptionId.startsWith("sub_")) return { applied: false, reason: "no subscription id" };

  const status = String(sub.status ?? "");
  if (!STATUSES.has(status)) return { applied: false, reason: `unknown status ${status}` };

  // Which plan? Look at the subscription's price IDs.
  const map = priceMap();
  const priceId = (sub.items as Json[] | undefined)?.map((i) => String(i?.price?.id ?? "")).find((id) => map[id]);
  if (!priceId) return { applied: false, reason: "unknown price" };
  const { app, plan } = map[priceId];

  // Which account? Trust only a signed account id (set by our checkout), or a subscription we already know.
  const { data: known } = await db.from("subscriptions").select("account_id, last_event_at").eq("paddle_subscription_id", subscriptionId).maybeSingle();
  let accountId: string | null = known?.account_id ?? null;
  if (!accountId) {
    const cd = (sub.custom_data ?? {}) as Json;
    const candidate = typeof cd.account_id === "string" ? cd.account_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(candidate) || !verifyAccountSignature(candidate, cd.sig)) return { applied: false, reason: "unverified account" };
    const { data: acc } = await db.from("accounts").select("id").eq("id", candidate).maybeSingle();
    if (!acc) return { applied: false, reason: "account not found" };
    accountId = acc.id;
  }

  // Ignore events older than what we already applied (out-of-order delivery).
  const { data: current } = await db.from("subscriptions").select("paddle_subscription_id, status, last_event_at").eq("account_id", accountId).eq("app", app).maybeSingle();
  if (current?.last_event_at && occurredAt < current.last_event_at && current.paddle_subscription_id === subscriptionId) {
    return { applied: false, reason: "stale event" };
  }
  // One live subscription per account per app: don't let a second one overwrite an active one.
  if (current && current.paddle_subscription_id !== subscriptionId && ["active", "trialing", "past_due"].includes(current.status)) {
    return { applied: false, reason: "account already has an active subscription" };
  }

  const periodEnd = sub.current_billing_period?.ends_at ?? sub.next_billed_at ?? null;
  const row = {
    account_id: accountId,
    app,
    paddle_customer_id: typeof sub.customer_id === "string" ? sub.customer_id : null,
    paddle_subscription_id: subscriptionId,
    price_id: priceId,
    plan,
    status,
    current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
    cancel_at_period_end: sub.scheduled_change?.action === "cancel",
    last_event_at: occurredAt,
    updated_at: new Date().toISOString(),
  };
  const up = await db.from("subscriptions").upsert(row, { onConflict: "account_id,app" });
  if (up.error) throw new Error(`upsert failed: ${up.error.message}`);

  await db.from("audit_log").insert({ account_id: accountId, action: "billing.subscription", target: subscriptionId, meta: { app, plan, status } });
  return { applied: true };
}
