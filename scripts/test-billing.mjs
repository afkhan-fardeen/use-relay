// Billing tests: webhook security, subscription state, plan limits, Dodo API calls.
// Uses the real Supabase project and a fake Paddle/Shopify. Usage: npm run test:billing
import assert from "node:assert/strict";
import http from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { startFakeShopify } from "./fake-shopify.mjs";

process.env.NODE_ENV = "test";
process.env.DODO_PAYMENTS_ENVIRONMENT = "test_mode";
process.env.DODO_PAYMENTS_WEBHOOK_KEY = "whsec_" + Buffer.from("test-signing-secret-0123456789ab").toString("base64");
process.env.DODO_PRODUCT_EXPORT_STARTER = "pdt_starter01";
process.env.DODO_PRODUCT_EXPORT_GROWTH = "pdt_growth01";
process.env.DODO_PRODUCT_EXPORT_SCALE = "pdt_scale01";
process.env.DODO_PAYMENTS_API_KEY = "dodo_test_key"; // never the real key: all API calls go to a local fake

const paddle = await import("../src/lib/billing/dodo.ts");
const { processDodoWebhook } = await import("../src/lib/billing/webhook.ts");
const { getEntitlements, planFor } = await import("../src/lib/billing/entitlements.ts");
const { encryptSecret } = await import("../src/lib/crypto.ts");
const { drainQueue } = await import("../src/lib/export/queue.ts");

let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const SECRET = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const keyOf = (secret) => Buffer.from(secret.slice(6), "base64");
// Standard Webhooks headers: webhook-id, webhook-timestamp, webhook-signature ("v1,<base64 hmac of id.ts.body>").
const sign = (body, ts = Math.floor(Date.now() / 1000), secret = SECRET, id = `msg_${randomUUID().replace(/-/g, "")}`) => ({
  id, timestamp: String(ts), signature: `v1,${createHmac("sha256", keyOf(secret)).update(`${id}.${ts}.${body}`).digest("base64")}`,
});

// ───────── pure checks ─────────
{
  const body = '{"a":1}';
  const v = (h) => paddle.verifyDodoSignature(body, h, SECRET);
  assert.deepEqual(v(sign(body)), { ok: true });
  assert.equal(paddle.verifyDodoSignature(body + " ", sign(body), SECRET).reason, "bad_signature");
  assert.equal(v(sign(body, undefined, "whsec_" + Buffer.from("another-secret").toString("base64"))).reason, "bad_signature");
  const old = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(v(sign(body, old)).reason, "stale_timestamp");
  assert.equal(v({ id: "msg_1", timestamp: "abc", signature: "v1,x" }).reason, "malformed_signature");
  assert.equal(v({ id: null, timestamp: null, signature: null }).reason, "missing_signature");
  assert.equal(v({ ...sign(body), signature: "v1,AAAA" }).reason, "bad_signature");
  assert.equal(v({ ...sign(body), signature: "v2," + sign(body).signature.slice(3) }).reason, "bad_signature", "only v1 signatures count");
  // Rotation: the header can carry several signatures; any valid one is enough.
  const good = sign(body);
  assert.deepEqual(v({ ...good, signature: `v1,AAAA ${good.signature}` }), { ok: true });
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
  assert.equal(planFor("export", { plan: "starter", status: "past_due", current_period_end: past }), "starter", "past_due keeps access while payment is retried");
  assert.equal(planFor("export", { plan: "growth", status: "canceled", current_period_end: future }), "growth", "canceled keeps access until the period ends");
  assert.equal(planFor("export", { plan: "growth", status: "canceled", current_period_end: past }), "free");
  assert.equal(planFor("export", { plan: "growth", status: "paused", current_period_end: future }), "free");
  assert.equal(planFor("export", { plan: "weird", status: "active", current_period_end: future }), "free");
}
ok("plan rules: active/trialing/past_due keep the plan; canceled until period end; paused or unknown falls to free");

