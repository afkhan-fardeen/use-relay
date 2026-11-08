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
const wantsQr = await mk("qr", { full_name: "Quinn Ray", preferred_app: "qr" });
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
assert.ok((await a.from("account_apps").insert({ account_id: withCompany.accountId, app: "qr" })).error, "users can't write apps directly");
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

  // Sign-up form shows the new fields and remembers which app the visitor came for.
  await page.goto(`${base}/login?app=qr`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('input[name=fullName]').isVisible());
  assert.ok(await page.locator('input[name=company]').isVisible());
  assert.equal(await page.locator('input[type=hidden][name=app][value=qr]').count(), 1);
  await page.click('[role=tab]:has-text("Log in")');
  assert.equal(await page.locator('input[name=fullName]').count(), 0);
  ok("sign-up asks for name and company and remembers the app the visitor came for");

  // Public pages: company home plus a product page per app.
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  for (const t of ["Klyroo Export", "Klyroo QR", "Own plan".length ? "Start with Export" : ""]) assert.ok(await page.locator(`text=${t}`).count() >= 1, t);
  await page.goto(`${base}/apps/export`, { waitUntil: "networkidle" });
  for (const t of ["£19", "£49", "£99", "Most popular"]) assert.ok(await page.locator(`text=${t}`).count() >= 1, t);
  await page.goto(`${base}/apps/qr`, { waitUntil: "networkidle" });
  assert.ok(await page.locator("text=Make a free QR code").count() >= 1);
  ok("company home lists both apps; Export page shows the £19 / £49 / £99 plans; QR has its own page");

  // Onboarding: pick ONE app to start with.
  await login(page, withCompany);
  await page.waitForURL("**/onboarding");
  await page.waitForSelector("h1:has-text('Welcome, Alex.')");
  assert.deepEqual(await page.locator('input[type=radio]:checked').evaluateAll((e) => e.map((x) => x.getAttribute("aria-label"))), ["Klyroo Export"]);
  ok("a new account is sent to onboarding, greeted by first name, with Export preselected");

  await page.locator('label:has-text("Klyroo QR")').first().click();
  await page.click('button:has-text("Continue")');
  await page.waitForURL("**/qr");
  assert.deepEqual(await appsOf(withCompany.accountId), ["qr"]);
  ok("choosing QR starts QR on its own: only that app is switched on");

  // Separation: Export isn't on, so its pages are closed and QR billing is its own.
  await page.goto(`${base}/export`);
  await page.waitForURL("**/account/apps");
  await page.goto(`${base}/qr/billing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Klyroo QR");
  assert.equal(await page.locator('aside:visible nav a:has-text("Schedules")').count(), 0);
  ok("an app that isn't switched on is closed (sent to Apps); QR shows only QR's menu and billing");

  // Add Export from the Apps page (multi-select), keep QR.
  await page.goto(`${base}/account/apps`, { waitUntil: "networkidle" });
  await page.locator('label:has-text("Klyroo Export")').first().click();
  await page.click('button:has-text("Save apps")');
  await page.waitForSelector('[role=status]:has-text("Saved.")');
  assert.deepEqual(await appsOf(withCompany.accountId), ["export", "qr"]);
  ok("adding a second app from Apps keeps the first");

  // Switcher moves between separate apps, each with its own menu and billing.
  await page.goto(`${base}/qr`, { waitUntil: "networkidle" });
  await page.click('aside button[aria-haspopup=menu]');
  const items = await page.locator('[role=menuitem]').allTextContents();
  assert.ok(items.some((t) => t.includes("Klyroo Export")) && items.some((t) => t.includes("Klyroo QR")) && items.some((t) => t.includes("Account")), items.join("|"));
  await page.click('[role=menuitem]:has-text("Klyroo Export")');
  await page.waitForURL("**/export");
  await page.waitForSelector('aside:visible nav a:has-text("New export")');
  assert.ok(await page.locator('aside:visible nav a:has-text("New export")').count() === 1);
  assert.deepEqual(await page.locator('aside:visible nav a').allTextContents(), ["Home", "New export", "History", "Stores", "Billing", "Help"], "Export shows only Export's menu");
  await page.goto(`${base}/export/billing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Klyroo Export");
  ok("the app switcher moves between apps; each app has its own menu and billing page");

  // Account overview shows both apps with their own billing links.
  await page.goto(`${base}/account`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('main a[href="/export/billing"]').count() === 1 && await page.locator('main a[href="/qr/billing"]').count() === 1);
  await page.waitForSelector("text=Northwind Active");
  ok("account page shows the account name and a separate billing link per app");

  // QR app end to end: static save, dynamic save, redirect, scan counting, switch-off.
  await page.goto(`${base}/qr/new`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder*="https"]', "https://example.com/static");
  await page.waitForSelector("[aria-label=\"QR code preview\"] svg");
  await page.click('button:has-text("Save to my codes")');
  await page.waitForURL(/\/qr\/[0-9a-f-]{36}/);
  ok("a static QR code can be saved");
  await page.goto(`${base}/qr/new`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder*="https"]', "https://example.com/landing");
  await page.click('[role=radio]:has-text("Dynamic")');
  const slug = `t${tag}`;
  await page.fill('input[placeholder="spring-sale"]', slug);
  await page.click('button:has-text("Save dynamic code")');
  await page.waitForURL(/\/qr\/[0-9a-f-]{36}/);
  const dynId = page.url().split("/").pop();
  const hit = await fetch(`${base}/r/${slug}`, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" } });
  assert.equal(hit.status, 302);
  assert.equal(hit.headers.get("location"), "https://example.com/landing");
  let scans = 0;
  for (let i = 0; i < 10 && !scans; i++) { scans = (await admin.from("qr_scans").select("id", { count: "exact", head: true }).eq("code_id", dynId)).count || 0; if (!scans) await new Promise((r) => setTimeout(r, 500)); }
  assert.equal(scans, 1, "one scan recorded");
  ok("a dynamic code redirects to its destination and the scan is recorded");
  await admin.from("qr_codes").update({ active: false }).eq("id", dynId);
  const off = await fetch(`${base}/r/${slug}`, { redirect: "manual" });
  assert.notEqual(off.status, 302);
  const missing = await fetch(`${base}/r/does-not-exist-${tag}`, { redirect: "manual" });
  assert.equal(missing.status, 404);
  ok("a switched-off code and an unknown code do not redirect");

  // Manage apps: can't switch everything off; turning one off hides it.
  await page.goto(`${base}/account/apps`, { waitUntil: "networkidle" });
  await page.locator('label:has-text("Klyroo Export")').first().click();
  await page.locator('label:has-text("Klyroo QR")').first().click();
  await page.click('button:has-text("Save apps")');
  await page.waitForSelector('[role=alert]:has-text("at least one app")');
  assert.deepEqual(await appsOf(withCompany.accountId), ["export", "qr"]);
  await page.locator('label:has-text("Klyroo QR")').first().click(); // both were off: switch QR back on, leave Export off
  await page.click('button:has-text("Save apps")');
  await page.waitForSelector('[role=status]:has-text("Saved.")');
  assert.deepEqual(await appsOf(withCompany.accountId), ["qr"]);
  await page.goto(`${base}/app`);
  await page.waitForURL("**/qr");
  ok("you can't switch every app off; turning one off hides it and /app goes to the one that is on");

  // Visitor who came for QR is preselected on QR.
  const p3 = await (await browser.newContext()).newPage();
  p3.setDefaultTimeout(60000);
  await login(p3, wantsQr);
  await p3.waitForURL("**/onboarding");
  await p3.waitForSelector("h1:has-text('Welcome, Quinn.')");
  assert.deepEqual(await p3.locator('input[type=radio]:checked').evaluateAll((e) => e.map((x) => x.getAttribute("aria-label"))), ["Klyroo QR"]);
  ok("a visitor who signed up from the QR page lands with QR preselected");

  // Accounts that already chose skip onboarding.
  await admin.from("account_apps").insert({ account_id: nameOnly.accountId, app: "export" });
  const p2 = await (await browser.newContext()).newPage();
  p2.setDefaultTimeout(60000);
  await login(p2, nameOnly);
  await p2.waitForURL("**/export");
  await p2.goto(`${base}/onboarding`);
  await p2.waitForURL("**/export");
  ok("accounts that already chose an app skip onboarding");

  // Signed-out visitors can't reach any signed-in area.
  const anonPage = await (await browser.newContext()).newPage();
  for (const path of ["/onboarding", "/export", "/qr", "/account", "/app"]) {
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
  const { data: accs } = await admin.from("accounts").select("id").or(`name.like.apps-${tag}-%,name.eq.Northwind Active,name.eq.Sam Lee,name.eq.Quinn Ray`);
  for (const x of accs ?? []) await admin.from("accounts").delete().eq("id", x.id);
  console.log("cleaned up test data");
}
