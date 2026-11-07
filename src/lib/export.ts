// Export catalog shared by the browser (builder UI) and the server (job runner).
// No Node-only imports here.

export type ResourceId = "products" | "orders" | "customers" | "inventory" | "collections";

export type Speed = "fast" | "slow";

export type Field = {
  key: string;
  label: string;
  shopify: string;
  group: string;
  on?: boolean;
  /** "slow" = needs an extra Shopify connection, so the export takes noticeably longer. */
  speed?: Speed;
  isNew?: boolean;
};

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

const f = (group: string, key: string, label: string, shopify: string, on = false, speed: Speed = "fast"): Field => ({ group, key, label, shopify, on, speed });

export const resources: Resource[] = [
  {
    id: "products",
    label: "Products",
    blurb: "One row per variant: details, options, price, inventory, images, collections, SEO and customs.",
    scope: "read_products",
    statuses: ["active", "draft", "archived"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Product", "id", "ID", "legacyResourceId"),
      f("Product", "gid", "Admin GraphQL ID", "id"),
      f("Product", "handle", "Handle", "handle", true),
      f("Product", "title", "Title", "title", true),
      f("Product", "body_html", "Body (HTML)", "descriptionHtml"),
      f("Product", "description", "Description (plain text)", "description"),
      f("Product", "vendor", "Vendor", "vendor", true),
      f("Product", "type", "Product type", "productType"),
      f("Product", "category", "Category", "category.fullName"),
      f("Product", "tags", "Tags", "tags"),
      f("Product", "status", "Status", "status", true),
      f("Product", "created_at", "Created at", "createdAt"),
      f("Product", "updated_at", "Updated at", "updatedAt"),
      f("Product", "published_at", "Published at", "publishedAt"),
      f("Product", "template_suffix", "Template suffix", "templateSuffix"),
      f("Product", "gift_card", "Gift card", "isGiftCard"),
      f("Product", "url", "Online store URL", "onlineStoreUrl"),
      f("Product", "total_inventory", "Total inventory", "totalInventory"),
      f("Product", "options", "Option names", "options.name"),
      f("Variant", "variant_id", "Variant ID", "variants.legacyResourceId"),
      f("Variant", "variant", "Variant title", "variants.title", true),
      f("Variant", "option1_name", "Option 1 name", "variants.selectedOptions[0].name"),
      f("Variant", "option1_value", "Option 1 value", "variants.selectedOptions[0].value"),
      f("Variant", "option2_name", "Option 2 name", "variants.selectedOptions[1].name"),
      f("Variant", "option2_value", "Option 2 value", "variants.selectedOptions[1].value"),
      f("Variant", "option3_name", "Option 3 name", "variants.selectedOptions[2].name"),
      f("Variant", "option3_value", "Option 3 value", "variants.selectedOptions[2].value"),
      f("Variant", "position", "Variant position", "variants.position"),
      f("Variant", "sku", "Variant SKU", "variants.sku", true),
      f("Variant", "barcode", "Variant barcode", "variants.barcodes", false, "slow"),
      f("Variant", "price", "Price", "variants.price", true),
      f("Variant", "compare_at", "Compare-at price", "variants.compareAtPrice"),
      f("Variant", "taxable", "Taxable", "variants.taxable"),
      f("Variant", "inventory_policy", "Inventory policy", "variants.inventoryPolicy"),
      f("Variant", "qty", "Inventory quantity", "variants.inventoryQuantity", true),
      f("Cost & shipping", "cost", "Cost per item", "inventoryItem.unitCost"),
      f("Cost & shipping", "weight", "Weight", "inventoryItem.measurement.weight"),
      f("Cost & shipping", "requires_shipping", "Requires shipping", "inventoryItem.requiresShipping"),
      f("Cost & shipping", "tracked", "Inventory tracked", "inventoryItem.tracked"),
      f("Customs", "hs_code", "HS code", "inventoryItem.harmonizedSystemCode"),
      f("Customs", "origin_country", "Country of origin", "inventoryItem.countryCodeOfOrigin"),
      f("Customs", "origin_province", "Province of origin", "inventoryItem.provinceCodeOfOrigin"),
      f("Media & SEO", "image", "Featured image URL", "featuredMedia.preview.image.url"),
      f("Media & SEO", "images", "All media URLs", "media.preview.image.url", false, "slow"),
      f("Media & SEO", "seo_title", "SEO title", "seo.title"),
      f("Media & SEO", "seo_desc", "SEO description", "seo.description"),
      f("Collections", "collections", "Collections (handles)", "collections.handle", false, "slow"),
    ],
  },
  {
    id: "orders",
    label: "Orders",
    blurb: "One row per line item: customer, addresses, shipping, tracking, discounts, taxes and totals.",
    scope: "read_orders",
    statuses: ["paid", "pending", "refunded", "partially_refunded"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Order", "id", "ID", "legacyResourceId"),
      f("Order", "order", "Order name", "name", true),
      f("Order", "number", "Order number", "number"),
      f("Order", "created_at", "Created at", "createdAt", true),
      f("Order", "processed_at", "Processed at", "processedAt"),
      f("Order", "updated_at", "Updated at", "updatedAt"),
      f("Order", "cancelled_at", "Cancelled at", "cancelledAt"),
      f("Order", "cancel_reason", "Cancel reason", "cancelReason"),
      f("Order", "financial", "Financial status", "displayFinancialStatus", true),
      f("Order", "fulfillment", "Fulfillment status", "displayFulfillmentStatus", true),
      f("Order", "tags", "Tags", "tags"),
      f("Order", "note", "Note", "note"),
      f("Order", "currency", "Currency", "currencyCode"),
      f("Order", "source", "Source", "sourceName"),
      f("Order", "gateways", "Payment gateways", "paymentGatewayNames"),
      f("Order", "test", "Test order", "test"),
      f("Customer", "email", "Customer email", "email", true),
      f("Customer", "phone", "Customer phone", "phone"),
      f("Customer", "customer_name", "Customer name", "customer.displayName"),
      f("Shipping address", "ship_name", "Shipping name", "shippingAddress.name", true),
      f("Shipping address", "ship_company", "Shipping company", "shippingAddress.company"),
      f("Shipping address", "ship_addr", "Shipping address 1", "shippingAddress.address1", true),
      f("Shipping address", "ship_addr2", "Shipping address 2", "shippingAddress.address2"),
      f("Shipping address", "ship_city", "Shipping city", "shippingAddress.city", true),
      f("Shipping address", "ship_province", "Shipping province code", "shippingAddress.provinceCode"),
      f("Shipping address", "ship_zip", "Shipping postcode", "shippingAddress.zip"),
      f("Shipping address", "ship_country", "Shipping country", "shippingAddress.countryCodeV2", true),
      f("Shipping address", "ship_phone", "Shipping phone", "shippingAddress.phone"),
      f("Billing address", "bill_name", "Billing name", "billingAddress.name"),
      f("Billing address", "bill_addr", "Billing address 1", "billingAddress.address1"),
      f("Billing address", "bill_city", "Billing city", "billingAddress.city"),
      f("Billing address", "bill_zip", "Billing postcode", "billingAddress.zip"),
      f("Billing address", "bill_country", "Billing country", "billingAddress.countryCodeV2"),
      f("Shipping & tracking", "ship_method", "Shipping method", "shippingLine.title"),
      f("Shipping & tracking", "ship_price", "Shipping price", "shippingLine.originalPriceSet"),
      f("Shipping & tracking", "tracking_company", "Tracking company", "fulfillments.trackingInfo.company"),
      f("Shipping & tracking", "tracking_number", "Tracking number", "fulfillments.trackingInfo.number"),
      f("Shipping & tracking", "tracking_url", "Tracking URL", "fulfillments.trackingInfo.url"),
      f("Money", "discount", "Discount codes", "discountCodes"),
      f("Money", "subtotal", "Subtotal", "subtotalPriceSet"),
      f("Money", "shipping_total", "Shipping total", "totalShippingPriceSet"),
      f("Money", "discounts_total", "Total discounts", "totalDiscountsSet"),
      f("Money", "tax", "Taxes", "totalTaxSet"),
      f("Money", "total", "Total", "totalPriceSet"),
      f("Money", "refunded", "Total refunded", "totalRefundedSet"),
      f("Line item", "line_id", "Line item ID", "lineItems.id"),
      f("Line item", "line_sku", "Line SKU", "lineItems.sku", true),
      f("Line item", "line_title", "Line title", "lineItems.title", true),
      f("Line item", "line_variant", "Line variant title", "lineItems.variantTitle"),
      f("Line item", "line_vendor", "Line vendor", "lineItems.vendor"),
      f("Line item", "line_qty", "Line quantity", "lineItems.quantity", true),
      f("Line item", "line_price", "Line unit price", "lineItems.originalUnitPriceSet"),
      f("Line item", "line_discount", "Line discount", "lineItems.totalDiscountSet"),
      f("Line item", "line_taxable", "Line taxable", "lineItems.taxable"),
      f("Line item", "line_requires_shipping", "Line requires shipping", "lineItems.requiresShipping"),
      f("Line item", "line_product_id", "Line product ID", "lineItems.product.legacyResourceId"),
      f("Line item", "line_variant_id", "Line variant ID", "lineItems.variant.legacyResourceId"),
    ],
  },
  {
    id: "customers",
    label: "Customers",
    blurb: "Contact details, marketing status, default address, tags, order counts and spend.",
    scope: "read_customers",
    statuses: ["subscribed", "unsubscribed", "not_subscribed"],
    tagFilter: true,
    dateFilter: true,
    metafields: true,
    fields: [
      f("Customer", "id", "ID", "legacyResourceId"),
      f("Customer", "email", "Email", "defaultEmailAddress.emailAddress", true),
      f("Customer", "first", "First name", "firstName", true),
      f("Customer", "last", "Last name", "lastName", true),
      f("Customer", "name", "Display name", "displayName"),
      f("Customer", "phone", "Phone", "defaultPhoneNumber.phoneNumber"),
      f("Customer", "state", "Account state", "state"),
      f("Customer", "verified", "Verified email", "verifiedEmail"),
      f("Customer", "tax_exempt", "Tax exempt", "taxExempt"),
      f("Customer", "locale", "Locale", "locale"),
      f("Customer", "note", "Note", "note"),
      f("Customer", "created_at", "Created at", "createdAt"),
      f("Customer", "updated_at", "Updated at", "updatedAt"),
      f("Marketing", "status", "Email marketing", "defaultEmailAddress.marketingState", true),
      f("Marketing", "tags", "Tags", "tags", true),
      f("Orders", "orders", "Orders count", "numberOfOrders", true),
      f("Orders", "spent", "Total spent", "amountSpent", true),
      f("Orders", "last_order", "Last order", "lastOrder.name"),
      f("Default address", "company", "Company", "defaultAddress.company"),
      f("Default address", "address1", "Address 1", "defaultAddress.address1"),
      f("Default address", "address2", "Address 2", "defaultAddress.address2"),
      f("Default address", "city", "City", "defaultAddress.city"),
      f("Default address", "province", "Province code", "defaultAddress.provinceCode"),
      f("Default address", "zip", "Postcode", "defaultAddress.zip"),
      f("Default address", "country", "Country", "defaultAddress.countryCodeV2"),
      f("Default address", "address_phone", "Address phone", "defaultAddress.phone"),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    blurb: "Stock by SKU and location with every quantity state: available, on hand, committed, reserved and more.",
    scope: "read_inventory",
    statuses: ["in_stock", "low_stock", "out_of_stock"],
    tagFilter: false,
    dateFilter: false,
    metafields: false,
    fields: [
      f("Item", "item_id", "Inventory item ID", "legacyResourceId"),
      f("Item", "sku", "SKU", "sku", true),
      f("Item", "title", "Product", "variants.product.title", true),
      f("Item", "variant", "Variant", "variants.title", true),
      f("Item", "tracked", "Tracked", "tracked"),
      f("Item", "requires_shipping", "Requires shipping", "requiresShipping"),
      f("Item", "cost", "Cost per item", "unitCost"),
      f("Item", "hs_code", "HS code", "harmonizedSystemCode"),
      f("Item", "origin_country", "Country of origin", "countryCodeOfOrigin"),
      f("Location", "location", "Location", "inventoryLevels.location.name", true),
      f("Quantities", "available", "Available", "quantities(available)", true),
      f("Quantities", "on_hand", "On hand", "quantities(on_hand)", true),
      f("Quantities", "committed", "Committed", "quantities(committed)"),
      f("Quantities", "incoming", "Incoming", "quantities(incoming)"),
      f("Quantities", "reserved", "Reserved", "quantities(reserved)"),
      f("Quantities", "damaged", "Damaged", "quantities(damaged)"),
      f("Quantities", "quality_control", "Quality control", "quantities(quality_control)"),
      f("Quantities", "safety_stock", "Safety stock", "quantities(safety_stock)"),
      f("Quantities", "level_updated", "Level updated at", "inventoryLevels.updatedAt"),
    ],
  },
  {
    id: "collections",
    label: "Collections",
    blurb: "Collections with descriptions, images, sort order, product counts and SEO.",
    scope: "read_products",
    statuses: [],
    tagFilter: false,
    dateFilter: false,
    metafields: true,
    fields: [
      f("Collection", "id", "ID", "legacyResourceId"),
      f("Collection", "handle", "Handle", "handle", true),
      f("Collection", "title", "Title", "title", true),
      f("Collection", "description", "Description (plain text)", "description"),
      f("Collection", "description_html", "Description (HTML)", "descriptionHtml"),
      f("Collection", "count", "Products count", "productsCount.count", true),
      f("Collection", "sort_order", "Sort order", "sortOrder"),
      f("Collection", "template_suffix", "Template suffix", "templateSuffix"),
      f("Collection", "image", "Image URL", "image.url"),
      f("Collection", "created_at", "Created at", "createdAt"),
      f("Collection", "updated_at", "Updated at", "updatedAt"),
      f("SEO", "seo_title", "SEO title", "seo.title"),
      f("SEO", "seo_desc", "SEO description", "seo.description"),
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
  { id: "orders-tracking", name: "Orders with tracking", blurb: "Who got what, with carrier and tracking number and link.", resource: "orders", category: "Fulfillment", columns: ["order", "created_at", "fulfillment", "ship_name", "ship_country", "tracking_company", "tracking_number", "tracking_url", "line_sku", "line_qty"] },
  { id: "customer-addresses", name: "Customer addresses", blurb: "Contact details with the full default address, ready for mailing.", resource: "customers", category: "Marketing", columns: ["email", "first", "last", "phone", "company", "address1", "address2", "city", "province", "zip", "country"] },
  { id: "inventory-all", name: "Inventory, every state", blurb: "Available, on hand, committed, reserved, damaged, incoming and safety stock.", resource: "inventory", category: "Fulfillment", columns: ["sku", "title", "variant", "location", "available", "on_hand", "committed", "reserved", "damaged", "incoming", "safety_stock"] },
  { id: "seo-collections", name: "SEO and collections audit", blurb: "Titles, descriptions, category and which collections each product sits in.", resource: "products", category: "Catalog", columns: ["handle", "title", "status", "category", "collections", "seo_title", "seo_desc", "image"] },
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
export const VMF_KEY = /^vmf:([a-z0-9_-]{2,40})\.([a-z0-9_-]{1,64})$/i; // variant-level metafield (products only)
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
    const isMf = MF_KEY.test(col) || (VMF_KEY.test(col) && resource.id === "products");
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
  const v = VMF_KEY.exec(key);
  if (v) return `Variant ${v[1]}.${v[2]}`;
  return resource.fields.find((fl) => fl.key === key)?.label ?? key;
}

export function fileName(name: string, format: FileFormat): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "export";
  return `${base}.${format === "tsv" ? "tsv" : "csv"}`;
}

export const num = (n: number) => n.toLocaleString("en-US");
