// Billing tests: webhook security, subscription state, plan limits, Paddle API calls.
// Uses the real Supabase project and a fake Paddle/Shopify. Usage: npm run test:billing
import assert from "node:assert/strict";
import http from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { startFakeShopify } from "./fake-shopify.mjs";

process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "test_token";
process.env.PADDLE_WEBHOOK_SECRET = "pdl_ntfset_test_secret";
process.env.PADDLE_PRICE_EXPORT_STARTER = "pri_starter01";
process.env.PADDLE_PRICE_EXPORT_GROWTH = "pri_growth01";
process.env.PADDLE_PRICE_EXPORT_SCALE = "pri_scale01";
process.env.PADDLE_PRICE_QR_PRO = "pri_qrpro01"; // QR has its own prices and its own subscription
process.env.PADDLE_API_KEY = "pdl_test_key";

const paddle = await import("../src/lib/billing/paddle.ts");
const { processPaddleWebhook } = await import("../src/lib/billing/webhook.ts");
const { getEntitlements, planFor } = await import("../src/lib/billing/entitlements.ts");
const { encryptSecret } = await import("../src/lib/crypto.ts");
const { drainQueue } = await import("../src/lib/export/queue.ts");

let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const sign = (body, ts = Math.floor(Date.now() / 1000), secret = SECRET) => `ts=${ts};h1=${createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex")}`;

// ───────── pure checks ─────────
{
  const body = '{"a":1}';
  assert.deepEqual(paddle.verifyPaddleSignature(body, sign(body), SECRET), { ok: true });
  assert.equal(paddle.verifyPaddleSignature(body + " ", sign(body), SECRET).reason, "bad_signature");
  assert.equal(paddle.verifyPaddleSignature(body, sign(body, undefined, "other"), SECRET).reason, "bad_signature");
  const old = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(paddle.verifyPaddleSignature(body, sign(body, old), SECRET).reason, "stale_timestamp");
  assert.equal(paddle.verifyPaddleSignature(body, "garbage", SECRET).reason, "malformed_signature");
  assert.equal(paddle.verifyPaddleSignature(body, null, SECRET).reason, "missing_signature");
  assert.equal(paddle.verifyPaddleSignature(body, "ts=1;h1=zz", SECRET).reason, "malformed_signature");
}
ok("webhook signature: valid accepted; tampered body, wrong secret, stale timestamp, malformed and missing rejected");

{
  const acc = randomUUID();
  const sig = paddle.signAccount(acc);
  assert.ok(paddle.verifyAccountSignature(acc, sig));
  assert.ok(!paddle.verifyAccountSignature(randomUUID(), sig), "signature is bound to the account");
  assert.ok(!paddle.verifyAccountSignature(acc, "0".repeat(64)));
  assert.ok(!paddle.verifyAccountSignature(acc, undefined));
}
ok("checkout account token can't be reused for another account");

{
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  assert.equal(planFor("export", null), "free");
  assert.equal(planFor("export", { plan: "growth", status: "active", current_period_end: future }), "growth");
  assert.equal(planFor("export", { plan: "growth", status: "trialing", current_period_end: future }), "growth");
  assert.equal(planFor("export", { plan: "starter", status: "past_due", current_period_end: past }), "starter", "past_due keeps access while Paddle retries");
  assert.equal(planFor("export", { plan: "growth", status: "canceled", current_period_end: future }), "growth", "canceled keeps access until the period ends");
  assert.equal(planFor("export", { plan: "growth", status: "canceled", current_period_end: past }), "free");
  assert.equal(planFor("export", { plan: "growth", status: "paused", current_period_end: future }), "free");
  assert.equal(planFor("export", { plan: "weird", status: "active", current_period_end: future }), "free");
}
ok("plan rules: active/trialing/past_due keep the plan; canceled until period end; paused or unknown falls to free");

{
  const saved = { ...process.env };
  delete process.env.PADDLE_WEBHOOK_SECRET;
  assert.equal(paddle.billingConfigured("export"), false);
  const ent = await getEntitlements(randomUUID());
  assert.equal(ent.plan, "beta");
  assert.equal(ent.billingOn, false);
  Object.assign(process.env, saved);
  assert.equal(paddle.billingConfigured("export"), true);
  const res = await processPaddleWebhook("{}", sign("{}"));
  assert.equal(res.status, 400, "once configured, requests are processed (an empty event is a 400, not a 503)");
}
ok("billing is off (beta limits) until Paddle is configured");