{
  const saved = { ...process.env };
  delete process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  assert.equal(paddle.billingConfigured("export"), false);
  const ent = await getEntitlements(randomUUID());
  assert.equal(ent.plan, "beta");
  assert.equal(ent.billingOn, false);
  Object.assign(process.env, saved);
  assert.equal(paddle.billingConfigured("export"), true);
  const res = await processDodoWebhook("{}", sign("{}"));
  assert.equal(res.status, 400, "once configured, requests are processed (an empty event is a 400, not a 503)");
}
ok("billing is off (beta limits) until billing is configured");

// ───────── fake Dodo API ─────────
const calls = [];
const fakeDodo = http.createServer((req, res) => {
  let d = "";
  req.on("data", (c) => (d += c));
  req.on("end", () => {
    calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: d ? JSON.parse(d) : null });
    res.writeHead(200, { "content-type": "application/json" });
    if (req.url.includes("customer-portal")) return res.end(JSON.stringify({ link: "https://test.customer.dodopayments.com/session/abc" }));
    if (req.url === "/checkouts") return res.end(JSON.stringify({ session_id: "cks_x", checkout_url: "https://test.checkout.dodopayments.com/session/cks_x" }));
    res.end(JSON.stringify({}));
  });
});
await new Promise((r) => fakeDodo.listen(0, "127.0.0.1", r));
process.env.DODO_API_BASE = `http://127.0.0.1:${fakeDodo.address().port}`;

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
const DODO_STATUS = { active: "active", past_due: "past_due", canceled: "cancelled", paused: "paused", on_hold: "on_hold", pending: "pending" };
const subEvent = (type, { subId = "sub_01abc", status = "active", price = "pdt_growth01", custom, at = new Date().toISOString(), extra = {} } = {}) =>
  JSON.stringify({
    business_id: "bus_test", type, timestamp: at,
    data: { payload_type: "Subscription", subscription_id: subId, status: DODO_STATUS[status] ?? status, product_id: price, customer: { customer_id: "cus_01abc", email: "x@example.com" }, metadata: custom, next_billing_date: new Date(Date.now() + 30 * 86_400_000).toISOString(), cancel_at_next_billing_date: false, ...extra },
  });
const send = (body, headers = sign(body)) => processDodoWebhook(body, headers);
const getSub = async (accountId) => (await admin.from("subscriptions").select("*").eq("account_id", accountId).maybeSingle()).data;
const custom = (acc) => ({ account_id: acc, sig: paddle.signAccount(acc) });

