// Export engine tests.
//  Part 1: pure unit tests (query builder, row processors, CSV safety, config validation).
//  Part 2: end-to-end against the real Supabase project with a fake Shopify:
//          real queue, real storage, retries, failures, reattach, cross-tenant safety.
// Usage: npm run test:export
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parse } from "graphql";
import { createClient } from "@supabase/supabase-js";
import { startFakeShopify } from "./fake-shopify.mjs";

process.env.NODE_ENV = "test";
const { buildQuery, searchFilter, QUERY_KEYS } = await import("../src/lib/export/queries.ts");
const { createProcessor, toBulkLines, LimitError, GETTER_KEYS } = await import("../src/lib/export/processors.ts");
const { csvLine } = await import("../src/lib/export/csv.ts");
const { validateConfig, templates, resources } = await import("../src/lib/export.ts");

let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const cfg = (over = {}) => ({ storeId: "x", resource: "products", columns: ["handle"], renames: {}, status: "", tag: "", dateFrom: "", dateTo: "", format: "csv", name: "t", ...over });

// ───────────── Part 1: unit ─────────────
// 1. Every template's query is valid GraphQL, in bulk and preview shapes.
for (const t of templates) {
  const c = cfg({ resource: t.resource, columns: t.columns, status: t.status ?? "" });
  parse(buildQuery(c));
  parse(buildQuery(c, 10, 5));
}
ok("every template builds syntactically valid GraphQL (bulk and preview)");

