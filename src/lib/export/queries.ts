// Builds the GraphQL query for an export. The same text is used for:
//  - bulk operations (top = nested = null: Shopify ignores pagination, no limits), and
//  - the small live preview (top/nested set to a few rows).
// Field names were validated against the Admin GraphQL schema for API 2026-10.
// Shopify bulk limits respected: max 5 connections, max 2 levels of nesting.

import { MF_KEY, VMF_KEY, type ExportConfig, type ResourceId } from "../export.ts";

const q = JSON.stringify;

export const ROOT_FIELD: Record<ResourceId, string> = {
  products: "products",
  orders: "orders",
  customers: "customers",
  inventory: "inventoryItems",
  collections: "collections",
};

/** Shopify search syntax for filters Shopify can apply server-side. */
export function searchFilter(cfg: ExportConfig): string {
  const parts: string[] = [];
  const r = cfg.resource;
  if (cfg.status) {
    if (r === "products") parts.push(`status:${cfg.status}`);
    if (r === "orders") parts.push(`financial_status:${cfg.status}`);
  }
  if (cfg.tag && (r === "products" || r === "orders" || r === "customers")) parts.push(`tag:${q(cfg.tag)}`);
  if (r === "products" || r === "orders") {
    if (cfg.dateFrom) parts.push(`created_at:>=${cfg.dateFrom}T00:00:00Z`);
    if (cfg.dateTo) parts.push(`created_at:<=${cfg.dateTo}T23:59:59Z`);
  }
  return parts.join(" ");
}

function conn(name: string, args: string[], body: string, first: number | null): string {
  const a = [...(first !== null ? [`first: ${first}`] : []), ...args].join(", ");
  return `${name}${a ? `(${a})` : ""} { edges { node { ${body} } } }`;
}

/** Custom metafield columns become aliased selections: mf0, mf1, ... (variant level: vmf0, ...) */
export function metafieldColumns(cfg: ExportConfig, variant = false): { alias: string; key: string }[] {
  const re = variant ? VMF_KEY : MF_KEY;
  return cfg.columns.filter((c) => re.test(c)).map((key, i) => ({ alias: `${variant ? "vmf" : "mf"}${i}`, key }));
}

function mfSelection(cfg: ExportConfig, variant = false): string {
  const re = variant ? VMF_KEY : MF_KEY;
  return metafieldColumns(cfg, variant)
    .map(({ alias, key }) => {
      const m = re.exec(key)!;
      return `${alias}: metafield(namespace: ${q(m[1])}, key: ${q(m[2])}) { value }`;
    })
    .join(" ");
}

/** key → GraphQL selection. Several keys may share a selection; duplicates are merged. */
function pick(cfg: ExportConfig, map: Record<string, string>, extra: string[] = []): string {
  const out = new Set<string>(extra);
  for (const c of cfg.columns) if (map[c]) out.add(map[c]);
  return [...out].join(" ");
}

