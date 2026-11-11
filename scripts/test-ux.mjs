// UX checks in a real browser: error pages, dialogs, motion, keyboard, and an automated accessibility scan (axe).
// Usage: npm run test:ux
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

for (const k of ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"]) process.env[k] = "";
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tag = randomUUID().slice(0, 8);
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };

const email = `ux-${tag}@example.com`;
const password = `Pw-${randomUUID()}`;
const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "UX Tester" } });
const { data: mem } = await admin.from("members").select("account_id").eq("user_id", u.user.id).single();
await admin.from("account_apps").insert({ account_id: mem.account_id, app: "export" });
const storeId = randomUUID();
await admin.from("stores").insert({ id: storeId, account_id: mem.account_id, shop_domain: `ux-${tag}.myshopify.com`, client_id: "cid-12345678", granted_scopes: ["read_products"], status: "connected" });

const PORT = 3355;
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
assert.match(log, /Ready in/);
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

/** Runs axe on the current page and fails on serious or critical problems. */
async function scan(page, name) {
  // Let entrance animations finish: a half-faded element would give false contrast results.
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important} .reveal{opacity:1!important;transform:none!important}" });
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"], rules: { "color-contrast": { enabled: true } } }));
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  assert.deepEqual(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 120)}`), [], `${name}: accessibility problems`);
}

try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // ───────── error pages ─────────
  const nf = await page.goto(`${base}/this-page-does-not-exist`, { waitUntil: "networkidle" });
  assert.equal(nf.status(), 404);
  await page.waitForSelector("text=We couldn't find that page");
  assert.ok(await page.locator('a:has-text("Go to the home page")').isVisible());
  await scan(page, "404 page");
  ok("a missing page shows the branded 404 with a way home, and passes the accessibility scan");

  // ───────── public pages: accessibility, keyboard, motion ─────────
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Skip to content");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content");
  ok("keyboard: the first Tab stop is a Skip-to-content link that works");

  await page.evaluate(() => window.scrollTo(0, 0));
  const pricingHidden = await page.evaluate(() => getComputedStyle(document.querySelector("#pricing")).opacity);
  assert.ok(Number(pricingHidden) < 1, "below-the-fold sections start hidden");
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#pricing").classList.contains("is-visible"));
  ok("motion: sections fade in as they scroll into view");

  const calm = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  await calm.goto(`${base}/`, { waitUntil: "networkidle" });
  assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector("#pricing")).opacity), "1");
  ok("reduced motion: everything is visible immediately, with no fade");
  await calm.context().close();

  for (const path of ["/", "/pricing", "/login", "/docs", "/docs/export/connect-shopify", "/terms", "/privacy", "/refunds", "/contact", "/support", "/security", "/forgot-password"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-visible")));
    await scan(page, path);
  }
  ok("accessibility scan (WCAG 2.1 A/AA): no serious problems on the 12 public pages");

  // ───────── support form ─────────
  await page.goto(`${base}/support`, { waitUntil: "networkidle" });
  await page.fill("input[name=email]", "customer@example.com");
  await page.selectOption("select[name=product]", "Klyroo Export");
  await page.selectOption("select[name=category]", "Question");
  await page.fill("textarea[name=message]", "short");
  await page.evaluate(() => document.querySelector("textarea").removeAttribute("minlength"));
  await page.click('button:has-text("Send message")');
  await page.waitForSelector("text=Tell us a little more");
  assert.equal(await page.inputValue("select[name=product]"), "Klyroo Export", "the form keeps what you typed after an error");
  await page.fill("textarea[name=message]", `UX test ${tag}: how do I connect my store?`);
  await page.click('button:has-text("Send message")');
  await page.waitForSelector("text=/got your message/");
  let rows = [];
  for (let i = 0; i < 10 && !rows.length; i++) { rows = (await admin.from("support_requests").select("*").like("message", `UX test ${tag}%`)).data; if (!rows.length) await page.waitForTimeout(500); }
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].product, rows[0].category, rows[0].email], ["Klyroo Export", "Question", "customer@example.com"]);
  await admin.from("support_requests").delete().eq("id", rows[0].id);
  ok("support form: validates, saves the request, and confirms (honeypot and rate limits are in the action)");

  // ───────── docs search ─────────
  await page.goto(`${base}/docs`, { waitUntil: "networkidle" });
  await page.fill("input[type=search]", "read_all_orders");
  await page.waitForSelector('main a[href="/docs/export/connect-shopify"]');
  await page.fill("input[type=search]", "zzzz-nothing");
  await page.waitForSelector("main >> text=Nothing matched");
  ok("docs search finds guides by their full text and says so when nothing matches");

  // ───────── signed in ─────────
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/export");

  await page.goto(`${base}/export/history`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=No exports yet");
  await scan(page, "history (empty)");
  ok("an empty History explains itself and offers the next step");

  await page.goto(`${base}/export/stores`, { waitUntil: "networkidle" });
  await page.waitForSelector(`text=ux-${tag}.myshopify.com`);
  await page.click('button:has-text("Copy scopes")');
  await page.waitForSelector('button:has-text("Copied")');
  await scan(page, "stores");
  ok("Stores: the copy button confirms on the button itself");

  // Disconnect asks first; Escape cancels; confirming disconnects.
  await page.click('button:has-text("Disconnect")');
  await page.waitForSelector("dialog[open] >> text=Disconnect this store?");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  assert.equal((await admin.from("stores").select("status").eq("id", storeId).single()).data.status, "connected");
  await page.click('button:has-text("Disconnect")');
  await page.click('dialog[open] button:has-text("Disconnect store")');
  for (let i = 0; i < 20; i++) { if ((await admin.from("stores").select("status").eq("id", storeId).single()).data.status === "disconnected") break; await page.waitForTimeout(500); }
  assert.equal((await admin.from("stores").select("status").eq("id", storeId).single()).data.status, "disconnected");
  ok("disconnecting a store asks for confirmation (Escape cancels) and only then disconnects");

  for (const path of ["/export", "/export/new", "/export/billing", "/account"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await scan(page, path);
  }
  ok("accessibility scan: no serious problems on the signed-in screens");

  // Phone width: no sideways scroll on signed-in screens.
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  phone.setDefaultTimeout(60000);
  await phone.goto(`${base}/login`, { waitUntil: "networkidle" });
  await phone.click('[role=tab]:has-text("Log in")');
  await phone.fill("input[name=email]", email);
  await phone.fill("input[name=password]", password);
  await phone.click("button[type=submit]");
  await phone.waitForURL("**/export");
  for (const path of ["/export", "/export/new", "/export/history", "/export/stores", "/export/billing", "/account"]) {
    await phone.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await phone.waitForTimeout(500);
    const w = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert.ok(w.sw <= w.cw + 1, `${path} scrolls sideways on a phone (${w.sw} > ${w.cw})`);
  }
  ok("phone width (390px): no sideways scrolling on any signed-in screen");

  assert.deepEqual(errors, [], "no uncaught browser errors");
  ok("no uncaught errors in the browser");
  console.log(`\nAll ${pass} UX checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill("SIGTERM");
  await admin.auth.admin.deleteUser(u.user.id);
  await admin.from("accounts").delete().eq("id", mem.account_id);
  console.log("cleaned up test data");
}
