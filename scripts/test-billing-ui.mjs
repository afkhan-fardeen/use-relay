// Billing page in a real browser: beta mode (no Paddle keys) and live-plans mode (keys set).
// Usage: npm run test:billing-ui
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tag = randomUUID().slice(0, 8);
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };

const email = `billui-${tag}@example.com`;
const password = randomUUID();
const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
const { data: mem } = await admin.from("members").select("account_id").eq("user_id", u.user.id).single();
await admin.from("account_apps").insert([{ account_id: mem.account_id, app: "export" }, { account_id: mem.account_id, app: "qr" }]);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function withServer(port, extraEnv, fn) {
  const env = { ...process.env, NODE_ENV: "development", ...extraEnv };
  for (const k of ["NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "PADDLE_WEBHOOK_SECRET", "PADDLE_PRICE_EXPORT_STARTER", "PADDLE_PRICE_EXPORT_GROWTH", "PADDLE_PRICE_EXPORT_SCALE", "PADDLE_PRICE_QR_PRO"]) if (!(k in extraEnv)) delete env[k];
  const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
  assert.match(log, /Ready in/, "server started");
  try { await fn(`http://localhost:${port}`); } finally { server.kill("SIGTERM"); await new Promise((r) => setTimeout(r, 1500)); }
}
async function login(page, base) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill('input[name=email]', email);
  await page.fill('input[name=password]', password);
  await page.click('button[type=submit]');
  await page.waitForURL("**/export", { timeout: 60000 });
}

try {
  await withServer(3341, {}, async (base) => {
    const page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(60000);
    await login(page, base);
    await page.goto(`${base}/export/billing`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Free during the beta");
    assert.equal(await page.locator("text=Choose Growth").count(), 0);
    ok("without Paddle keys the page says 'Free during the beta' and offers no checkout");
  });

  await withServer(3342, {
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: "test_0000000000000000000000000000000000",
    PADDLE_WEBHOOK_SECRET: "pdl_ntfset_test",
    PADDLE_PRICE_EXPORT_STARTER: "pri_starter01",
    PADDLE_PRICE_EXPORT_GROWTH: "pri_growth01",
    NEXT_PUBLIC_PADDLE_ENV: "sandbox",
  }, async (base) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await login(page, base);
    await page.goto(`${base}/export/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h2:has-text('Starter')");
    for (const n of ["Free", "Starter", "Growth", "Scale"]) assert.ok(await page.locator(`h2:has-text("${n}")`).count() === 1, n);
    assert.ok(await page.locator("text=Current").count() >= 1);
    assert.ok(await page.locator('button:has-text("Not available yet")').count() === 1, "Scale has no price configured, so it can't be bought");
    ok("with keys the four plans render, Free is current, and a plan without a configured price can't be bought");
    assert.ok(await page.locator("text=Recommended").count() >= 1, "Growth is marked recommended");
    ok("Growth is marked Recommended");
    await page.waitForSelector('button:has-text("Choose Growth")', { timeout: 30000 });
    ok("Paddle.js loads and enables checkout buttons");
    // Each app bills separately: Export has plans for sale, QR does not.
    await page.goto(`${base}/qr/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Free while in preview");
    assert.equal(await page.locator('button:has-text("Choose")').count(), 0);
    ok("QR billing is separate: it stays free in preview even while Export has paid plans");
    assert.deepEqual(errors, [], "no uncaught browser errors");
    ok("no uncaught errors in the browser");
  });
  console.log(`\nAll ${pass} billing UI checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await admin.auth.admin.deleteUser(u.user.id);
  const { data: accs } = await admin.from("accounts").select("id").like("name", `billui-${tag}`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  console.log("cleaned up test data");
}
