// Export catalog shared by the browser (builder UI) and the server (job runner).
// No Node-only imports here.

export type ResourceId = "products" | "orders" | "customers" | "inventory" | "collections";

export type Field = { key: string; label: string; shopify: string; group: string; on?: boolean };

export type Resource = {
  id: ResourceId;
  label: string;
  blurb: string;
  scope: string;
  statuses: string[]; // filter choices ("" = any)
  tagFilter: boolean;
  dateFilter: boolean;
  metafields: boolean;
  fields: Field[];
};

const f = (group: string, key: string, label: string, shopify: string, on = false): Field => ({ group, key, label, shopify, on });

export const resources: Resource[] = [
  {
    id: "products",
    label: "Products",
    blurb: "One row per variant, with price, inventory, images and SEO.",
    scope: "read_products",
    statuses: ["active", "draft", "archived"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Product", "handle", "Handle", "handle", true),
      f("Product", "title", "Title", "title", true),
      f("Product", "vendor", "Vendor", "vendor", true),
      f("Product", "type", "Product type", "productType"),
      f("Product", "status", "Status", "status", true),
      f("Product", "tags", "Tags", "tags"),
      f("Product", "created_at", "Created at", "createdAt"),
      f("Variant", "sku", "Variant SKU", "variants.sku", true),
      f("Variant", "variant", "Variant title", "variants.title", true),
      f("Variant", "price", "Price", "variants.price", true),
      f("Variant", "compare_at", "Compare-at price", "variants.compareAtPrice"),
      f("Variant", "cost", "Cost per item", "inventoryItem.unitCost"),
      f("Variant", "barcode", "Barcode", "variants.barcodes"),
      f("Variant", "weight", "Weight", "inventoryItem.measurement.weight"),
      f("Variant", "qty", "Inventory quantity", "variants.inventoryQuantity", true),
      f("Media & SEO", "image", "Featured image URL", "featuredMedia.preview.image.url"),
      f("Media & SEO", "seo_title", "SEO title", "seo.title"),
      f("Media & SEO", "seo_desc", "SEO description", "seo.description"),
    ],
  },
  {
    id: "orders",
    label: "Orders",
    blurb: "One row per line item, with shipping, discounts, taxes and status.",
    scope: "read_orders",
    statuses: ["paid", "pending", "refunded", "partially_refunded"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Order", "order", "Order name", "name", true),
      f("Order", "created_at", "Created at", "createdAt", true),
      f("Order", "financial", "Financial status", "displayFinancialStatus", true),
      f("Order", "fulfillment", "Fulfillment status", "displayFulfillmentStatus", true),
      f("Order", "tags", "Tags", "tags"),
      f("Order", "note", "Note", "note"),
      f("Order", "email", "Customer email", "email", true),
      f("Shipping", "ship_name", "Shipping name", "shippingAddress.name", true),
      f("Shipping", "ship_addr", "Shipping address", "shippingAddress.address1", true),
      f("Shipping", "ship_city", "Shipping city", "shippingAddress.city", true),
      f("Shipping", "ship_country", "Shipping country", "shippingAddress.countryCodeV2", true),
      f("Shipping", "ship_method", "Shipping method", "shippingLine.title"),
      f("Line item", "line_sku", "Line SKU", "lineItems.sku", true),
      f("Line item", "line_title", "Line title", "lineItems.title", true),
      f("Line item", "line_qty", "Line quantity", "lineItems.quantity", true),
      f("Line item", "line_price", "Line unit price", "lineItems.originalUnitPriceSet"),
      f("Money", "discount", "Discount codes", "discountCodes"),
      f("Money", "subtotal", "Subtotal", "subtotalPriceSet"),
      f("Money", "tax", "Taxes", "totalTaxSet"),
      f("Money", "total", "Total", "totalPriceSet"),
    ],
  },
  {
    id: "customers",
    label: "Customers",
    blurb: "Contact details, email marketing status, tags, order counts and spend.",
    scope: "read_customers",
    statuses: ["subscribed", "unsubscribed", "not_subscribed"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Contact", "email", "Email", "defaultEmailAddress.emailAddress", true),
      f("Contact", "first", "First name", "firstName", true),
      f("Contact", "last", "Last name", "lastName", true),
      f("Contact", "phone", "Phone", "defaultPhoneNumber.phoneNumber"),
      f("Marketing", "status", "Email marketing", "defaultEmailAddress.marketingState", true),
      f("Marketing", "tags", "Tags", "tags", true),
      f("Orders", "orders", "Orders count", "numberOfOrders", true),
      f("Orders", "spent", "Total spent", "amountSpent", true),
      f("Address", "city", "City", "defaultAddress.city"),
      f("Address", "country", "Country", "defaultAddress.countryCodeV2"),
      f("Meta", "created_at", "Created at", "createdAt"),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    blurb: "Stock levels by SKU and location.",
    scope: "read_inventory",
    statuses: ["in_stock", "low_stock", "out_of_stock"],
    tagFilter: false,
    dateFilter: false,
    metafields: false,
    fields: [
      f("Item", "sku", "SKU", "sku", true),
      f("Item", "title", "Product", "variants.product.title", true),
      f("Item", "variant", "Variant", "variants.title", true),
      f("Location", "location", "Location", "inventoryLevels.location.name", true),
      f("Levels", "available", "Available", "quantities(available)", true),
      f("Levels", "on_hand", "On hand", "quantities(on_hand)", true),
      f("Levels", "committed", "Committed", "quantities(committed)"),
      f("Levels", "incoming", "Incoming", "quantities(incoming)"),
    ],
  },
  {
    id: "collections",
    label: "Collections",
    blurb: "Collections with their product counts and SEO.",
    scope: "read_products",
    statuses: [],
    tagFilter: false,
    dateFilter: false,
    metafields: true,
    fields: [
      f("Collection", "handle", "Handle", "handle", true),
      f("Collection", "title", "Title", "title", true),
      f("Collection", "count", "Products count", "productsCount.count", true),
      f("Collection", "created_at", "Created at", "createdAt"),
      f("Collection", "updated_at", "Updated at", "updatedAt"),
      f("SEO", "seo_title", "SEO title", "seo.title"),
    ],
  },
];

export const getResource = (id: ResourceId) => resources.find((r) => r.id === id)!;

// ---------- Built-in templates ----------
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
];