try {
  const A = await mkAccount("a");
  const B = await mkAccount("b");

  // Rejections and noise.
  let r = await send(subEvent("subscription.created", { custom: custom(A.accountId) }), { ...sign("x"), signature: "v1,AAAA" });
  assert.equal(r.status, 401);
  assert.equal(await getSub(A.accountId), null);
  r = await send("not json");
  assert.equal(r.status, 400);
  r = await send(JSON.stringify({ nothing: "x" }));
  assert.equal(r.status, 400);
  r = await send(JSON.stringify({ type: "payment.succeeded", data: { payload_type: "Payment" } }));
  assert.deepEqual([r.status, r.body.ignored], [200, true]);
  ok("webhook: bad signature is rejected (nothing stored); bad JSON and missing fields rejected; unrelated events acknowledged");

  // Created → pro.
  const created = subEvent("subscription.created", { custom: custom(A.accountId) });
  const createdHeaders = sign(created);
  r = await send(created, createdHeaders);
  assert.deepEqual([r.status, r.body.applied], [200, true], JSON.stringify(r.body));
  let sub = await getSub(A.accountId);
  assert.deepEqual([sub.plan, sub.status, sub.provider_subscription_id, sub.provider_customer_id], ["growth", "active", "sub_01abc", "cus_01abc"]);
  assert.equal((await getEntitlements(A.accountId)).plan, "growth");
  ok("webhook: a signed subscription.created activates the plan for the right account");

  // Duplicate delivery.
  const before = (await getSub(A.accountId)).updated_at;
  r = await send(created, createdHeaders);
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
  await send(subEvent("subscription.updated", { custom: custom(A.accountId), status: "active", at: new Date(Date.now() + 10_000).toISOString(), extra: { cancel_at_next_billing_date: true } }));
  sub = await getSub(A.accountId);
  assert.deepEqual([sub.status, sub.cancel_at_period_end], ["active", true]);
  assert.equal((await getEntitlements(A.accountId)).plan, "growth", "a scheduled cancel does not remove access");
  await send(subEvent("subscription.cancelled", { custom: custom(A.accountId), status: "canceled", at: new Date(Date.now() + 20_000).toISOString() }));
  sub = await getSub(A.accountId);
  assert.deepEqual([sub.status, sub.cancel_at_period_end], ["canceled", false]);
  assert.equal((await getEntitlements(A.accountId)).plan, "free", "a real cancellation ends paid access");
  ok("webhook: a scheduled cancel keeps access; the final cancellation drops the account to free");

  // A declined first payment (status "failed" before any subscription existed) records nothing.
  r = await send(subEvent("subscription.failed", { subId: "sub_declined", status: "failed", custom: custom(A.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "failed before activation"]);
  assert.equal((await admin.from("subscriptions").select("id").eq("provider_subscription_id", "sub_declined")).data.length, 0);
  ok("webhook: a declined first payment records no subscription");

  // Failed renewals: on_hold has no access; an unpaid (pending) subscription is not recorded.
  await send(subEvent("subscription.on_hold", { subId: "sub_hold", price: "pdt_starter01", status: "on_hold", custom: custom((await mkAccount("h")).accountId) }));
  r = await send(subEvent("subscription.updated", { subId: "sub_pend", status: "pending", custom: custom(A.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "pending"]);
  ok("webhook: on_hold records no access; pending subscriptions are not recorded");

  // Forged account in checkout metadata.
  r = await send(subEvent("subscription.created", { subId: "sub_forged", custom: { account_id: B.accountId, sig: "f".repeat(64) } }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "unverified account"]);
  r = await send(subEvent("subscription.created", { subId: "sub_nosig", custom: { account_id: B.accountId } }));
  assert.equal(r.body.applied, false);
  r = await send(subEvent("subscription.created", { subId: "sub_other", custom: custom(randomUUID()) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "account not found"]);
  assert.equal(await getSub(B.accountId), null);
  ok("webhook: forged or missing account signatures never grant a plan");

  // Unknown price.
  r = await send(subEvent("subscription.created", { subId: "sub_unk", price: "pdt_unknown", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "unknown product"]);
  assert.equal(await getSub(B.accountId), null);
  ok("webhook: subscriptions for products we don't sell are ignored");

  // One active subscription per account.
  r = await send(subEvent("subscription.created", { subId: "sub_b1", price: "pdt_starter01", custom: custom(B.accountId) }));
  assert.equal(r.body.applied, true);
  r = await send(subEvent("subscription.created", { subId: "sub_b2", price: "pdt_scale01", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "account already has an active subscription"]);
  assert.equal((await getSub(B.accountId)).plan, "starter");
  // A known subscription's later events don't need to re-prove the account (plan switch through the provider).
  r = await send(subEvent("subscription.updated", { subId: "sub_b1", price: "pdt_scale01", custom: undefined, at: new Date(Date.now() + 30_000).toISOString() }));
  assert.equal(r.body.applied, true);
  assert.equal((await getSub(B.accountId)).plan, "scale");
  ok("webhook: one active subscription per account; plan switches on a known subscription update the plan");

  // A retired product (an old QR plan, say) is ignored and never touches the account's Export plan.
  r = await send(subEvent("subscription.created", { subId: "sub_b_old", price: "pdt_qrpro01", custom: custom(B.accountId) }));
  assert.deepEqual([r.body.applied, r.body.reason], [false, "unknown product"]);
  assert.equal((await getEntitlements(B.accountId, "export")).plan, "scale");
  ok("webhook: events for products we no longer sell are ignored and leave the Export plan alone");

  // Event log.
  const { data: evs } = await admin.from("billing_events").select("status").like("event_id", "msg_%").limit(200);
  assert.ok(evs.some((e) => e.status === "processed") && evs.some((e) => e.status === "ignored"));
  ok("every delivery is recorded for audit");

  // RLS on subscriptions.
  const ua = anon();
  await ua.auth.signInWithPassword({ email: B.email, password: B.password });
  const own = await ua.from("subscriptions").select("plan");
  assert.deepEqual(own.data.map((x) => x.plan).sort(), ["scale"]);
  const other = anon();
  await other.auth.signInWithPassword({ email: A.email, password: A.password });
  const theirs = await other.from("subscriptions").select("plan");
  assert.deepEqual(theirs.data.map((x) => x.plan), ["growth"], "A sees only A's row");
  const tamper = await ua.from("subscriptions").update({ plan: "scale" }).eq("account_id", B.accountId);
  assert.ok(tamper.error, "users cannot edit subscriptions");
  const anonRead = await anon().from("subscriptions").select("*");
  assert.ok(anonRead.error || anonRead.data.length === 0, "anonymous sees nothing");
  const ev = await ua.from("billing_events").select("*");
  assert.ok(ev.error || ev.data.length === 0, "event log is server-only");
  ok("subscriptions: members read only their own; nobody can edit them or read the event log from the browser");

  // Dodo API calls.
  const url = await paddle.createPortalLink("cus_01abc");
  assert.equal(url, "https://test.customer.dodopayments.com/session/abc");
  const pc = calls.find((c) => c.url.includes("customer-portal"));
  assert.equal(pc.method, "POST");
  assert.equal(pc.url, "/customers/cus_01abc/customer-portal/session");
  assert.equal(pc.auth, "Bearer dodo_test_key");
  assert.equal(await paddle.createPortalLink("not-a-customer"), null);
  const ch = await paddle.changeSubscriptionPlan("sub_01abc", "pdt_growth01");
  assert.deepEqual(ch, { ok: true });
  const cp = calls.find((c) => c.url.includes("change-plan"));
  assert.equal(cp.url, "/subscriptions/sub_01abc/change-plan");
  assert.deepEqual(cp.body, { product_id: "pdt_growth01", quantity: 1, proration_billing_mode: "prorated_immediately" });
  assert.equal((await paddle.changeSubscriptionPlan("../evil", "pdt_growth01")).ok, false);
  const co = await paddle.createCheckout({ productId: "pdt_growth01", email: "a@example.com", accountId: A.accountId, app: "export", plan: "growth", returnUrl: "https://useklyroo.com/export/billing?checkout=done" });
  assert.deepEqual(co, { ok: true, url: "https://test.checkout.dodopayments.com/session/cks_x" });
  const cc = calls.find((c) => c.url === "/checkouts");
  assert.deepEqual(cc.body.product_cart, [{ product_id: "pdt_growth01", quantity: 1 }]);
  assert.equal(cc.body.return_url, "https://useklyroo.com/export/billing?checkout=done");
  assert.deepEqual([cc.body.metadata.account_id, cc.body.metadata.app, cc.body.metadata.plan], [A.accountId, "export", "growth"]);
  assert.ok(paddle.verifyAccountSignature(cc.body.metadata.account_id, cc.body.metadata.sig), "checkout metadata carries a valid signed account id");
  ok("Dodo API: checkout, portal link and prorated plan change send the right requests; malformed IDs are refused");

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

  await send(subEvent("subscription.created", { subId: "sub_c1", price: "pdt_starter01", custom: custom(C.accountId) }));
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
  await admin.from("billing_events").delete().like("event_id", "msg_%");
  fakeDodo.close();
  await fake.close();
  console.log("cleaned up test data");
}
