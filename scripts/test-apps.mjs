// Platform checks: sign-up metadata, app selection (onboarding), app switcher, QR preview app, access rules.
// Usage: npm run test:apps
import assert from "node:assert/strict";
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

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Sign-up form shows the new fields.
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('input[name=fullName]').isVisible());
  assert.ok(await page.locator('input[name=company]').isVisible());
  await page.click('[role=tab]:has-text("Log in")');
  assert.equal(await page.locator('input[name=fullName]').count(), 0);
  ok("sign-up asks for name and company; the log-in tab doesn't");

  // Onboarding.
  await page.fill('input[name=email]', withCompany.email);
  await page.fill('input[name=password]', withCompany.password);
  await page.click('button[type=submit]');
  await page.waitForURL("**/onboarding");
  await page.waitForSelector("h1:has-text('Welcome, Alex.')");
  ok("a new account is sent to onboarding and greeted by first name");

  await page.locator('label:has-text("Export")').first().click(); // untick the default
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('[role=alert]:has-text("at least one app")');
  assert.deepEqual(await appsOf(withCompany.accountId), []);
  ok("continuing with no app chosen is refused");

  await page.locator('label:has-text("Export")').first().click();
  await page.locator('label:has-text("QR Codes")').first().click();
  await page.click('button:has-text("Continue")');
  await page.waitForURL("**/app/stores");
  assert.deepEqual(await appsOf(withCompany.accountId), ["export", "qr"]);
  ok("choosing both apps saves them and opens Export");

  // App switcher.
  await page.goto(`${base}/app`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('aside nav a:has-text("New export")').count() === 1);
  await page.click('aside button[aria-haspopup=menu]');
  const items = await page.locator('[role=menuitem]').allTextContents();
  assert.ok(items.some((t) => t.includes("Export")) && items.some((t) => t.includes("QR Codes")) && items.some((t) => /Add or remove/.test(t)), items.join("|"));
  await page.click('[role=menuitem]:has-text("QR Codes")');
  await page.waitForURL("**/app/qr");
  assert.ok(await page.locator('aside nav a:has-text("My codes")').count() === 1);
  assert.equal(await page.locator('aside nav a:has-text("Schedules")').count(), 0);
  ok("app switcher moves between apps and the menu follows the app");

  // QR preview app.
  await page.waitForSelector("text=This app is in preview");
  await page.goto(`${base}/app/qr/new`, { waitUntil: "networkidle" });
  assert.ok(await page.locator('button:has-text("Save code")').isDisabled());
  await page.fill('input[maxlength="300"]', "https://example.com/changed");
  await page.waitForSelector('svg[role=img]');
  await page.goto(`${base}/app/qr/library`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Spring collection");
  ok("QR preview pages render (overview, designer with disabled save, library with sample data)");

  // Manage apps: remove Export.
  await page.goto(`${base}/app/apps`, { waitUntil: "networkidle" });
  await page.locator('label:has-text("Export")').first().click();
  await page.click('button:has-text("Save apps")');
  await page.waitForURL("**/app/qr");
  assert.deepEqual(await appsOf(withCompany.accountId), ["qr"]);
  await page.goto(`${base}/app`);
  await page.waitForURL("**/app/qr");
  ok("turning Export off hides it and /app sends you to the app that is on");

  // Another account with apps already set skips onboarding.
  await admin.from("account_apps").insert({ account_id: nameOnly.accountId, app: "export" });
  const p2 = await (await browser.newContext()).newPage();
  p2.setDefaultTimeout(60000);
  await p2.goto(`${base}/login`, { waitUntil: "networkidle" });
  await p2.click('[role=tab]:has-text("Log in")');
  await p2.fill('input[name=email]', nameOnly.email);
  await p2.fill('input[name=password]', nameOnly.password);
  await p2.click('button[type=submit]');
  await p2.waitForURL("**/app");
  await p2.goto(`${base}/onboarding`);
  await p2.waitForURL("**/app");
  ok("accounts that already chose apps skip onboarding");

  // Signed-out visitors can't reach onboarding.
  const anonPage = await (await browser.newContext()).newPage();
  await anonPage.goto(`${base}/onboarding`);
  await anonPage.waitForURL("**/login");
  ok("onboarding requires a login");

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
  const { data: accs } = await admin.from("accounts").select("id").or(`name.like.apps-${tag}-%,name.eq.Northwind Active,name.eq.Sam Lee,name.like.xxxx%`);
  for (const x of accs ?? []) await admin.from("accounts").delete().eq("id", x.id);
  console.log("cleaned up test data");
}