// ---------- Config shared by the UI and the server ----------
export type FileFormat = "csv-bom" | "csv" | "tsv";

export type ExportConfig = {
  storeId: string;
  resource: ResourceId;
  columns: string[]; // ordered field keys; custom metafields look like "mf:namespace.key"
  renames: Record<string, string>;
  status: string; // "" = any
  tag: string;
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string;
  format: FileFormat;
  name: string;
};

export const MF_KEY = /^mf:([a-z0-9_-]{2,40})\.([a-z0-9_-]{1,64})$/i;
export const MAX_COLUMNS = 60;

/** Server-side validation. Never trust the client; returns an error message or null. */
export function validateConfig(c: unknown): { ok: true; config: ExportConfig } | { ok: false; error: string } {
  if (!c || typeof c !== "object") return { ok: false, error: "Invalid export settings." };
  const x = c as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);

  const resource = resources.find((r) => r.id === x.resource);
  if (!resource) return { ok: false, error: "Choose what to export." };
  const storeId = str(x.storeId, 64);
  if (!storeId) return { ok: false, error: "Choose a store." };

  if (!Array.isArray(x.columns) || x.columns.length === 0) return { ok: false, error: "Pick at least one column." };
  if (x.columns.length > MAX_COLUMNS) return { ok: false, error: `Use at most ${MAX_COLUMNS} columns.` };
  const known = new Set(resource.fields.map((fl) => fl.key));
  const columns: string[] = [];
  for (const col of x.columns) {
    if (typeof col !== "string") return { ok: false, error: "Invalid column." };
    const isMf = MF_KEY.test(col);
    if (!known.has(col) && !(isMf && resource.metafields)) return { ok: false, error: `Unknown column: ${col.slice(0, 40)}` };
    if (columns.includes(col)) continue;
    columns.push(col);
  }

  const renames: Record<string, string> = {};
  if (x.renames && typeof x.renames === "object") {
    for (const [k, v] of Object.entries(x.renames as Record<string, unknown>)) {
      if (!columns.includes(k)) continue;
      if (typeof v !== "string" || v.length > 100 || /[\r\n]/.test(v)) return { ok: false, error: "Column headers must be one line, up to 100 characters." };
      if (v.trim()) renames[k] = v.trim();
    }
  }

  const status = str(x.status, 40) ?? "";
  if (status && !resource.statuses.includes(status)) return { ok: false, error: "Unknown status filter." };
  const tag = (str(x.tag, 50) ?? "").trim();
  if (tag && !/^[\w .-]+$/.test(tag)) return { ok: false, error: "Tags can only contain letters, numbers, spaces, dots, dashes and underscores." };
  if (tag && !resource.tagFilter) return { ok: false, error: "Tag filter isn't available for this export." };
  const date = (v: unknown) => {
    const s = str(v, 10) ?? "";
    return s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  };
  const dateFrom = date(x.dateFrom);
  const dateTo = date(x.dateTo);
  if (dateFrom === null || dateTo === null) return { ok: false, error: "Dates must look like 2026-01-31." };
  if ((dateFrom || dateTo) && !resource.dateFilter) return { ok: false, error: "Date filter isn't available for this export." };
  if (dateFrom && dateTo && dateFrom > dateTo) return { ok: false, error: "The start date must be before the end date." };

  const format = x.format;
  if (format !== "csv" && format !== "csv-bom" && format !== "tsv") return { ok: false, error: "Choose a file type." };
  const name = (str(x.name, 80) ?? "").trim() || "export";

  return { ok: true, config: { storeId, resource: resource.id, columns, renames, status, tag, dateFrom, dateTo, format, name } };
}

export function columnLabel(resource: Resource, key: string): string {
  const m = MF_KEY.exec(key);
  if (m) return `${m[1]}.${m[2]}`;
  return resource.fields.find((fl) => fl.key === key)?.label ?? key;
}

export function fileName(name: string, format: FileFormat): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "export";
  return `${base}.${format === "tsv" ? "tsv" : "csv"}`;
}

export const num = (n: number) => n.toLocaleString("en-US");
