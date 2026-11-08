// Takes real screenshots of the app (against a fake Shopify with realistic sample data) for the landing page.
// Usage: node --env-file=.env.local scripts/product-shots.mjs   -> public/product/*.png
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { startFakeShopify } from "./fake-shopify.mjs";

for (const k of ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"]) process.env[k] = "";
process.env.NODE_ENV = "test";
const { encryptSecret } = await import("../src/lib/crypto.ts");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fake = await startFakeShopify();
const OUT = new URL("../public/product/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const items = [
  ["trail-jacket", "Trail Jacket", "Northwind", "Outerwear", [["JAC-SA-S", "Sage / S", "89.00", 14], ["JAC-SA-M", "Sage / M", "89.00", 22], ["JAC-SA-L", "Sage / L", "89.00", 9]]],
  ["high-rise-leggings", "High-Rise Leggings", "Northwind", "Pants", [["LEG-BL-S", "Black / S", "58.00", 31], ["LEG-BL-M", "Black / M", "58.00", 40]]],
  ["tech-tee", "Tech Tee", "Northwind", "Tops", [["TEE-OL-S", "Olive / S", "34.00", 18], ["TEE-OL-M", "Olive / M", "34.00", 25]]],
  ["insulated-bottle", "Insulated Bottle", "Northwind", "Accessories", [["BOT-SL-500", "Slate / 500ml", "26.00", 64]]],
];
const preview = { products: { edges: items.map(([handle, title, vendor, productType, vars], i) => ({ node: { id: `gid://shopify/Product/${i + 1}`, handle, title, vendor, productType, status: "ACTIVE", seo: { title: `${title} | Northwind` }, variants: { edges: vars.map(([sku, vt, price, q], j) => ({ node: { id: `gid://shopify/ProductVariant/${i * 10 + j}`, sku, title: vt, price, inventoryQuantity: q } })) } } })) } };
fake.state.scenario = { mode: "ok", lines: [], pollsBeforeDone: 1, preview };

const email = `shots-${randomUUID().slice(0, 6)}@example.com`, password = `Pw-${randomUUID()}`;
const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Alex Morgan", company: "Northwind Active" } });
const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
await admin.from("account_apps").insert({ account_id: m.account_id, app: "export" });
const storeId = randomUUID();
await admin.from("stores").insert({ id: storeId, account_id: m.account_id, shop_domain: "northwind-active.myshopify.com", client_id: "cid-12345678", granted_scopes: ["read_products", "read_orders", "read_customers", "read_inventory", "read_locations"], currency_code: "GBP", last_checked_at: new Date().toISOString() });
await admin.from("store_secrets").insert({ store_id: storeId, blob: encryptSecret(storeId, "shpss_secret") });

const PORT = 3356;
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "development", SHOPIFY_TEST_ORIGIN: `http://127.0.0.1:${fake.port}` }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  page.setDefaultTimeout(60000);
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.click('[role=tab]:has-text("Log in")');
  await page.fill("input[name=email]", email); await page.fill("input[name=password]", password);
  await page.click("button[type=submit]"); await page.waitForURL("**/export");
  await page.goto(`${base}/export`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: OUT + "templates.png" });
  await page.goto(`${base}/export/new?template=catalog`, { waitUntil: "networkidle" });
  await page.waitForSelector("table", { timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: OUT + "builder.png" });
  console.log("wrote", OUT);
} finally {
  await browser.close(); server.kill("SIGTERM"); await fake.close();
  await admin.auth.admin.deleteUser(data.user.id); await admin.from("accounts").delete().eq("id", m.account_id);
}
