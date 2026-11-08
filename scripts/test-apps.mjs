// Platform checks: sign-up metadata, app selection (onboarding), app switcher, QR preview app, access rules.
// Usage: npm run test:apps
import assert from "node:assert/strict";
// These suites test the product with billing off (everyone on the open limits), whatever is in .env.local.
for (const k of ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"]) process.env[k] = "";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const tag = randomUUID().slice(0, 8);
const users = [];
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };

async function mk(label, meta) {
  const email = `apps-${tag}-${label}@example.com`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  assert.ifError(error);
  users.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  const { data: acc } = await admin.from("accounts").select("name").eq("id", m.account_id).single();
  return { id: data.user.id, email, password, accountId: m.account_id, accountName: acc.name };
}
const appsOf = async (accountId) => (await admin.from("account_apps").select("app").eq("account_id", accountId)).data.map((r) => r.app).sort();

// ───────── database rules ─────────
const withCompany = await mk("co", { full_name: "Alex Morgan", company: "Northwind Active" });
assert.equal(withCompany.accountName, "Northwind Active");
const nameOnly = await mk("nm", { full_name: "Sam Lee" });
assert.equal(nameOnly.accountName, "Sam Lee");
const bare = await mk("bare", {});
assert.equal(bare.accountName, `apps-${tag}-bare`);
const long = await mk("long", { company: "x".repeat(200) });
assert.equal(long.accountName.length, 80);
ok("sign-up details name the account: company, else your name, else email prefix (capped at 80 characters)");

assert.deepEqual(await appsOf(withCompany.accountId), [], "new accounts start with no apps");
await admin.from("account_apps").insert([{ account_id: withCompany.accountId, app: "export" }]);
const a = anon();
await a.auth.signInWithPassword({ email: withCompany.email, password: withCompany.password });
assert.deepEqual((await a.from("account_apps").select("app")).data.map((r) => r.app), ["export"]);
const b = anon();
await b.auth.signInWithPassword({ email: nameOnly.email, password: nameOnly.password });
assert.deepEqual((await b.from("account_apps").select("app")).data, [], "other accounts can't see it");
assert.ok((await a.from("account_apps").insert({ account_id: withCompany.accountId, app: "export" })).error, "users can't write apps directly");
assert.ok((await a.from("account_apps").delete().eq("account_id", withCompany.accountId)).error, "users can't delete apps directly");
assert.ok((await admin.from("account_apps").insert({ account_id: withCompany.accountId, app: "hack" })).error, "only known apps are allowed");
const anonRead = await anon().from("account_apps").select("*");
assert.ok(anonRead.error || anonRead.data.length === 0);
await admin.from("account_apps").delete().eq("account_id", withCompany.accountId);
ok("apps: members read only their own; browsers can't write; unknown apps rejected");

// ───────── browser flow ─────────
const PORT = 3344;
const base = `http://localhost:${PORT}`;
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
assert.match(log, /Ready in/);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const login = async (page, u) => {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill('input[name=email]', u.email);
  await page.fill('input[name=password]', u.password);
  await page.click('button[type=submit]');
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Sign-up form shows the fields it should.
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('input[name=fullName]').isVisible());
  assert.ok(await page.locator('input[name=company]').isVisible());
  await page.click('[role=tab]:has-text("Log in")');
  assert.equal(await page.locator('input[name=fullName]').count(), 0);
  ok("sign-up asks for name and company; the log-in tab hides them");

  // Public site: one product, no mention of retired apps, old addresses still work.
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  for (const t of ["Klyroo Export", "£19", "£49", "£99", "Most popular"]) assert.ok(await page.locator(`text=${t}`).count() >= 1, t);
  assert.equal(await page.locator("text=/Klyroo QR|QR code/i").count(), 0, "no QR wording on the home page");
  for (const path of ["/apps/export", "/apps/qr", "/qr-code-generator"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, "/", `${path} redirects home`);
  }
  assert.equal((await fetch(`${base}/r/anything`, { redirect: "manual" })).status, 404, "short links are gone");
  ok("the home page is the Export product page; retired addresses redirect there; no QR wording remains");

  // First login: straight into Export, no app picker, Export switched on automatically.
  assert.deepEqual(await appsOf(withCompany.accountId), [], "new accounts start with no apps row");
  await login(page, withCompany);
  await page.waitForURL("**/export");
  await page.waitForSelector('aside:visible nav a:has-text("New export")');
  assert.deepEqual(await appsOf(withCompany.accountId), ["export"], "Export is switched on automatically");
  assert.deepEqual(await page.locator('aside:visible nav a').allTextContents(), ["Home", "New export", "History", "Stores", "Billing", "Account", "Help"], "Export's menu");
  assert.equal(await page.locator('aside button[aria-haspopup=menu]').count(), 0, "no app switcher");
  ok("a new account goes straight into Klyroo Export: no picker, Export switched on, one clean menu");

  // Retired routes are gone; old links and /app still land somewhere sensible.
  for (const path of ["/qr", "/onboarding", "/account/apps"]) assert.equal((await page.goto(`${base}${path}`)).status(), 404, `${path} is gone`);
  await page.goto(`${base}/app`);
  await page.waitForURL("**/export");
  ok("retired pages return 404 and /app goes to Export");

  // Account overview and the way back.
  await page.goto(`${base}/account`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('main a[href="/export/billing"]').count() === 1);
  await page.waitForSelector("text=Northwind Active");
  await page.click('aside:visible a:has-text("Back to Klyroo Export")');
  await page.waitForURL("**/export");
  await page.goto(`${base}/export/billing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Klyroo Export");
  ok("the account page shows the account name and billing link; the sidebar leads back to Export");

  // Signed-out visitors can't reach any signed-in area.
  const anonPage = await (await browser.newContext()).newPage();
  for (const path of ["/export", "/account", "/app"]) {
    await anonPage.goto(`${base}${path}`);
    await anonPage.waitForURL("**/login");
  }
  ok("every signed-in area requires a login");

  assert.deepEqual(errors, [], "no uncaught browser errors");
  ok("no uncaught errors in the browser");
  console.log(`\nAll ${pass} platform checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill("SIGTERM");
  for (const u of users) await admin.auth.admin.deleteUser(u);
  const { data: accs } = await admin.from("accounts").select("id").or(`name.like.apps-${tag}-%,name.eq.Northwind Active,name.eq.Sam Lee`);
  for (const x of accs ?? []) await admin.from("accounts").delete().eq("id", x.id);
  console.log("cleaned up test data");
}