// ───────── fake Paddle API ─────────
const calls = [];
const fakePaddle = http.createServer((req, res) => {
  let d = "";
  req.on("data", (c) => (d += c));
  req.on("end", () => {
    calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: d ? JSON.parse(d) : null });
    res.writeHead(200, { "content-type": "application/json" });
    if (req.url.includes("portal-sessions")) return res.end(JSON.stringify({ data: { urls: { general: { overview: "https://customer-portal.paddle.com/cpl_x?token=abc" } } } }));
    res.end(JSON.stringify({ data: { id: "sub_x" } }));
  });
});
await new Promise((r) => fakePaddle.listen(0, "127.0.0.1", r));
process.env.PADDLE_API_BASE = `http://127.0.0.1:${fakePaddle.address().port}`;

// ───────── database-backed checks ─────────
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const fake = await startFakeShopify();
process.env.SHOPIFY_TEST_ORIGIN = `http://127.0.0.1:${fake.port}`;
const tag = randomUUID().slice(0, 8);
const users = [];

async function mkAccount(label) {
  const email = `bill-${tag}-${label}@example.com`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  users.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  return { accountId: m.account_id, email, password };
}
const subEvent = (type, { subId = "sub_01abc", status = "active", price = "pri_growth01", custom, at = new Date().toISOString(), extra = {} } = {}) => {
  const body = JSON.stringify({
    event_id: `evt_${randomUUID().replace(/-/g, "")}`, event_type: type, occurred_at: at,
    data: { id: subId, status, customer_id: "ctm_01abc", items: [{ price: { id: price } }], custom_data: custom, current_billing_period: { ends_at: new Date(Date.now() + 30 * 86_400_000).toISOString() }, ...extra },
  });
  return body;
};
const send = (body, header = sign(body)) => processPaddleWebhook(body, header);
const getSub = async (accountId) => (await admin.from("subscriptions").select("*").eq("account_id", accountId).maybeSingle()).data;
const custom = (acc) => ({ account_id: acc, sig: paddle.signAccount(acc) });

