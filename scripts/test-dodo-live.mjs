// End-to-end test of billing against the DEPLOYED site and Dodo Payments TEST mode.
//   npm run test:dodo            (BASE defaults to https://useklyroo.com)
// Needs the deployed site to be in test_mode with the webhook configured. Creates throwaway users,
// buys a plan with Dodo's test card, then exercises the whole subscription lifecycle and cleans up.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const BASE = (process.env.BASE || "https://useklyroo.com").replace(/\/$/, "");
assert.match(process.env.DODO_PAYMENTS_API_KEY || "", /^dodo_test_/, "this test only runs against Dodo TEST mode");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const dodo = async (method, path, body) => {
  const r = await fetch(`https://test.dodopayments.com${path}`, { method, headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const tag = randomUUID().slice(0, 6);
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const users = [];
const accountIds = [];
const subsToCancel = new Set();

async function mkUser(label, app = "export") {
  const email = `dodo-e2e-${tag}-${label}@example.com`;
  const password = `Pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Dodo Tester" } });
  assert.ifError(error);
  users.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  await admin.from("account_apps").insert({ account_id: m.account_id, app });
  accountIds.push(m.account_id);
  return { email, password, accountId: m.account_id };
}
const getSub = async (accountId, app = "export") => (await admin.from("subscriptions").select("*").eq("account_id", accountId).eq("app", app).maybeSingle()).data;
async function waitFor(fn, what, ms = 90000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 2000)); }
  throw new Error(`timed out waiting for ${what}`);
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function login(page, u, app = "export") {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill("input[name=email]", u.email);
  await page.fill("input[name=password]", u.password);
  await page.click("button[type=submit]");
  await page.waitForURL(`**/${app}`, { timeout: 60000 });
}

/** Fills Dodo's hosted checkout with a test card ("success" or "failure") and presses Pay. */
async function payOnDodo(page, card) {
  await page.waitForURL(/checkout\.dodopayments\.com/, { timeout: 60000 });
  await page.waitForSelector('input[name=fullName]');
  await page.fill('input[name=fullName]', "Dodo Tester");
  await page.click("text=Enter address manually");
  await page.fill("input[name=addressLine]", "1 Test Street");
  await page.fill("input[name=city]", "London");
  await page.fill("input[name=zipCode]", "SW1A 1AA");
  await page.fill("input[name=state]", "London");
  await page.click('button:has-text("Continue to Payment")');
  await page.waitForSelector("text=Test Card", { timeout: 60000 });
  await waitFor(async () => { for (const f of page.frames()) if (await f.locator('input[placeholder="1234 1234 1234 1234"]').count().catch(() => 0)) return true; return false; }, "the secure card form", 60000);
  await page.click("text=Test Card");
  if (card === "failure") await page.click('button:has-text("Failure")');
  await page.click('button:has-text("Autofill")');
  const enabled = () => page.waitForFunction(() => { const b = document.querySelector("button#submit"); return b && !b.disabled; }, null, { timeout: 8000 }).then(() => true, () => false);
  if (!(await enabled())) {
    // Autofill didn't reach the secure iframe: type the test card in directly.
    const number = card === "failure" ? "4000000000000002" : "4242424242424242";
    for (const f of page.frames()) {
      const n = f.locator('input[placeholder="1234 1234 1234 1234"]');
      if (await n.count()) { await n.fill(number); await f.locator('input[placeholder="MM / YY"]').fill("0632"); await f.locator('input[placeholder="CVC"]').fill("123"); }
    }
    assert.ok(await enabled(), "Pay now became available");
  }
  await page.click('button:has-text("Pay now")');
}

try {
  // ───────── 1. Successful purchase with the 3-day trial ─────────
  const A = await mkUser("a");
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, A);
  await page.goto(`${BASE}/export/billing`, { waitUntil: "networkidle" });
  for (const t of ["£19", "£49", "£99"]) assert.ok(await page.locator(`text=${t}`).count() >= 1, t);
  await page.click('button:has-text("Choose Growth")');
  await page.waitForURL(/checkout\.dodopayments\.com/);
  assert.match(await page.locator("body").innerText(), /Klyroo Export Growth/);
  await page.waitForFunction(() => /3 days? free trial/i.test(document.body.innerText), null, { timeout: 60000 });
  assert.match(await page.locator("body").innerText(), /Total due today\s*\n?\s*\S{0,3}0\.00/);
  ok("checkout opens for Klyroo Export Growth, shows the 3-day free trial and $0 / £0 due today");

  await payOnDodo(page, "success");
  await page.waitForURL(new RegExp(`${BASE.replace(/[/.]/g, "\\$&")}/export/billing\\?checkout=done`), { timeout: 120000 });
  ok("after paying, the customer returns to Billing");

  const sub = await waitFor(async () => { const s = await getSub(A.accountId); return s && s.status === "active" ? s : null; }, "the webhook to activate the plan");
  assert.deepEqual([sub.plan, sub.app, sub.product_id], ["growth", "export", process.env.DODO_PRODUCT_EXPORT_GROWTH]);
  assert.match(sub.provider_subscription_id, /^sub_/);
  assert.match(sub.provider_customer_id, /^cus_/);
  subsToCancel.add(sub.provider_subscription_id);
  ok("the webhook was received (signature verified) and the account now has an active Growth subscription with the right metadata");

  const remote = await dodo("GET", `/subscriptions/${sub.provider_subscription_id}`);
  assert.equal(remote.trial_period_days, 3);
  assert.equal(remote.product_id, process.env.DODO_PRODUCT_EXPORT_GROWTH);
  assert.equal(remote.metadata.account_id, A.accountId);
  ok("Dodo confirms a 3-day trial on the right product, and the account id travelled through the checkout metadata");

  await page.goto(`${BASE}/export/billing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Your plan");
  const growthCard = page.locator("div", { has: page.locator("h2:has-text('Growth')") }).last();
  assert.ok(await page.locator("text=Current").count() >= 1);
  assert.equal(await page.locator('button:has-text("Choose Growth")').count(), 0, "no second checkout for the same plan");
  assert.ok(await page.locator('button:has-text("Switch to Scale")').count() === 1, "switching is offered instead");
  void growthCard;
  ok("the Billing page shows Growth as the current plan and offers Switch instead of a second purchase");

  // Entitlements really unlock: the plan limit is the paid one.
  const { getEntitlements } = await import("../src/lib/billing/entitlements.ts");
  assert.equal((await getEntitlements(A.accountId, "export")).plan, "growth");
  ok("access helper: the account gets the Growth plan (250,000 rows, 3 stores)");

  // ───────── 2. Customer portal ─────────
  await page.click('button:has-text("Manage payment method")');
  await page.waitForURL(/dodopayments\.com/, { timeout: 60000 });
  assert.ok(!page.url().startsWith(BASE));
  ok("Manage billing opens Dodo's customer portal");

  // ───────── 3. Plan change through the app ─────────
  await page.goto(`${BASE}/export/billing`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Switch to Scale")');
  const switched = await waitFor(async () => { const s = await getSub(A.accountId); return s && s.plan === "scale" ? s : null; }, "the plan change webhook", 120000);
  assert.equal(switched.product_id, process.env.DODO_PRODUCT_EXPORT_SCALE);
  assert.equal(switched.status, "active");
  ok("switching to Scale is applied by Dodo and mirrored from the webhook");

  // ───────── 4. Scheduled cancellation keeps access ─────────
  await dodo("PATCH", `/subscriptions/${sub.provider_subscription_id}`, { cancel_at_next_billing_date: true });
  const scheduled = await waitFor(async () => { const s = await getSub(A.accountId); return s && s.cancel_at_period_end ? s : null; }, "the scheduled-cancel webhook");
  assert.equal(scheduled.status, "active");
  assert.equal((await getEntitlements(A.accountId, "export")).plan, "scale", "a scheduled cancel does not remove access");
  await page.goto(`${BASE}/export/billing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Your plan ends on");
  ok("a scheduled cancellation is recorded, access continues, and the page says when the plan ends");

  // ───────── 5. Immediate cancellation removes access ─────────
  await dodo("PATCH", `/subscriptions/${sub.provider_subscription_id}`, { status: "cancelled" });
  const cancelled = await waitFor(async () => { const s = await getSub(A.accountId); return s && s.status === "canceled" ? s : null; }, "the cancel webhook");
  assert.equal(cancelled.cancel_at_period_end, false);
  assert.equal((await getEntitlements(A.accountId, "export")).plan, "free");
  ok("an immediate cancellation sets the status to canceled and the account falls back to Free");
  subsToCancel.delete(sub.provider_subscription_id);

  // ───────── 6. Declined card ─────────
  const B = await mkUser("b", "qr");
  const pageB = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  pageB.setDefaultTimeout(60000);
  await login(pageB, B, "qr");
  await pageB.goto(`${BASE}/qr/billing`, { waitUntil: "networkidle" });
  await pageB.click('button:has-text("Choose Pro")');
  await payOnDodo(pageB, "failure");
  await pageB.waitForTimeout(15000);
  assert.equal(await getSub(B.accountId, "qr"), null, "a declined payment creates no subscription");
  assert.match(pageB.url(), /checkout\.dodopayments\.com|billing/);
  ok("a declined test card creates no subscription (QR Pro)");

  assert.deepEqual(errors, [], "no uncaught browser errors");
  ok("no uncaught errors in the browser");
  console.log(`\nAll ${pass} live Dodo checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  for (const id of subsToCancel) await dodo("PATCH", `/subscriptions/${id}`, { status: "cancelled" }).catch(() => undefined);
  for (const id of users) await admin.auth.admin.deleteUser(id);
  for (const id of accountIds) await admin.from("accounts").delete().eq("id", id);
  console.log("cleaned up test data");
}