const PRODUCT: Record<string, string> = {
  id: "legacyResourceId",
  gid: "id",
  handle: "handle",
  title: "title",
  body_html: "descriptionHtml",
  description: "description",
  vendor: "vendor",
  type: "productType",
  category: "category { fullName }",
  tags: "tags",
  status: "status",
  created_at: "createdAt",
  updated_at: "updatedAt",
  published_at: "publishedAt",
  template_suffix: "templateSuffix",
  gift_card: "isGiftCard",
  url: "onlineStoreUrl",
  total_inventory: "totalInventory",
  options: "options { name }",
  image: "featuredMedia { preview { image { url } } }",
  seo_title: "seo { title }",
  seo_desc: "seo { description }",
};
const VARIANT: Record<string, string> = {
  variant_id: "legacyResourceId",
  variant: "title",
  option1_name: "selectedOptions { name value }",
  option1_value: "selectedOptions { name value }",
  option2_name: "selectedOptions { name value }",
  option2_value: "selectedOptions { name value }",
  option3_name: "selectedOptions { name value }",
  option3_value: "selectedOptions { name value }",
  position: "position",
  sku: "sku",
  price: "price",
  compare_at: "compareAtPrice",
  taxable: "taxable",
  inventory_policy: "inventoryPolicy",
  qty: "inventoryQuantity",
};
// Fields that live on the variant's inventory item; merged into one `inventoryItem { ... }`.
const VARIANT_ITEM: Record<string, string> = {
  cost: "unitCost { amount }",
  weight: "measurement { weight { value unit } }",
  requires_shipping: "requiresShipping",
  tracked: "tracked",
  hs_code: "harmonizedSystemCode",
  origin_country: "countryCodeOfOrigin",
  origin_province: "provinceCodeOfOrigin",
};
const ORDER: Record<string, string> = {
  id: "legacyResourceId",
  order: "name",
  number: "number",
  created_at: "createdAt",
  processed_at: "processedAt",
  updated_at: "updatedAt",
  cancelled_at: "cancelledAt",
  cancel_reason: "cancelReason",
  financial: "displayFinancialStatus",
  fulfillment: "displayFulfillmentStatus",
  tags: "tags",
  note: "note",
  currency: "currencyCode",
  source: "sourceName",
  gateways: "paymentGatewayNames",
  test: "test",
  email: "email",
  phone: "phone",
  customer_name: "customer { displayName }",
  ship_name: "shippingAddress { name }",
  ship_company: "shippingAddress { company }",
  ship_addr: "shippingAddress { address1 }",
  ship_addr2: "shippingAddress { address2 }",
  ship_city: "shippingAddress { city }",
  ship_province: "shippingAddress { provinceCode }",
  ship_zip: "shippingAddress { zip }",
  ship_country: "shippingAddress { countryCodeV2 }",
  ship_phone: "shippingAddress { phone }",
  bill_name: "billingAddress { name }",
  bill_addr: "billingAddress { address1 }",
  bill_city: "billingAddress { city }",
  bill_zip: "billingAddress { zip }",
  bill_country: "billingAddress { countryCodeV2 }",
  ship_method: "shippingLine { title }",
  ship_price: "shippingLine { originalPriceSet { shopMoney { amount } } }",
  tracking_company: "fulfillments { trackingInfo { company number url } }",
  tracking_number: "fulfillments { trackingInfo { company number url } }",
  tracking_url: "fulfillments { trackingInfo { company number url } }",
  discount: "discountCodes",
  subtotal: "subtotalPriceSet { shopMoney { amount } }",
  shipping_total: "totalShippingPriceSet { shopMoney { amount } }",
  discounts_total: "totalDiscountsSet { shopMoney { amount } }",
  tax: "totalTaxSet { shopMoney { amount } }",
  total: "totalPriceSet { shopMoney { amount } }",
  refunded: "totalRefundedSet { shopMoney { amount } }",
};
const LINE: Record<string, string> = {
  line_id: "id",
  line_sku: "sku",
  line_title: "title",
  line_variant: "variantTitle",
  line_vendor: "vendor",
  line_qty: "quantity",
  line_price: "originalUnitPriceSet { shopMoney { amount } }",
  line_discount: "totalDiscountSet { shopMoney { amount } }",
  line_taxable: "taxable",
  line_requires_shipping: "requiresShipping",
  line_product_id: "product { legacyResourceId }",
  line_variant_id: "variant { legacyResourceId }",
};
const CUSTOMER: Record<string, string> = {
  id: "legacyResourceId",
  email: "defaultEmailAddress { emailAddress }",
  first: "firstName",
  last: "lastName",
  name: "displayName",
  phone: "defaultPhoneNumber { phoneNumber }",
  state: "state",
  verified: "verifiedEmail",
  tax_exempt: "taxExempt",
  locale: "locale",
  note: "note",
  created_at: "createdAt",
  updated_at: "updatedAt",
  status: "defaultEmailAddress { marketingState }",
  tags: "tags",
  orders: "numberOfOrders",
  spent: "amountSpent { amount }",
  last_order: "lastOrder { name }",
  company: "defaultAddress { company }",
  address1: "defaultAddress { address1 }",
  address2: "defaultAddress { address2 }",
  city: "defaultAddress { city }",
  province: "defaultAddress { provinceCode }",
  zip: "defaultAddress { zip }",
  country: "defaultAddress { countryCodeV2 }",
  address_phone: "defaultAddress { phone }",
};
const INVENTORY_ITEM: Record<string, string> = {
  item_id: "legacyResourceId",
  sku: "sku",
  tracked: "tracked",
  requires_shipping: "requiresShipping",
  cost: "unitCost { amount }",
  hs_code: "harmonizedSystemCode",
  origin_country: "countryCodeOfOrigin",
};
const COLLECTION: Record<string, string> = {
  id: "legacyResourceId",
  handle: "handle",
  title: "title",
  description: "description",
  description_html: "descriptionHtml",
  count: "productsCount { count }",
  sort_order: "sortOrder",
  template_suffix: "templateSuffix",
  image: "image { url }",
  created_at: "createdAt",
  updated_at: "updatedAt",
  seo_title: "seo { title }",
  seo_desc: "seo { description }",
};

