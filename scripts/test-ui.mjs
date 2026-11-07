// Drives the real app in a real browser against a fake Shopify and the real Supabase project.
// Usage: npm run test:ui
import assert from "node:assert/strict";
// These suites test the product with billing off (everyone on the open limits), whatever is in .env.local.
for (const k of ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"]) process.env[k] = "";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { startFakeShopify } from "./fake-shopify.mjs";

process.env.NODE_ENV = "test";
const { encryptSecret } = await import("../src/lib/crypto.ts");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fake = await startFakeShopify();
const PORT = 3333;
const base = `http://localhost:${PORT}`;
const tag = randomUUID().slice(0, 8);
const users = [];
let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };

const productPreview = { products: { edges: [{ node: { id: "gid://shopify/Product/1", handle: "leggings", title: "Leggings", vendor: "Northwind", productType: "Pants", status: "ACTIVE", seo: { title: "S" }, variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/11", sku: "LEG-1", title: "Black / S", price: "29.00", inventoryQuantity: 5 } }] } } }] } };
const productLines = [
  { id: "gid://shopify/Product/1", handle: "leggings", title: "Leggings", vendor: "Northwind", productType: "Pants", status: "ACTIVE", seo: { title: "S" } },
  { id: "gid://shopify/ProductVariant/11", __parentId: "gid://shopify/Product/1", sku: "LEG-1", title: "Black / S", price: "29.00", inventoryQuantity: 5 },
  { id: "gid://shopify/ProductVariant/12", __parentId: "gid://shopify/Product/1", sku: "LEG-2", title: "Black / M", price: "29.00", inventoryQuantity: 7 },
];

async function mkUser(label, withStore, scopes) {
  const email = `ui-${tag}-${label}@example.com`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  users.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  await admin.from("account_apps").insert({ account_id: m.account_id, app: "export" });
  let storeId = null;
  if (withStore) {
    storeId = randomUUID();
    await admin.from("stores").insert({ id: storeId, account_id: m.account_id, shop_domain: `ui-${label}-${tag}.myshopify.com`, client_id: "cid-12345678", granted_scopes: scopes });
    await admin.from("store_secrets").insert({ store_id: storeId, blob: encryptSecret(storeId, "shpss_secret") });
  }
  return { email, password, accountId: m.account_id, storeId };
}

// Start the real Next.js server pointed at the fake Shopify.
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], {
  env: { ...process.env, NODE_ENV: "development", SHOPIFY_TEST_ORIGIN: `http://127.0.0.1:${fake.port}` },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
for (let i = 0; i < 60; i++) {
  if (/Ready in/.test(serverLog)) break;
  await new Promise((r) => setTimeout(r, 500));
}
assert.match(serverLog, /Ready in/, "dev server started");

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const login = async (page, u) => {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill('input[name=email]', u.email);
  await page.fill('input[name=password]', u.password);
  await page.click('button[type=submit]');
  await page.waitForURL("**/export", { timeout: 60000 });
};

try {
  const a = await mkUser("a", true, ["read_products", "read_orders", "read_customers", "read_inventory", "read_locations"]);
  const noStore = await mkUser("n", false, []);
  const noScope = await mkUser("s", true, ["read_customers"]);

  fake.state.scenario = { mode: "ok", lines: productLines, pollsBeforeDone: 2, preview: productPreview };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await login(page, a);
  ok("login lands on the app");

  // Builder: real preview from (fake) Shopify.
  await page.goto(`${base}/export/new?template=catalog`, { waitUntil: "networkidle" });
  await page.waitForSelector('td:has-text("leggings")');
  const previewText = await page.locator("aside table").first().innerText();
  assert.match(previewText, /LEG-1/);
  assert.ok(fake.state.previewQueries >= 1);
  ok("builder shows a live preview from Shopify");

  // Changing columns refreshes the preview with new headers.
  await page.fill('input[aria-label="Header for Title"]', "Product name");
  await page.waitForSelector('th:has-text("Product name")');
  ok("renaming a column updates the preview headers");

  // Run → progress → ready → download.
  fake.state.bulkStarts = 0;
  await page.click('button:has-text("Run export")');
  await page.waitForSelector('[role=status]:has-text("Shopify is preparing"), [role=status]:has-text("Waiting"), [role=status]:has-text("Starting"), [role=status]:has-text("Building")');
  ok("run shows live progress");
  await page.waitForSelector('[role=status]:has-text("Ready: 2 rows")');
  const href = await page.locator('a:has-text("Download")').first().getAttribute("href");
  assert.match(href, /^\/api\/exports\/[0-9a-f-]{36}\/download$/);
  const dl = await page.request.get(`${base}${href}`);
  assert.equal(dl.status(), 200);
  const csv = await dl.text();
  assert.equal(csv.charCodeAt(0), 0xfeff, "BOM for Excel");
  assert.ok(csv.includes("Handle,Product name,Vendor,Product type,Status,Variant SKU"), csv.slice(0, 150));
  assert.ok(csv.includes("leggings,Leggings,Northwind,Pants,active,LEG-1"));
  assert.ok(csv.includes("LEG-2"));
  assert.equal(fake.state.bulkStarts, 1);
  ok("the run completes and the downloaded CSV has the right headers, rows and Excel marker");

  // Double click safety: identical request inside 15s reuses the job.
  const before = fake.state.bulkStarts;
  await page.click('button:has-text("Edit")');
  await page.click('button:has-text("Run export")');
  await page.waitForSelector('[role=status]:has-text("Ready: 2 rows")');
  assert.equal(fake.state.bulkStarts, before, "no second Shopify operation for an identical request");
  ok("repeating an identical request within seconds does not start a duplicate export");

  // History shows it with a working download link.
  await page.goto(`${base}/export/history`, { waitUntil: "networkidle" });
  await page.waitForSelector('text=Succeeded');
  assert.ok(await page.locator('a:has-text("Download")').count() >= 1);
  ok("history lists the export with a download link");

  // Unauthenticated download is refused.
  const anon = await browser.newContext();
  const refused = await anon.request.get(`${base}${href}`, { maxRedirects: 0 });
  assert.ok([401, 404, 307].includes(refused.status()) && !String(refused.headers().location ?? "").includes("supabase"), `status ${refused.status()}`);
  await anon.close();
  ok("downloads are refused for signed-out visitors");

  // Failure case: Shopify denies access → clear message in the UI.
  fake.state.scenario = { mode: "accessDenied", lines: [], pollsBeforeDone: 1, preview: productPreview };
  await page.goto(`${base}/export/new?template=price-cost`, { waitUntil: "networkidle" });
  await page.waitForSelector('td:has-text("LEG-1")');
  await page.click('button:has-text("Run export")');
  await page.waitForSelector('[role=alert]:has-text("permission")');
  ok("a Shopify permission error is shown as a clear message with a retry option");
  assert.ok(await page.locator('button:has-text("Try again")').count() === 1);

  // Preview error surfaces plainly.
  fake.state.scenario = { mode: "ok", lines: [], pollsBeforeDone: 1, previewError: "Field 'nope' doesn't exist on type 'Product'" };
  await page.goto(`${base}/export/new?template=catalog`, { waitUntil: "networkidle" });
  await page.waitForSelector('[role=alert]:has-text("Shopify couldn")');
  ok("a Shopify query error appears in the preview area instead of breaking the page");

  // Account with no store gets guided to connect one.
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  p2.setDefaultTimeout(60000);
  await login(p2, noStore);
  await p2.goto(`${base}/export/new`, { waitUntil: "networkidle" });
  await p2.waitForSelector('text=No connected store');
  await p2.goto(`${base}/export/history`, { waitUntil: "networkidle" });
  await p2.waitForSelector('text=No exports yet');
  ok("an account without a store is guided to connect one; history shows an empty state");

  // Store lacking the needed scope can't start an order export.
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const p3 = await ctx3.newPage();
  p3.setDefaultTimeout(60000);
  await login(p3, noScope);
  await p3.goto(`${base}/export/new?template=orders-3pl`, { waitUntil: "networkidle" });
  await p3.waitForSelector('[role=alert]:has-text("read_orders")');
  fake.state.bulkStarts = 0;
  await p3.click('button:has-text("Run export")');
  await p3.waitForSelector('[role=alert]:has-text("read_orders")');
  assert.equal(fake.state.bulkStarts, 0);
  ok("a store missing a required permission is stopped up front with exact instructions");

  assert.deepEqual(pageErrors, [], "no uncaught browser errors");
  ok("no uncaught errors in the browser");
  console.log(`\nAll ${pass} UI checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill("SIGTERM");
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
  const { data: accs } = await admin.from("accounts").select("id").like("name", `ui-${tag}-%`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  await fake.close();
  console.log("cleaned up test data");
}
