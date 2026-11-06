// Export catalog, demo data and CSV writer for the UI-first build.
// The CSV writer is real; the rows are generated demo data until the Shopify connection exists.

export type ResourceId = "products" | "orders" | "customers" | "inventory" | "collections";

export type Field = { key: string; label: string; shopify: string; group: string; on?: boolean };

export type Resource = {
  id: ResourceId;
  label: string;
  blurb: string;
  scope: string;
  statuses: string[];
  total: number;
  fields: Field[];
};

const f = (group: string, key: string, label: string, shopify: string, on = false): Field => ({ group, key, label, shopify, on });

export const resources: Resource[] = [
  {
    id: "products",
    label: "Products",
    blurb: "One row per variant, with options, images, SEO and inventory.",
    scope: "read_products",
    statuses: ["active", "draft", "archived"],
    total: 12480,
    fields: [
      f("Basics", "handle", "Handle", "handle", true),
      f("Basics", "title", "Title", "title", true),
      f("Basics", "vendor", "Vendor", "vendor", true),
      f("Basics", "type", "Product type", "productType"),
      f("Basics", "status", "Status", "status", true),
      f("Basics", "tags", "Tags", "tags"),
      f("Basics", "created_at", "Created at", "createdAt"),
      f("Variants", "sku", "Variant SKU", "variants.sku", true),
      f("Variants", "variant", "Variant title", "variants.title", true),
      f("Variants", "price", "Price", "variants.price", true),
      f("Variants", "compare_at", "Compare-at price", "variants.compareAtPrice"),
      f("Variants", "cost", "Cost per item", "inventoryItem.unitCost"),
      f("Variants", "barcode", "Barcode", "variants.barcode"),
      f("Variants", "weight", "Weight (g)", "variants.weight"),
      f("Inventory", "qty", "Inventory quantity", "inventoryQuantity", true),
      f("Media & SEO", "image", "Image URL", "images.url"),
      f("Media & SEO", "seo_title", "SEO title", "seo.title"),
      f("Media & SEO", "seo_desc", "SEO description", "seo.description"),
      f("Metafields", "mf_material", "custom.material", "metafield(custom.material)"),
      f("Metafields", "mf_care", "custom.care_instructions", "metafield(custom.care_instructions)"),
    ],
  },
  {
    id: "orders",
    label: "Orders",
    blurb: "Orders with line items, shipping, discounts, taxes and status.",
    scope: "read_orders",
    statuses: ["paid", "pending", "refunded", "partially_refunded"],
    total: 48210,
    fields: [
      f("Order", "order", "Order name", "name", true),
      f("Order", "created_at", "Created at", "createdAt", true),
      f("Order", "financial", "Financial status", "displayFinancialStatus", true),
      f("Order", "fulfillment", "Fulfillment status", "displayFulfillmentStatus", true),
      f("Order", "tags", "Tags", "tags"),
      f("Order", "note", "Note", "note"),
      f("Customer", "email", "Customer email", "customer.email", true),
      f("Shipping", "ship_name", "Shipping name", "shippingAddress.name", true),
      f("Shipping", "ship_addr", "Shipping address", "shippingAddress.address1", true),
      f("Shipping", "ship_city", "Shipping city", "shippingAddress.city", true),
      f("Shipping", "ship_country", "Shipping country", "shippingAddress.countryCode", true),
      f("Shipping", "ship_method", "Shipping method", "shippingLine.title"),
      f("Line items", "line_sku", "Line SKU", "lineItems.sku", true),
      f("Line items", "line_title", "Line title", "lineItems.title", true),
      f("Line items", "line_qty", "Line quantity", "lineItems.quantity", true),
      f("Line items", "line_price", "Line price", "lineItems.originalUnitPrice"),
      f("Money", "discount", "Discount codes", "discountCodes"),
      f("Money", "subtotal", "Subtotal", "subtotalPrice"),
      f("Money", "tax", "Taxes", "totalTax"),
      f("Money", "total", "Total", "totalPrice"),
    ],
  },
  {
    id: "customers",
    label: "Customers",
    blurb: "Contact details, consent, tags, order counts and spend.",
    scope: "read_customers",
    statuses: ["subscribed", "unsubscribed", "not_subscribed"],
    total: 31940,
    fields: [
      f("Contact", "email", "Email", "email", true),
      f("Contact", "first", "First name", "firstName", true),
      f("Contact", "last", "Last name", "lastName", true),
      f("Contact", "phone", "Phone", "phone"),
      f("Marketing", "status", "Email marketing", "emailMarketingConsent.state", true),
      f("Marketing", "tags", "Tags", "tags", true),
      f("Orders", "orders", "Orders count", "numberOfOrders", true),
      f("Orders", "spent", "Total spent", "amountSpent", true),
      f("Address", "city", "City", "defaultAddress.city"),
      f("Address", "country", "Country", "defaultAddress.countryCode"),
      f("Meta", "created_at", "Created at", "createdAt"),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    blurb: "Stock levels by SKU and location.",
    scope: "read_inventory",
    statuses: ["in_stock", "low_stock", "out_of_stock"],
    total: 18220,
    fields: [
      f("Item", "sku", "SKU", "sku", true),
      f("Item", "title", "Product", "product.title", true),
      f("Item", "variant", "Variant", "variant.title", true),
      f("Location", "location", "Location", "location.name", true),
      f("Levels", "available", "Available", "available", true),
      f("Levels", "on_hand", "On hand", "onHand", true),
      f("Levels", "committed", "Committed", "committed"),
      f("Levels", "incoming", "Incoming", "incoming"),
    ],
  },
  {
    id: "collections",
    label: "Collections",
    blurb: "Smart and custom collections, rules and product counts.",
    scope: "read_products",
    statuses: ["published", "unpublished"],
    total: 214,
    fields: [
      f("Basics", "handle", "Handle", "handle", true),
      f("Basics", "title", "Title", "title", true),
      f("Basics", "type", "Type", "ruleSet", true),
      f("Basics", "status", "Published", "published", true),
      f("Basics", "count", "Products count", "productsCount", true),
      f("Basics", "rules", "Rules", "ruleSet.rules"),
      f("SEO", "seo_title", "SEO title", "seo.title"),
    ],
  },
];

export const getResource = (id: ResourceId) => resources.find((r) => r.id === id)!;

// Built-in templates
export type Template = {
  id: string;
  name: string;
  blurb: string;
  resource: ResourceId;
  columns: string[];
  status?: string;
  tag?: string;
  category: string;
};

export const templates: Template[] = [
  { id: "orders-3pl", name: "Orders for 3PL", blurb: "Order, ship-to address, SKU and quantity in a fixed layout.", resource: "orders", category: "Fulfillment", status: "paid", columns: ["order", "created_at", "ship_name", "ship_addr", "ship_city", "ship_country", "ship_method", "line_sku", "line_qty", "note"] },
  { id: "orders-accounting", name: "Orders for accounting", blurb: "Orders with discounts, taxes and totals for a period.", resource: "orders", category: "Finance", columns: ["order", "created_at", "financial", "discount", "subtotal", "tax", "total"] },
  { id: "catalog", name: "Full product catalog", blurb: "Every variant with price, inventory, images and SEO.", resource: "products", category: "Catalog", columns: ["handle", "title", "vendor", "type", "status", "sku", "variant", "price", "qty", "image", "seo_title", "seo_desc"] },
  { id: "price-cost", name: "Price and cost sheet", blurb: "SKU, price, compare-at and cost to review margin.", resource: "products", category: "Catalog", columns: ["sku", "title", "variant", "price", "compare_at", "cost"] },
  { id: "inventory-loc", name: "Inventory by location", blurb: "Available, on hand and committed per SKU and location.", resource: "inventory", category: "Fulfillment", columns: ["sku", "title", "variant", "location", "available", "on_hand", "committed"] },
  { id: "customers-email", name: "Customer list for email", blurb: "Subscribers with tags, order count and total spent.", resource: "customers", category: "Marketing", status: "subscribed", columns: ["email", "first", "last", "status", "tags", "orders", "spent"] },
  { id: "product-audit", name: "Product audit", blurb: "Spot missing images, SEO and zero-stock active products.", resource: "products", category: "Catalog", status: "active", columns: ["handle", "title", "status", "qty", "image", "seo_title", "seo_desc"] },
  { id: "metafields", name: "Product metafields", blurb: "Handles with their custom metafield values.", resource: "products", category: "Catalog", columns: ["handle", "title", "mf_material", "mf_care"] },
];

// ---- Demo rows (deterministic) ----
const pick = <T,>(a: T[], i: number) => a[i % a.length];
const vendors = ["Northwind", "Alder & Co", "Fieldnote", "Kestrel", "Lumen"];
const types = ["Leggings", "Jacket", "Tee", "Bottle", "Mat", "Shorts"];
const colors = ["Black", "Sand", "Olive", "Slate", "Rust"];
const sizes = ["XS", "S", "M", "L", "XL"];
const names = ["Maya", "Jo", "Dee", "Lena", "Sam", "Ravi", "Ines", "Tom", "Aiko", "Noor"];
const lasts = ["Reyes", "Okafor", "Lindqvist", "Patel", "Moreau", "Tanaka", "Silva", "Kim"];
const cities = [["Austin", "US"], ["Leeds", "GB"], ["Lyon", "FR"], ["Toronto", "CA"], ["Perth", "AU"], ["Cork", "IE"]];
const locations = ["Main warehouse", "East 3PL", "Retail store"];
const ship = ["Standard", "Express", "Economy"];

const iso = (daysAgo: number) => new Date(Date.UTC(2026, 10, 6) - daysAgo * 86400000).toISOString().slice(0, 10);

export type Row = Record<string, string | number>;

export function demoRow(resource: ResourceId, i: number): Row {
  const [city, country] = pick(cities, i);
  switch (resource) {
    case "products": {
      const t = pick(types, i);
      const c = pick(colors, i * 3);
      const s = pick(sizes, i);
      return {
        handle: `${t.toLowerCase()}-${c.toLowerCase()}-${1000 + Math.floor(i / 5)}`,
        title: `${c} ${t}`,
        vendor: pick(vendors, i),
        type: t,
        status: i % 9 === 0 ? "draft" : i % 23 === 0 ? "archived" : "active",
        tags: i % 3 === 0 ? "new, bestseller" : i % 3 === 1 ? "sale" : "",
        created_at: iso(5 + ((i * 7) % 300)),
        sku: `${t.slice(0, 3).toUpperCase()}-${c.slice(0, 2).toUpperCase()}-${s}-${100 + i}`,
        variant: `${c} / ${s}`,
        price: (24 + (i % 12) * 6).toFixed(2),
        compare_at: i % 3 === 1 ? (34 + (i % 12) * 6).toFixed(2) : "",
        cost: (9 + (i % 12) * 2).toFixed(2),
        barcode: `0${8400000000 + i * 37}`,
        weight: 180 + (i % 8) * 40,
        qty: (i * 13) % 90,
        image: `https://cdn.example.com/${t.toLowerCase()}-${c.toLowerCase()}.jpg`,
        seo_title: i % 4 === 0 ? "" : `${c} ${t} | Northwind`,
        seo_desc: i % 5 === 0 ? "" : `Shop the ${c.toLowerCase()} ${t.toLowerCase()}.`,
        mf_material: pick(["Recycled nylon", "Organic cotton", "Merino", "Polyester"], i),
        mf_care: i % 2 ? "Machine wash cold" : "",
      };
    }
    case "orders": {
      const total = 40 + ((i * 17) % 160);
      return {
        order: `#${10420 + i}`,
        created_at: iso(i % 60),
        financial: pick(["paid", "paid", "paid", "pending", "refunded", "partially_refunded"], i),
        status: pick(["paid", "paid", "paid", "pending", "refunded", "partially_refunded"], i),
        fulfillment: pick(["fulfilled", "unfulfilled", "fulfilled", "partial"], i),
        tags: i % 7 === 0 ? "vip" : "",
        note: i % 11 === 0 ? "Leave at door" : "",
        email: `${pick(names, i).toLowerCase()}.${pick(lasts, i * 3).toLowerCase()}@example.com`,
        ship_name: `${pick(names, i)} ${pick(lasts, i * 3)}`,
        ship_addr: `${10 + (i % 90)} ${pick(["Oak St", "High Rd", "Rue Neuve", "King Ave"], i)}`,
        ship_city: city,
        ship_country: country,
        ship_method: pick(ship, i),
        line_sku: `${pick(types, i).slice(0, 3).toUpperCase()}-${pick(colors, i).slice(0, 2).toUpperCase()}-${pick(sizes, i)}-${100 + i}`,
        line_title: `${pick(colors, i)} ${pick(types, i)}`,
        line_qty: 1 + (i % 3),
        line_price: (24 + (i % 12) * 6).toFixed(2),
        discount: i % 5 === 0 ? "WELCOME10" : "",
        subtotal: (total * 0.9).toFixed(2),
        tax: (total * 0.1).toFixed(2),
        total: total.toFixed(2),
      };
    }
    case "customers":
      return {
        email: `${pick(names, i).toLowerCase()}.${pick(lasts, i * 3).toLowerCase()}${i}@example.com`,
        first: pick(names, i),
        last: pick(lasts, i * 3),
        phone: i % 3 === 0 ? `+1 555 01${String(i % 100).padStart(2, "0")}` : "",
        status: pick(["subscribed", "subscribed", "unsubscribed", "not_subscribed"], i),
        tags: i % 6 === 0 ? "vip" : i % 4 === 0 ? "wholesale" : "",
        orders: 1 + (i % 9),
        spent: (60 + ((i * 29) % 900)).toFixed(2),
        city,
        country,
        created_at: iso(10 + ((i * 5) % 500)),
      };
    case "inventory": {
      const qty = (i * 11) % 80;
      return {
        sku: `${pick(types, i).slice(0, 3).toUpperCase()}-${pick(colors, i).slice(0, 2).toUpperCase()}-${pick(sizes, i)}-${100 + Math.floor(i / 3)}`,
        title: `${pick(colors, i)} ${pick(types, i)}`,
        variant: `${pick(colors, i)} / ${pick(sizes, i)}`,
        location: pick(locations, i),
        available: qty,
        on_hand: qty + (i % 4),
        committed: i % 4,
        incoming: i % 6 === 0 ? 24 : 0,
        status: qty === 0 ? "out_of_stock" : qty < 10 ? "low_stock" : "in_stock",
      };
    }
    case "collections":
      return {
        handle: `${pick(types, i).toLowerCase()}-collection-${i}`,
        title: `${pick(types, i)} ${i % 2 ? "Essentials" : "Edit"}`,
        type: i % 2 ? "smart" : "custom",
        status: i % 8 === 0 ? "unpublished" : "published",
        count: 8 + ((i * 3) % 60),
        rules: i % 2 ? "tag equals new" : "",
        seo_title: i % 3 ? `${pick(types, i)} | Northwind` : "",
      };
  }
}

export type BuildConfig = {
  resource: ResourceId;
  columns: string[]; // ordered keys
  renames: Record<string, string>;
  status: string; // "" = any
  tag: string;
  dateFrom: string;
  dateTo: string;
};

export function buildRows(cfg: BuildConfig, limit: number): Row[] {
  const out: Row[] = [];
  for (let i = 0; i < 400 && out.length < limit; i++) {
    const r = demoRow(cfg.resource, i);
    if (cfg.status && r.status !== cfg.status && r.financial !== cfg.status) continue;
    if (cfg.tag && !String(r.tags ?? "").toLowerCase().includes(cfg.tag.toLowerCase())) continue;
    const d = r.created_at as string | undefined;
    if (d && cfg.dateFrom && d < cfg.dateFrom) continue;
    if (d && cfg.dateTo && d > cfg.dateTo) continue;
    out.push(r);
  }
  return out;
}

// ---- CSV writer ----
// Strings starting with = + - @ tab or CR are prefixed with an apostrophe so spreadsheets
// don't run them as formulas. Numbers are written as-is.
export function safeCell(v: string | number): string {
  if (typeof v === "number") return String(v);
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export function toDelimited(rows: Row[], keys: string[], headers: string[], delimiter: string, bom: boolean): string {
  const esc = (s: string) => (s.includes(delimiter) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [headers.map(esc).join(delimiter)];
  for (const r of rows) lines.push(keys.map((k) => esc(safeCell(r[k] ?? ""))).join(delimiter));
  return (bom ? "﻿" : "") + lines.join("\r\n") + "\r\n";
}

// ---- History / schedules / destinations / stores (demo) ----
export const history = [
  { id: "r-1042", name: "Orders for 3PL", resource: "Orders", status: "succeeded", rows: 1284, size: "412 KB", duration: "34s", trigger: "Schedule", when: "Today, 06:00", dest: "SFTP · eastcoast-3pl" },
  { id: "r-1041", name: "Inventory by location", resource: "Inventory", status: "succeeded", rows: 18220, size: "2.1 MB", duration: "1m 12s", trigger: "Schedule", when: "Today, 05:00", dest: "Google Drive" },
  { id: "r-1040", name: "Full product catalog", resource: "Products", status: "running", rows: 7400, size: "–", duration: "–", trigger: "Manual", when: "Just now", dest: "Download" },
  { id: "r-1039", name: "Customer list for email", resource: "Customers", status: "failed", rows: 0, size: "–", duration: "8s", trigger: "Schedule", when: "Yesterday, 22:00", dest: "Email", error: "Access token was revoked. Reconnect the store." },
  { id: "r-1038", name: "Orders for accounting", resource: "Orders", status: "succeeded", rows: 48210, size: "9.8 MB", duration: "3m 02s", trigger: "Manual", when: "Nov 4, 16:20", dest: "Download" },
  { id: "r-1037", name: "Product audit", resource: "Products", status: "succeeded", rows: 12480, size: "3.4 MB", duration: "1m 48s", trigger: "Manual", when: "Nov 3, 11:05", dest: "Email" },
];

export const schedules = [
  { id: "s1", name: "Orders for 3PL", frequency: "Every day at 06:00", tz: "America/New_York", dest: "SFTP · eastcoast-3pl", incremental: true, next: "Tomorrow, 06:00", last: "succeeded", paused: false },
  { id: "s2", name: "Inventory by location", frequency: "Every hour", tz: "UTC", dest: "Google Drive", incremental: false, next: "In 38 min", last: "succeeded", paused: false },
  { id: "s3", name: "Customer list for email", frequency: "Every Monday at 22:00", tz: "UTC", dest: "Email", incremental: true, next: "Paused", last: "failed", paused: true },
  { id: "s4", name: "Orders for accounting", frequency: "1st of the month at 02:00", tz: "Europe/London", dest: "Dropbox", incremental: false, next: "Dec 1, 02:00", last: "succeeded", paused: false },
];

export const destinations = [
  { id: "d1", type: "SFTP", name: "eastcoast-3pl", detail: "sftp.eastcoast3pl.com · /inbound/orders", ok: true },
  { id: "d2", type: "Google Drive", name: "Ops exports", detail: "ops@northwind.com · /Userelay", ok: true },
  { id: "d3", type: "Dropbox", name: "Finance", detail: "finance@northwind.com · /Exports", ok: true },
  { id: "d4", type: "Email", name: "Team inbox", detail: "ops@northwind.com, finance@northwind.com", ok: true },
];

export const stores = [
  { id: "st1", domain: "northwind-active.myshopify.com", status: "connected", scopes: ["read_products", "read_inventory", "read_orders", "read_customers"], checked: "2 minutes ago" },
  { id: "st2", domain: "northwind-outlet.myshopify.com", status: "needs_attention", scopes: ["read_products", "read_inventory"], checked: "Yesterday", error: "Access token was revoked." },
];

export const num = (n: number) => n.toLocaleString("en-US");