try {
  const A = await mkAccount("a");
  const B = await mkAccount("b");

  // Rejections and noise.
  let r = await send(subEvent("subscription.created", { custom: custom(A.accountId) }), "ts=1;h1=" + "0".repeat(64));
  assert.equal(r.status, 401);
  assert.equal(await getSub(A.accountId), null);
  r = await send("not json");
  assert.equal(r.status, 400);
  r = await send(JSON.stringify({ event_type: "x" }));
  assert.equal(r.status, 400);
  r = await send(JSON.stringify({ event_id: `evt_${randomUUID()}`, event_type: "transaction.completed", data: {} }));
  assert.deepEqual([r.status, r.body.ignored], [200, true]);
  ok("webhook: bad signature is rejected (nothing stored); bad JSON and missing fields rejected; unrelated events acknowledged");

  // Created → pro.
  const created = subEvent("subscription.created", { custom: custom(A.accountId) });
  r = await send(created);
  assert.deepEqual([r.status, r.body.applied], [200, true], JSON.stringify(r.body));
  let sub = await getSub(A.accountId);
  assert.deepEqual([sub.plan, sub.status, sub.paddle_subscription_id, sub.paddle_customer_id], ["growth", "active", "sub_01abc", "ctm_01abc"]);
  assert.equal((await getEntitlements(A.accountId)).plan, "growth");
  ok("webhook: a signed subscription.created activates the plan for the right account");

  // Duplicate delivery.
  const before = (await getSub(A.accountId)).updated_at;
  r = await send(created);
  assert.deepEqual([r.status, r.body.duplicate], [200, true]);
  assert.equal((await getSub(A.accountId)).updated_at, before);
  ok("webhook: the same event delivered twice is acknowledged and changes nothing");

  // Out-of-order: an older event must not overwrite newer state.
  r = await send(subEvent("subscription.updated", { custom: custom(A.accountId), status: "past_due", at: new Date(Date.now() + 5_000).toISOString() }));
  assert.equal(r.body.applied, true);
  r = await send(subEvent("subscription.updated", { custom: custom(A.accountId), status: "active", at: new Date(Date.now() - 600_000).toISOString() }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "stale event"]);
  assert.equal((await getSub(A.accountId)).status, "past_due");
  assert.equal((await getEntitlements(A.accountId)).plan, "growth", "past_due still has access");
  ok("webhook: out-of-order older events are ignored; past_due keeps access");

  // Scheduled cancellation, then final cancellation.
  await send(subEvent("subscription.updated", { custom: custom(A.accountId), status: "active", at: new Date(Date.now() + 10_000).toISOString(), extra: { scheduled_change: { action: "cancel", effective_at: new Date(Date.now() + 86_400_000).toISOString() } } }));
  assert.equal((await getSub(A.accountId)).cancel_at_period_end, true);
  await send(subEvent("subscription.canceled", { custom: custom(A.accountId), status: "canceled", at: new Date(Date.now() + 20_000).toISOString() }));
  sub = await getSub(A.accountId);
  assert.equal(sub.status, "canceled");
  assert.equal((await getEntitlements(A.accountId)).plan, "growth", "paid through the period end");
  await admin.from("subscriptions").update({ current_period_end: new Date(Date.now() - 1000).toISOString() }).eq("account_id", A.accountId);
  assert.equal((await getEntitlements(A.accountId)).plan, "free");
  ok("webhook: scheduled cancel is recorded; canceled keeps access until the paid period ends, then drops to free");

  // Forged account in custom data.
  r = await send(subEvent("subscription.created", { subId: "sub_forged", custom: { account_id: B.accountId, sig: "f".repeat(64) } }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "unverified account"]);
  r = await send(subEvent("subscription.created", { subId: "sub_nosig", custom: { account_id: B.accountId } }));
  assert.equal(r.body.applied, false);
  r = await send(subEvent("subscription.created", { subId: "sub_other", custom: custom(randomUUID()) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "account not found"]);
  assert.equal(await getSub(B.accountId), null);
  ok("webhook: forged or missing account signatures never grant a plan");

  // Unknown price.
  r = await send(subEvent("subscription.created", { subId: "sub_unk", price: "pri_unknown", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "unknown price"]);
  assert.equal(await getSub(B.accountId), null);
  ok("webhook: subscriptions for prices we don't sell are ignored");

  // One active subscription per account.
  r = await send(subEvent("subscription.created", { subId: "sub_b1", price: "pri_starter01", custom: custom(B.accountId) }));
  assert.equal(r.body.applied, true);
  r = await send(subEvent("subscription.created", { subId: "sub_b2", price: "pri_scale01", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "account already has an active subscription"]);
  assert.equal((await getSub(B.accountId)).plan, "starter");
  // A known subscription's later events don't need to re-prove the account (plan switch via Paddle).
  r = await send(subEvent("subscription.updated", { subId: "sub_b1", price: "pri_scale01", custom: undefined, at: new Date(Date.now() + 30_000).toISOString() }));
  assert.equal(r.body.applied, true);
  assert.equal((await getSub(B.accountId)).plan, "scale");
  ok("webhook: one active subscription per account; plan switches on a known subscription update the plan");

  // Each app bills separately: the same account can hold an Export plan and a QR plan at once.
  r = await send(subEvent("subscription.created", { subId: "sub_b_qr", price: "pri_qrpro01", custom: custom(B.accountId) }));
  assert.deepEqual([r.status, r.body.applied], [200, true], JSON.stringify(r.body));
  const { data: bSubs } = await admin.from("subscriptions").select("app, plan, status").eq("account_id", B.accountId).order("app");
  assert.deepEqual(bSubs.map((x) => `${x.app}:${x.plan}`), ["export:scale", "qr:pro"]);
  assert.equal((await getEntitlements(B.accountId, "export")).plan, "scale");
  assert.equal((await getEntitlements(B.accountId, "qr")).plan, "pro");
  r = await send(subEvent("subscription.created", { subId: "sub_b_qr2", price: "pri_qrpro01", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "account already has an active subscription"]);
  await send(subEvent("subscription.canceled", { subId: "sub_b_qr", price: "pri_qrpro01", status: "canceled", at: new Date(Date.now() + 90_000).toISOString(), extra: { current_billing_period: { ends_at: new Date(Date.now() - 1000).toISOString() } } }));
  assert.equal((await getEntitlements(B.accountId, "qr")).plan, "free");
  assert.equal((await getEntitlements(B.accountId, "export")).plan, "scale", "cancelling QR never touches Export");
  ok("per-app billing: one account holds an Export plan and a QR plan at the same time; cancelling one leaves the other alone");

  // Event log.
  const { data: evs } = await admin.from("paddle_events").select("status").like("event_id", "evt_%").limit(200);
  assert.ok(evs.some((e) => e.status === "processed") && evs.some((e) => e.status === "ignored"));
  ok("every delivery is recorded for audit");

  // RLS on subscriptions.
  const ua = anon();
  await ua.auth.signInWithPassword({ email: B.email, password: B.password });
  const own = await ua.from("subscriptions").select("plan");
  assert.deepEqual(own.data.map((x) => x.plan).sort(), ["pro", "scale"]);
  const other = anon();
  await other.auth.signInWithPassword({ email: A.email, password: A.password });
  const theirs = await other.from("subscriptions").select("plan");
  assert.deepEqual(theirs.data.map((x) => x.plan), ["growth"], "A sees only A's row");
  const tamper = await ua.from("subscriptions").update({ plan: "scale" }).eq("account_id", B.accountId);
  assert.ok(tamper.error, "users cannot edit subscriptions");
  const anonRead = await anon().from("subscriptions").select("*");
  assert.ok(anonRead.error || anonRead.data.length === 0, "anonymous sees nothing");
  const ev = await ua.from("paddle_events").select("*");
  assert.ok(ev.error || ev.data.length === 0, "event log is server-only");
  ok("subscriptions: members read only their own; nobody can edit them or read the event log from the browser");

  // Paddle API calls.
  const url = await paddle.createPortalLink("ctm_01abc", "sub_01abc");
  assert.equal(url, "https://customer-portal.paddle.com/cpl_x?token=abc");
  const pc = calls.find((c) => c.url.includes("portal-sessions"));
  assert.equal(pc.url, "/customers/ctm_01abc/portal-sessions");
  assert.equal(pc.auth, "Bearer pdl_test_key");
  assert.deepEqual(pc.body, { subscription_ids: ["sub_01abc"] });
  assert.equal(await paddle.createPortalLink("not-a-customer"), null);
  const ch = await paddle.changeSubscriptionPlan("sub_01abc", "pri_growth01");
  assert.deepEqual(ch, { ok: true });
  const patch = calls.find((c) => c.method === "PATCH");
  assert.equal(patch.url, "/subscriptions/sub_01abc");
  assert.deepEqual(patch.body, { items: [{ price_id: "pri_growth01", quantity: 1 }], proration_billing_mode: "prorated_immediately" });
  assert.equal((await paddle.changeSubscriptionPlan("../evil", "pri_growth01")).ok, false);
  ok("Paddle API: portal link and prorated plan change send the right requests; malformed IDs are refused");

  // Plan limits through the real export queue (row cap per plan).
  const { encryptSecret: enc } = { encryptSecret };
  const C = await mkAccount("c");
  const storeId = randomUUID();
  await admin.from("stores").insert({ id: storeId, account_id: C.accountId, shop_domain: `bill-c-${tag}.myshopify.com`, client_id: "cid-12345678", granted_scopes: ["read_products"] });
  await admin.from("store_secrets").insert({ store_id: storeId, blob: enc(storeId, "shpss_secret") });
  const lines = [{ id: "gid://shopify/Product/1", handle: "p", title: "P" }];
  for (let i = 0; i < 1200; i++) lines.push({ id: `gid://shopify/ProductVariant/${i}`, __parentId: "gid://shopify/Product/1", sku: `S${i}` });
  fake.state.scenario = { mode: "ok", lines, pollsBeforeDone: 1 };
  const cfg = { storeId, resource: "products", columns: ["handle", "sku"], renames: {}, status: "", tag: "", dateFrom: "", dateTo: "", format: "csv", name: "big" };
  const mkJob = async () => (await admin.from("export_jobs").insert({ account_id: C.accountId, store_id: storeId, resource: "products", config: cfg, idempotency_key: `${tag}-${randomUUID()}` }).select().single()).data;
  let job = await mkJob();
  await drainQueue();
  job = (await admin.from("export_jobs").select("*").eq("id", job.id).single()).data;
  assert.equal(job.status, "failed");
  assert.equal(job.error_code, "too_many_rows");
  assert.match(job.error_detail, /free plan allows 1,000 rows/);
  ok("limits: the free plan's 1,000-row cap stops a bigger export with an upgrade hint");

  await send(subEvent("subscription.created", { subId: "sub_c1", price: "pri_starter01", custom: custom(C.accountId) }));
  job = await mkJob();
  await drainQueue();
  job = (await admin.from("export_jobs").select("*").eq("id", job.id).single()).data;
  assert.equal(job.status, "succeeded", job.error_detail);
  assert.equal(Number(job.rows_written), 1200);
  ok("limits: after upgrading (via webhook) the same export succeeds");

  console.log(`\nAll ${pass} billing checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  const mine = [];
  for (const u of users) {
    const { data: m } = await admin.from("members").select("account_id").eq("user_id", u);
    for (const x of m ?? []) {
      const { data: fs } = await admin.from("export_files").select("storage_key").eq("account_id", x.account_id);
      mine.push(...(fs ?? []).map((f) => f.storage_key));
    }
  }
  if (mine.length) await admin.storage.from("exports").remove(mine);
  for (const u of users) await admin.auth.admin.deleteUser(u);
  const { data: accs } = await admin.from("accounts").select("id").like("name", `bill-${tag}-%`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  await admin.from("paddle_events").delete().like("event_id", "evt_%");
  fakePaddle.close();
  await fake.close();
  console.log("cleaned up test data");
}
