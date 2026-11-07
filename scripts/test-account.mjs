// Account security in a real browser: password reset, change password, account deletion.
// Usage: npm run test:account
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const tag = randomUUID().slice(0, 8);
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const created = [];

async function mk(label) {
  const email = `acct-${tag}-${label}@example.com`;
  const password = `Old-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Test User" } });
  assert.ifError(error);
  created.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  await admin.from("account_apps").insert({ account_id: m.account_id, app: "export" });
  return { id: data.user.id, email, password, accountId: m.account_id };
}
const canLogin = async (email, password) => !(await anon().auth.signInWithPassword({ email, password })).error;

// Fake Dodo: records the calls made when an account is deleted.
const dodoCalls = [];
const fakeDodo = http.createServer((req, res) => {
  let d = "";
  req.on("data", (c) => (d += c));
  req.on("end", () => { dodoCalls.push({ method: req.method, url: req.url, body: d ? JSON.parse(d) : null }); res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); });
});
await new Promise((r) => fakeDodo.listen(0, "127.0.0.1", r));

const port = 3351;
const ADMIN = `acct-${tag}-admin@example.com`;
const env = {
  ADMIN_EMAILS: ADMIN,
  ...process.env, NODE_ENV: "development",
  DODO_PAYMENTS_ENVIRONMENT: "test_mode", DODO_PAYMENTS_API_KEY: "dodo_test_key", DODO_PAYMENTS_WEBHOOK_KEY: "whsec_dGVzdA==",
  DODO_API_BASE: `http://127.0.0.1:${fakeDodo.address().port}`, DODO_PRODUCT_EXPORT_STARTER: "pdt_starter01",
};
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
assert.match(log, /Ready in/, "server started");
const base = `http://localhost:${port}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function login(page, u) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill("input[name=email]", u.email);
  await page.fill("input[name=password]", u.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/export", { timeout: 60000 });
}

try {
  const page = await (await browser.newContext()).newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Forgot-password entry points.
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.click("text=Forgot your password?");
  await page.waitForURL("**/forgot-password");
  await page.fill("input[name=email]", "not-an-email");
  await page.evaluate(() => document.querySelector("input[name=email]").removeAttribute("type"));
  await page.click('button:has-text("Send reset link")');
  await page.waitForSelector("text=Enter a valid email address");
  ok("the login page links to password reset, which validates the email");

  // A bad or reused link is explained, not a crash.
  await page.goto(`${base}/auth/callback?token_hash=nonsense&type=recovery`, { waitUntil: "networkidle" });
  await page.waitForURL("**/login?link=expired");
  await page.click('[role=tab]:has-text("Log in")');
  await page.waitForSelector("text=expired or was already used");
  await page.goto(`${base}/reset-password`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=reset link has expired");
  ok("an invalid reset link and /reset-password without a session explain what to do");

  // Real recovery link (token hash flow), then choose a new password.
  const A = await mk("a");
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "recovery", email: A.email });
  assert.ifError(linkErr);
  await page.goto(`${base}/auth/callback?token_hash=${link.properties.hashed_token}&type=recovery`, { waitUntil: "networkidle" });
  await page.waitForURL("**/reset-password");
  await page.waitForSelector(`text=${A.email}`);
  await page.fill("input[name=password]", "short");
  await page.fill("input[name=confirm]", "short");
  await page.evaluate(() => document.querySelectorAll("input").forEach((i) => i.removeAttribute("minlength")));
  await page.click('button:has-text("Save new password")');
  await page.waitForSelector("text=Use a password of at least 10 characters");
  await page.waitForFunction(() => document.querySelector("input[name=password]").value === ""); // React resets the form after an action
  await page.fill("input[name=password]", "A-brand-new-pass-1");
  await page.fill("input[name=confirm]", "A-different-pass-2");
  await page.click('button:has-text("Save new password")');
  await page.waitForSelector("text=/passwords don.t match/");
  await page.waitForFunction(() => document.querySelector("input[name=password]").value === "");
  await page.fill("input[name=password]", "A-brand-new-pass-1");
  await page.fill("input[name=confirm]", "A-brand-new-pass-1");
  await page.click('button:has-text("Save new password")');
  await page.waitForURL("**/export", { timeout: 60000 });
  assert.ok(await canLogin(A.email, "A-brand-new-pass-1"), "new password works");
  assert.ok(!(await canLogin(A.email, A.password)), "old password no longer works");
  ok("a recovery link lets you set a new password (validated), signs you in, and replaces the old one");

  // Change password from the account page.
  await page.goto(`${base}/account`, { waitUntil: "networkidle" });
  const form = page.locator("form", { has: page.locator("input[name=current]") });
  await form.locator("input[name=current]").fill("wrong-password-123");
  await form.locator("input[name=next]").fill("Changed-pass-2025!");
  await form.locator("input[name=confirm]").fill("Changed-pass-2025!");
  await form.locator("button[type=submit]").click();
  await page.waitForSelector("text=current password is incorrect");
  await page.waitForFunction(() => document.querySelector("input[name=current]").value === ""); // the form resets after an action
  await form.locator("input[name=current]").fill("A-brand-new-pass-1");
  await form.locator("input[name=next]").fill("Changed-pass-2025!");
  await form.locator("input[name=confirm]").fill("Changed-pass-2025!");
  await form.locator("button[type=submit]").click();
  await page.waitForSelector("text=Password changed.");
  assert.ok(await canLogin(A.email, "Changed-pass-2025!"));
  ok("change password: wrong current password is refused; the right one changes it");

  // Delete the account: needs the email and password, cancels the subscription first.
  await admin.from("subscriptions").insert({ account_id: A.accountId, app: "export", provider_subscription_id: "sub_del01", provider_customer_id: "cus_del01", product_id: "pdt_starter01", plan: "starter", status: "active" });
  await page.click('button:has-text("Delete my account")');
  const del = page.locator("form", { has: page.locator("input[type=email][name=email]") });
  await del.locator("input[name=email]").fill("someone-else@example.com");
  await del.locator("input[name=password]").fill("Changed-pass-2025!");
  await del.locator("button[type=submit]").click();
  await page.waitForSelector("text=Type your account email exactly");
  await page.waitForFunction(() => document.querySelector("form input[type=email][name=email]").value === "");
  await del.locator("input[name=email]").fill(A.email);
  await del.locator("input[name=password]").fill("not-the-password");
  await del.locator("button[type=submit]").click();
  await page.waitForSelector("text=password is incorrect");
  await page.waitForFunction(() => document.querySelector("form input[type=email][name=email]").value === "");
  assert.ok((await admin.from("accounts").select("id").eq("id", A.accountId).maybeSingle()).data, "nothing deleted after refusals");
  assert.equal(dodoCalls.length, 0, "no billing call before confirmation");
  await del.locator("input[name=email]").fill(A.email);
  await del.locator("input[name=password]").fill("Changed-pass-2025!");
  await del.locator("button[type=submit]").click();
  await page.waitForURL(/\/\?account=deleted/, { timeout: 60000 });
  const patch = dodoCalls.find((c) => c.method === "PATCH");
  assert.equal(patch.url, "/subscriptions/sub_del01");
  assert.equal(patch.body.status, "cancelled");
  assert.equal((await admin.from("accounts").select("id").eq("id", A.accountId).maybeSingle()).data, null, "account gone");
  assert.equal((await admin.from("subscriptions").select("id").eq("account_id", A.accountId)).data.length, 0);
  assert.ok(!(await canLogin(A.email, "Changed-pass-2025!")), "sign-in user gone");
  ok("delete account: needs email + password, cancels the subscription first, then removes the account and the login");

  // Owner admin page: only emails in ADMIN_EMAILS.
  const adm = { ...(await mk("admin")), email: ADMIN };
  await admin.auth.admin.updateUserById(adm.id, { email: ADMIN, password: adm.password });
  const plain = await mk("plain");
  const ctxAdmin = await browser.newContext();
  const pAdmin = await ctxAdmin.newPage();
  pAdmin.setDefaultTimeout(60000);
  await login(pAdmin, adm);
  await pAdmin.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await pAdmin.waitForSelector("h1:has-text('Klyroo admin')");
  await pAdmin.waitForSelector("text=Paid subscriptions");
  const pPlain = await (await browser.newContext()).newPage();
  pPlain.setDefaultTimeout(60000);
  await login(pPlain, plain);
  const resp = await pPlain.goto(`${base}/admin`, { waitUntil: "networkidle" });
  assert.equal(resp.status(), 404);
  ok("the admin overview opens for listed admin emails only; everyone else gets a 404");

  // A signed-out visitor can't use the account area.
  const anonPage = await (await browser.newContext()).newPage();
  await anonPage.goto(`${base}/account`, { waitUntil: "networkidle" });
  assert.match(anonPage.url(), /\/login$/);
  ok("signed-out visitors are sent to log in");

  assert.deepEqual(errors, [], "no uncaught browser errors");
  ok("no uncaught errors in the browser");
  console.log(`\nAll ${pass} account checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill("SIGTERM");
  fakeDodo.close();
  for (const id of created) await admin.auth.admin.deleteUser(id);
  const { data: accs } = await admin.from("accounts").select("id").like("name", `%acct-${tag}%`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  console.log("cleaned up test data");
}