/** Keys that have a GraphQL selection, per resource. Used by tests to catch forgotten columns. */
export const QUERY_KEYS: Record<ResourceId, string[]> = {
  products: [...Object.keys(PRODUCT), ...Object.keys(VARIANT), ...Object.keys(VARIANT_ITEM), "barcode", "images", "collections"],
  orders: [...Object.keys(ORDER), ...Object.keys(LINE)],
  customers: Object.keys(CUSTOMER),
  inventory: [...Object.keys(INVENTORY_ITEM), "title", "variant", "location", "available", "on_hand", "committed", "incoming", "reserved", "damaged", "quality_control", "safety_stock", "level_updated"],
  collections: Object.keys(COLLECTION),
};

/** `top`/`nested` are null for bulk operations, or small numbers for a live preview. */
export function buildQuery(cfg: ExportConfig, top: number | null = null, nested: number | null = null): string {
  const filter = searchFilter(cfg);
  const rootArgs = filter ? [`query: ${q(filter)}`] : [];
  const has = (k: string) => cfg.columns.includes(k);
  const mf = mfSelection(cfg);

  let body: string;
  switch (cfg.resource) {
    case "products": {
      const item = new Set<string>();
      for (const c of cfg.columns) if (VARIANT_ITEM[c]) item.add(VARIANT_ITEM[c]);
      const barcode = has("barcode") ? conn("barcodes", [], "value", nested === null ? null : 3) : "";
      const variantBody = [
        pick(cfg, VARIANT, ["id"]),
        item.size ? `inventoryItem { ${[...item].join(" ")} }` : "",
        mfSelection(cfg, true),
        barcode,
      ].filter(Boolean).join(" ");
      const collections = has("collections") ? conn("collections", [], "id handle", nested === null ? null : 10) : "";
      const media = has("images") ? conn("media", [], "id preview { image { url } }", nested === null ? null : 10) : "";
      body = [pick(cfg, PRODUCT, ["id"]), mf, conn("variants", [], variantBody, nested), collections, media].filter(Boolean).join(" ");
      break;
    }
    case "orders": {
      const lines = conn("lineItems", [], pick(cfg, LINE, ["id"]), nested);
      body = [pick(cfg, ORDER, ["id"]), mf, lines].filter(Boolean).join(" ");
      break;
    }
    case "customers": {
      const extra = ["id"];
      if (cfg.status) extra.push(CUSTOMER.status);
      if (cfg.dateFrom || cfg.dateTo) extra.push(CUSTOMER.created_at);
      body = [pick(cfg, CUSTOMER, extra), mf].filter(Boolean).join(" ");
      break;
    }
    case "inventory": {
      const variants = conn("variants", [], "id title product { title }", nested === null ? null : 1);
      const levels = conn(
        "inventoryLevels",
        [],
        `id updatedAt location { name } quantities(names: ["available", "on_hand", "committed", "incoming", "reserved", "damaged", "quality_control", "safety_stock"]) { name quantity }`,
        nested,
      );
      body = [pick(cfg, INVENTORY_ITEM, ["id", "sku"]), variants, levels].join(" ");
      break;
    }
    case "collections":
      body = [pick(cfg, COLLECTION, ["id"]), mf].filter(Boolean).join(" ");
      break;
  }
  return `{ ${conn(ROOT_FIELD[cfg.resource], rootArgs, body, top)} }`;
}