// 2. Bulk query limits: <= 5 connections, <= 2 levels of nesting, single top-level field.
function connections(q) { return (q.match(/edges \{ node/g) ?? []).length; }
for (const resource of ["products", "orders", "customers", "inventory", "collections"]) {
  const all = { products: ["handle", "sku", "barcode", "weight", "cost", "image", "seo_desc"], orders: ["order", "line_sku", "ship_city", "total"], customers: ["email", "status", "spent"], inventory: ["sku", "available"], collections: ["handle", "count"] }[resource];
  const q = buildQuery(cfg({ resource, columns: all }));
  assert.ok(connections(q) <= 5, `${resource}: <= 5 connections`);
  assert.equal((q.match(/^\{ \w+/g) ?? []).length, 1);
  assert.ok(!/first:/.test(q), `${resource}: bulk query has no pagination args`);
}
ok("bulk queries respect Shopify's connection limits and have no pagination arguments");

// 3. Injection: filters are quoted, bad values rejected by validation.
assert.equal(searchFilter(cfg({ tag: "vip", status: "active", dateFrom: "2026-01-01" })), 'status:active tag:"vip" created_at:>=2026-01-01T00:00:00Z');
assert.ok(!validateConfig(cfg({ tag: 'x" OR status:any' })).ok);
assert.ok(!validateConfig(cfg({ columns: ["nope"] })).ok);
assert.ok(!validateConfig(cfg({ columns: ["handle", "mf:bad key.x"] })).ok);
assert.ok(validateConfig(cfg({ columns: ["handle", "mf:custom.material"] })).ok);
assert.ok(!validateConfig(cfg({ resource: "inventory", tag: "x" })).ok);
assert.ok(!validateConfig(cfg({ dateFrom: "2026-02-01", dateTo: "2026-01-01" })).ok);
const mfq = buildQuery(cfg({ columns: ["handle", "mf:custom.material"] }));
assert.ok(mfq.includes('mf0: metafield(namespace: "custom", key: "material")'));
ok("filters are quoted; invalid tags, columns, dates and metafield keys are rejected");

// 4. CSV safety.
assert.equal(csvLine(["=1+1", "+x", "-x", "@x", "a,b", 'q"q', "line\nbreak", -5, "ok"], ","), `'=1+1,'+x,'-x,'@x,"a,b","q""q","line\nbreak",-5,ok\r\n`);
ok("CSV: formula injection neutralized; commas, quotes and newlines escaped");

// 5. Products: children can arrive in any order after their parent; barcode attaches to its variant.
{
  const rows = [];
  const p = createProcessor(cfg({ columns: ["handle", "title", "tags", "sku", "price", "barcode", "seo_title", "qty", "weight", "cost"] }), (r) => rows.push(r));
  const L = [
    { id: "gid://shopify/Product/1", handle: "leg", title: "Leggings", tags: ["new", "sale"], seo: { title: "=SEO" } },
    { id: "gid://shopify/Product/2", handle: "tee", title: "Tee", tags: [] },
    { id: "gid://shopify/ProductVariant/11", __parentId: "gid://shopify/Product/1", sku: "LEG-1", price: "29.00", inventoryQuantity: 5, inventoryItem: { unitCost: { amount: "9.5" }, measurement: { weight: { value: 200, unit: "GRAMS" } } } },
    { id: "gid://shopify/ProductVariant/21", __parentId: "gid://shopify/Product/2", sku: null, price: "10.00", inventoryQuantity: 0 },
    { value: "0123", __parentId: "gid://shopify/ProductVariant/11" },
    { value: "9999", __parentId: "gid://shopify/ProductVariant/11" },
    { id: "gid://shopify/ProductVariant/12", __parentId: "gid://shopify/Product/1", sku: "LEG-2", price: "31.00", inventoryQuantity: 2 },
  ];
  L.forEach((l) => p.push(l));
  p.finish();
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ["leg", "Leggings", "new, sale", "LEG-1", "29.00", "0123", "=SEO", "5", "200 grams", "9.5"]);
  assert.deepEqual(rows[1], ["tee", "Tee", "", "", "10.00", "", "", "0", "", ""]);
  assert.equal(rows[2][3], "LEG-2");
}
ok("products: one row per variant, parents joined, first barcode attached, odd order handled");

// 6. Orders stream per line item; metafield columns; status lowercase.
{
  const rows = [];
  const p = createProcessor(cfg({ resource: "orders", columns: ["order", "financial", "ship_country", "line_sku", "line_qty", "total", "mf:custom.gift"] }), (r) => rows.push(r));
  [
    { id: "gid://shopify/Order/1", name: "#1001", displayFinancialStatus: "PAID", shippingAddress: { countryCodeV2: "GB" }, totalPriceSet: { shopMoney: { amount: "50.00" } }, mf0: { value: "yes" } },
    { id: "gid://shopify/LineItem/1", __parentId: "gid://shopify/Order/1", sku: "A", quantity: 2 },
    { id: "gid://shopify/LineItem/2", __parentId: "gid://shopify/Order/1", sku: "B", quantity: 1 },
    { id: "gid://shopify/LineItem/9", __parentId: "gid://shopify/Order/404", sku: "ORPHAN", quantity: 1 },
  ].forEach((l) => p.push(l));
  p.finish();
  assert.deepEqual(rows, [["#1001", "paid", "GB", "A", "2", "50.00", "yes"], ["#1001", "paid", "GB", "B", "1", "50.00", "yes"]]);
}
ok("orders: one row per line item, money and metafields read, orphan lines ignored");

// 7. Customers: status and date filters applied in code.
{
  const rows = [];
  const p = createProcessor(cfg({ resource: "customers", columns: ["email", "status"], status: "subscribed", dateFrom: "2026-02-01" }), (r) => rows.push(r));
  [
    { id: "gid://shopify/Customer/1", defaultEmailAddress: { emailAddress: "a@x.com", marketingState: "SUBSCRIBED" }, createdAt: "2026-03-01T00:00:00Z" },
    { id: "gid://shopify/Customer/2", defaultEmailAddress: { emailAddress: "b@x.com", marketingState: "UNSUBSCRIBED" }, createdAt: "2026-03-01T00:00:00Z" },
    { id: "gid://shopify/Customer/3", defaultEmailAddress: { emailAddress: "c@x.com", marketingState: "SUBSCRIBED" }, createdAt: "2025-01-01T00:00:00Z" },
  ].forEach((l) => p.push(l));
  assert.deepEqual(rows, [["a@x.com", "subscribed"]]);
}
ok("customers: marketing-status and date filters applied");

// 8. Inventory: rows per level joined with variant/product names that may arrive later; status filter.
{
  const rows = [];
  const p = createProcessor(cfg({ resource: "inventory", columns: ["sku", "title", "variant", "location", "available", "on_hand"], status: "low_stock" }), (r) => rows.push(r));
  const lv = (id, parent, name, available, onHand) => ({ id: `gid://shopify/InventoryLevel/${id}`, __parentId: parent, location: { name }, quantities: [{ name: "available", quantity: available }, { name: "on_hand", quantity: onHand }] });
  [
    { id: "gid://shopify/InventoryItem/1", sku: "S1" },
    lv(1, "gid://shopify/InventoryItem/1", "Main", 3, 4),
    lv(2, "gid://shopify/InventoryItem/1", "East", 50, 50),
    { id: "gid://shopify/ProductVariant/7", __parentId: "gid://shopify/InventoryItem/1", title: "Black / S", product: { title: "Leggings" } },
  ].forEach((l) => p.push(l));
  p.finish();
  assert.deepEqual(rows, [["S1", "Leggings", "Black / S", "Main", 3, 4]]);
}
ok("inventory: levels joined with late-arriving variant names; low-stock filter works");

// 9. Row caps.
{
  const p = createProcessor(cfg(), () => {});
  assert.throws(() => { for (let i = 0; i < 200_001; i++) p.push({ id: `gid://shopify/ProductVariant/${i}`, __parentId: "x" }); }, LimitError);
}
ok("oversized exports are stopped with a clear limit error");

// 10. Preview flattening matches bulk shape.
{
  const lines = [...toBulkLines([{ node: { id: "gid://shopify/Product/1", handle: "h", variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/2", sku: "S", barcodes: { edges: [{ node: { value: "B1" } }] } } }] } } }])];
  assert.deepEqual(lines, [
    { id: "gid://shopify/Product/1", handle: "h" },
    { id: "gid://shopify/ProductVariant/2", sku: "S", __parentId: "gid://shopify/Product/1" },
    { value: "B1", __parentId: "gid://shopify/ProductVariant/2" },
  ]);
}
ok("live-preview responses flatten into the same shape as bulk output");

// 11. Every catalog column is wired end to end: label → GraphQL selection → row value.
for (const r of resources) {
  const keys = r.fields.map((f) => f.key);
  assert.equal(new Set(keys).size, keys.length, `${r.id}: duplicate keys`);
  for (const k of keys) {
    assert.ok(QUERY_KEYS[r.id].includes(k), `${r.id}.${k} has no GraphQL selection`);
    assert.ok(GETTER_KEYS[r.id].includes(k), `${r.id}.${k} has no row getter`);
  }
  for (const k of GETTER_KEYS[r.id]) assert.ok(keys.includes(k), `${r.id}.${k} is produced but not in the catalog`);
}
ok(`catalog is fully wired: ${resources.map((r) => `${r.fields.length} ${r.id}`).join(", ")} columns each have a query selection and a row getter`);

// 12. Selecting EVERY column (plus metafields) still gives a valid bulk query within Shopify's limits.
for (const r of resources) {
  const cols = r.fields.map((f) => f.key);
  if (r.metafields) cols.push("mf:custom.material");
  if (r.id === "products") cols.push("vmf:custom.care");
  const q = buildQuery(cfg({ resource: r.id, columns: cols }));
  parse(q);
  assert.ok(connections(q) <= 5, `${r.id}: ${connections(q)} connections with everything selected`);
  parse(buildQuery(cfg({ resource: r.id, columns: cols }), 10, 5));
}
ok("selecting every column (and metafields) stays valid GraphQL and within the 5-connection limit");

// 13. New columns read correctly: options, collections, media, variant metafield, tracking.
{
  const rows = [];
  const p = createProcessor(cfg({ columns: ["handle", "option1_name", "option1_value", "option2_value", "collections", "images", "barcode", "vmf:custom.care", "taxable", "inventory_policy", "category", "gift_card", "options", "weight"] }), (r) => rows.push(r));
  [
    { id: "gid://shopify/Product/1", handle: "leg", category: { fullName: "Apparel > Pants" }, isGiftCard: false, options: [{ name: "Color" }, { name: "Size" }] },
    { id: "gid://shopify/ProductVariant/11", __parentId: "gid://shopify/Product/1", selectedOptions: [{ name: "Color", value: "Black" }, { name: "Size", value: "S" }], taxable: true, inventoryPolicy: "DENY", vmf0: { value: "Wash cold" } },
    { id: "gid://shopify/Collection/5", __parentId: "gid://shopify/Product/1", handle: "bestsellers" },
    { id: "gid://shopify/Collection/6", __parentId: "gid://shopify/Product/1", handle: "new" },
    { id: "gid://shopify/MediaImage/9", __parentId: "gid://shopify/Product/1", preview: { image: { url: "https://cdn/x.jpg" } } },
    { id: "gid://shopify/MediaImage/10", __parentId: "gid://shopify/Product/1", preview: { image: { url: "https://cdn/y.jpg" } } },
    { value: "123", __parentId: "gid://shopify/ProductVariant/11" },
  ].forEach((l) => p.push(l));
  p.finish();
  assert.deepEqual(rows[0], ["leg", "Color", "Black", "S", "bestsellers, new", "https://cdn/x.jpg | https://cdn/y.jpg", "123", "Wash cold", "true", "deny", "Apparel > Pants", "false", "Color, Size", ""]);
}
{
  const rows = [];
  const p = createProcessor(cfg({ resource: "orders", columns: ["order", "tracking_company", "tracking_number", "bill_city", "customer_name", "ship_price", "line_id", "line_product_id"] }), (r) => rows.push(r));
  [
    { id: "gid://shopify/Order/1", name: "#1", billingAddress: { city: "Leeds" }, customer: { displayName: "Ann Lee" }, shippingLine: { originalPriceSet: { shopMoney: { amount: "4.99" } } }, fulfillments: [{ trackingInfo: [{ company: "DPD", number: "TRK1", url: "https://t/1" }] }] },
    { id: "gid://shopify/LineItem/777", __parentId: "gid://shopify/Order/1", product: { legacyResourceId: "42" } },
  ].forEach((l) => p.push(l));
  assert.deepEqual(rows[0], ["#1", "DPD", "TRK1", "Leeds", "Ann Lee", "4.99", "777", "42"]);
}
ok("new columns read correctly: options, collections, media URLs, barcode, variant metafield, tracking, billing, IDs");

// ───────────── Part 2: end to end ─────────────
const { encryptSecret } = await import("../src/lib/crypto.ts");
const { drainQueue, cleanupExpiredFiles } = await import("../src/lib/export/queue.ts");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fake = await startFakeShopify();
process.env.SHOPIFY_TEST_ORIGIN = `http://127.0.0.1:${fake.port}`;

const tag = randomUUID().slice(0, 8);
const createdUsers = [];
const scopes = ["read_products", "read_orders", "read_customers", "read_inventory", "read_locations", "read_all_orders"];

async function mkAccount(label) {
  const { data, error } = await admin.auth.admin.createUser({ email: `exp-${tag}-${label}@example.com`, password: randomUUID(), email_confirm: true });
  assert.ifError(error);
  createdUsers.push(data.user.id);
  const { data: m } = await admin.from("members").select("account_id").eq("user_id", data.user.id).single();
  return m.account_id;
}
async function mkStore(accountId, label, secret = "shpss_secret", scp = scopes) {
  const id = randomUUID();
  const ins = await admin.from("stores").insert({ id, account_id: accountId, shop_domain: `e2e-${label}-${tag}.myshopify.com`, client_id: "cid-12345678", granted_scopes: scp });
  assert.ifError(ins.error);
  await admin.from("store_secrets").insert({ store_id: id, blob: encryptSecret(id, secret) });
  return id;
}
async function mkJob(accountId, storeId, config, extra = {}) {
  const { data, error } = await admin.from("export_jobs").insert({ account_id: accountId, store_id: storeId, resource: config.resource, config: { ...config, storeId }, idempotency_key: `${tag}-${randomUUID()}`, ...extra }).select().single();
  assert.ifError(error);
  return data;
}
const getJob = async (id) => (await admin.from("export_jobs").select("*").eq("id", id).single()).data;
async function fileText(jobId) {
  const { data: f } = await admin.from("export_files").select("*").eq("job_id", jobId).single();
  const dl = await admin.storage.from("exports").download(f.storage_key);
  assert.ifError(dl.error);
  return { text: await dl.data.text(), file: f };
}
const productLines = [
  { id: "gid://shopify/Product/1", handle: "leggings", title: "Leggings", status: "ACTIVE", tags: ["new"], seo: { title: "=Bad" } },
  { id: "gid://shopify/ProductVariant/11", __parentId: "gid://shopify/Product/1", sku: "-LEG", title: "Black / S", price: "29.00", inventoryQuantity: 5 },
  { value: "0123456789", __parentId: "gid://shopify/ProductVariant/11" },
];
const prodCfg = { resource: "products", columns: ["handle", "title", "status", "tags", "sku", "variant", "price", "barcode", "seo_title", "qty"], renames: { sku: "SKU code" }, status: "", tag: "", dateFrom: "", dateTo: "", format: "csv", name: "Catalog" };

try {
  const accA = await mkAccount("a");
  const accB = await mkAccount("b");
  const storeA = await mkStore(accA, "a");

  // A. Happy path: product export end to end through the real queue and real storage.
  fake.state.scenario = { mode: "ok", lines: productLines, pollsBeforeDone: 3 };
  let job = await mkJob(accA, storeA, prodCfg);
  assert.equal(await drainQueue(), 1);
  job = await getJob(job.id);
  assert.equal(job.status, "succeeded", job.error_detail);
  assert.equal(job.rows_written, 1);
  const { text, file } = await fileText(job.id);
  assert.equal(
    text,
    "Handle,Title,Status,Tags,SKU code,Variant title,Price,Variant barcode,SEO title,Inventory quantity\r\n" +
      "leggings,Leggings,active,new,'-LEG,Black / S,29.00,0123456789,'=Bad,5\r\n",
  );
  assert.equal(file.row_count, 1);
  assert.ok(file.sha256 && file.expires_at);
  assert.equal(fake.state.bulkStarts, 1);
  ok("e2e: export runs through the queue, file is stored, content and headers are exact, formulas neutralized");

  // The bulk query we sent to Shopify is the one the builder produced.
  assert.equal(fake.state.startedQueries[0], buildQuery({ ...prodCfg, storeId: storeA }));
  ok("e2e: the exact query is sent to Shopify's bulk API");

  // Job audit trail.
  const { data: ev } = await admin.from("export_job_events").select("state").eq("job_id", job.id).order("id");
  const states = ev.map((e) => e.state);
  for (const s of ["starting", "shopify_running", "downloading", "publishing", "succeeded"]) assert.ok(states.includes(s), `event ${s}`);
  ok("e2e: every step is recorded in the job's event log");

  // B. Orders with the 60-day note when read_all_orders is missing.
  const storeNoAll = await mkStore(accA, "noall", "shpss_secret", scopes.filter((s) => s !== "read_all_orders"));
  fake.state.scenario = { mode: "ok", pollsBeforeDone: 1, lines: [
    { id: "gid://shopify/Order/1", name: "#1001", displayFinancialStatus: "PAID", shippingAddress: { name: "Ann", address1: "1 Rd", city: "Leeds", countryCodeV2: "GB" }, shippingLine: { title: "Std" } },
    { id: "gid://shopify/LineItem/1", __parentId: "gid://shopify/Order/1", sku: "A", quantity: 2 },
  ] };
  const ordCfg = { resource: "orders", columns: ["order", "ship_name", "ship_city", "line_sku", "line_qty", "ship_method"], renames: {}, status: "paid", tag: "", dateFrom: "", dateTo: "", format: "tsv", name: "3PL orders" };
  job = await mkJob(accA, storeNoAll, ordCfg);
  await drainQueue();
  job = await getJob(job.id);
  assert.equal(job.status, "succeeded", job.error_detail);
  assert.match(job.error_detail, /last 60 days/);
  const ord = await fileText(job.id);
  assert.equal(ord.text, "Order name\tShipping name\tShipping city\tLine SKU\tLine quantity\tShipping method\r\n#1001\tAnn\tLeeds\tA\t2\tStd\r\n");
  assert.ok(ord.file.storage_key.endsWith("3pl-orders.tsv"));
  ok("e2e: TSV orders export; warns when read_all_orders is missing");

  // C. Retry: Shopify says another bulk op is running → requeued with backoff → succeeds next pass.
  fake.state.bulkStarts = 0;
  fake.state.scenario = { mode: "busyOnce", lines: productLines, pollsBeforeDone: 1 };
  job = await mkJob(accA, storeA, prodCfg);
  await drainQueue();
  let j = await getJob(job.id);
  assert.equal(j.status, "queued");
  assert.equal(j.attempt, 1);
  assert.ok(new Date(j.run_after) > new Date(), "backoff scheduled");
  assert.equal(await drainQueue(), 0, "not claimable before run_after");
  await admin.from("export_jobs").update({ run_after: new Date(Date.now() - 1000).toISOString() }).eq("id", job.id);
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "succeeded", j.error_detail);
  assert.equal(j.attempt, 2);
  ok("e2e: transient Shopify error is retried with backoff and then succeeds");

  // D. Terminal failure: missing permission in Shopify.
  fake.state.scenario = { mode: "accessDenied", lines: [], pollsBeforeDone: 1 };
  job = await mkJob(accA, storeA, prodCfg);
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "failed");
  assert.equal(j.error_code, "missing_scope");
  assert.match(j.error_detail, /permission/i);
  ok("e2e: permission errors fail immediately with an actionable message (no retry loop)");

  // E. Bulk failed once on Shopify's side, then reattach/retry works.
  fake.state.scenario = { mode: "bulkFailedOnce", lines: productLines, pollsBeforeDone: 1 };
  job = await mkJob(accA, storeA, prodCfg);
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "queued");
  await admin.from("export_jobs").update({ run_after: new Date(Date.now() - 1000).toISOString() }).eq("id", job.id);
  fake.state.bulkStarts = 0;
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "succeeded", j.error_detail);
  assert.equal(fake.state.bulkStarts, 1, "started a fresh operation because the old one failed");
  ok("e2e: a failed Shopify operation is replaced on retry");

  // F. Crash recovery: a stored bulk op id is reattached to, not restarted.
  fake.state.bulkStarts = 0;
  fake.state.scenario = { mode: "ok", lines: productLines, pollsBeforeDone: 1, knownOps: ["gid://shopify/BulkOperation/777"] };
  job = await mkJob(accA, storeA, prodCfg, { shopify_bulk_op: "gid://shopify/BulkOperation/777" });
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "succeeded", j.error_detail);
  assert.equal(fake.state.bulkStarts, 0, "no duplicate Shopify operation");
  ok("e2e: after a crash the job reattaches to its existing Shopify operation (no duplicate work)");

  // G. Empty result → header-only file.
  fake.state.scenario = { mode: "empty", lines: [], pollsBeforeDone: 1 };
  job = await mkJob(accA, storeA, { ...prodCfg, columns: ["handle", "sku"], renames: {} });
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "succeeded");
  assert.equal((await fileText(job.id)).text, "Handle,Variant SKU\r\n");
  ok("e2e: empty results still produce a valid header-only file");

  // H. Revoked credentials → final failure and the store is flagged.
  fake.state.scenario = { mode: "tokenRevoked", lines: [], pollsBeforeDone: 1 };
  job = await mkJob(accA, storeA, prodCfg);
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "failed");
  assert.equal(j.error_code, "invalid_credentials");
  const { data: st } = await admin.from("stores").select("status,last_error").eq("id", storeA).single();
  assert.equal(st.status, "needs_attention");
  ok("e2e: revoked credentials fail clearly and flag the store for attention");

  // I. Missing scope on the store record is caught before calling Shopify.
  const storeLimited = await mkStore(accA, "limited", "shpss_secret", ["read_products"]);
  fake.state.bulkStarts = 0;
  fake.state.scenario = { mode: "ok", lines: [], pollsBeforeDone: 1 };
  job = await mkJob(accA, storeLimited, { ...ordCfg, format: "csv" });
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "failed");
  assert.equal(j.error_code, "missing_scope");
  assert.equal(fake.state.bulkStarts, 0);
  ok("e2e: a store without the needed permission fails before calling Shopify");

  // J. Cross-tenant safety: a job pointing at another account's store must not run.
  const storeB = await mkStore(accB, "b");
  fake.state.bulkStarts = 0;
  fake.state.scenario = { mode: "ok", lines: productLines, pollsBeforeDone: 1 };
  job = await mkJob(accA, storeB, prodCfg);
  await drainQueue();
  j = await getJob(job.id);
  assert.equal(j.status, "failed");
  assert.equal(fake.state.bulkStarts, 0);
  assert.equal((await admin.from("export_files").select("id").eq("job_id", job.id)).data.length, 0);
  ok("e2e: a job can never run against a store owned by another account");

  // K. Expiry cleanup removes the stored file.
  const { file: old } = await fileText((await admin.from("export_jobs").select("id").eq("account_id", accA).eq("status", "succeeded").limit(1).single()).data.id);
  await admin.from("export_files").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", old.id);
  assert.ok((await cleanupExpiredFiles()) >= 1);
  const dir = old.storage_key.split("/").slice(0, 2).join("/");
  const listed = await admin.storage.from("exports").list(dir);
  assert.equal(listed.data.length, 0, "file removed from storage");
  assert.ok((await admin.from("export_files").select("deleted_at").eq("id", old.id).single()).data.deleted_at);
  ok("e2e: expired files are deleted from storage");

  console.log(`\nAll ${pass} checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.stack ?? e.message);
  process.exitCode = 1;
} finally {
  // Remove stored files, then users (cascades), then accounts.
  const { data: files } = await admin.from("export_files").select("storage_key").like("storage_key", "%/%");
  const mine = [];
  for (const u of createdUsers) {
    const { data: m } = await admin.from("members").select("account_id").eq("user_id", u);
    for (const x of m ?? []) {
      const { data: fs } = await admin.from("export_files").select("storage_key").eq("account_id", x.account_id);
      mine.push(...(fs ?? []).map((f) => f.storage_key));
    }
  }
  if (mine.length) await admin.storage.from("exports").remove(mine);
  void files;
  for (const u of createdUsers) await admin.auth.admin.deleteUser(u);
  const { data: accs } = await admin.from("accounts").select("id").like("name", `exp-${tag}-%`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  await fake.close();
  console.log("cleaned up test data");
}
