// Builds the GraphQL query for an export. The same text is used for:
//  - bulk operations (top = nested = null: Shopify ignores pagination, no limits), and
//  - the small live preview (top/nested set to a few rows).
// Field names were validated against the Admin GraphQL schema for API 2026-10.

import { MF_KEY, type ExportConfig, type ResourceId } from "../export.ts";

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

/** Custom metafield columns become aliased selections: mf0, mf1, ... */
export function metafieldColumns(cfg: ExportConfig): { alias: string; key: string }[] {
  return cfg.columns
    .filter((c) => MF_KEY.test(c))
    .map((key, i) => ({ alias: `mf${i}`, key }));
}

function mfSelection(cfg: ExportConfig): string {
  return metafieldColumns(cfg)
    .map(({ alias, key }) => {
      const m = MF_KEY.exec(key)!;
      return `${alias}: metafield(namespace: ${q(m[1])}, key: ${q(m[2])}) { value }`;
    })
    .join(" ");
}

function pick(cfg: ExportConfig, map: Record<string, string>, extra: string[] = []): string {
  const out = new Set<string>(extra);
  for (const c of cfg.columns) if (map[c]) out.add(map[c]);
  return [...out].join(" ");
}

const PRODUCT: Record<string, string> = {
  handle: "handle",
  title: "title",
  vendor: "vendor",
  type: "productType",
  status: "status",
  tags: "tags",
  created_at: "createdAt",
  image: "featuredMedia { preview { image { url } } }",
  seo_title: "seo { title }",
  seo_desc: "seo { description }",
};
const VARIANT: Record<string, string> = {
  sku: "sku",
  variant: "title",
  price: "price",
  compare_at: "compareAtPrice",
  qty: "inventoryQuantity",
  cost: "inventoryItem { unitCost { amount } }",
  weight: "inventoryItem { measurement { weight { value unit } } }",
};
const ORDER: Record<string, string> = {
  order: "name",
  created_at: "createdAt",
  financial: "displayFinancialStatus",
  fulfillment: "displayFulfillmentStatus",
  tags: "tags",
  note: "note",
  email: "email",
  ship_name: "shippingAddress { name }",
  ship_addr: "shippingAddress { address1 }",
  ship_city: "shippingAddress { city }",
  ship_country: "shippingAddress { countryCodeV2 }",
  ship_method: "shippingLine { title }",
  discount: "discountCodes",
  subtotal: "subtotalPriceSet { shopMoney { amount } }",
  tax: "totalTaxSet { shopMoney { amount } }",
  total: "totalPriceSet { shopMoney { amount } }",
};
const LINE: Record<string, string> = {
  line_sku: "sku",
  line_title: "title",
  line_qty: "quantity",
  line_price: "originalUnitPriceSet { shopMoney { amount } }",
};
const CUSTOMER: Record<string, string> = {
  email: "defaultEmailAddress { emailAddress }",
  status: "defaultEmailAddress { marketingState }",
  first: "firstName",
  last: "lastName",
  phone: "defaultPhoneNumber { phoneNumber }",
  tags: "tags",
  orders: "numberOfOrders",
  spent: "amountSpent { amount }",
  city: "defaultAddress { city }",
  country: "defaultAddress { countryCodeV2 }",
  created_at: "createdAt",
};
const COLLECTION: Record<string, string> = {
  handle: "handle",
  title: "title",
  count: "productsCount { count }",
  created_at: "createdAt",
  updated_at: "updatedAt",
  seo_title: "seo { title }",
};

/** `top`/`nested` are null for bulk operations, or small numbers for a live preview. */
export function buildQuery(cfg: ExportConfig, top: number | null = null, nested: number | null = null): string {
  const filter = searchFilter(cfg);
  const rootArgs = filter ? [`query: ${q(filter)}`] : [];
  const mf = mfSelection(cfg);

  let body: string;
  switch (cfg.resource) {
    case "products": {
      const barcode = cfg.columns.includes("barcode") ? conn("barcodes", [], "value", nested === null ? null : 3) : "";
      const variantBody = [pick(cfg, VARIANT, ["id"]), barcode].filter(Boolean).join(" ");
      body = [pick(cfg, PRODUCT, ["id"]), mf, conn("variants", [], variantBody, nested)].filter(Boolean).join(" ");
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
        `id location { name } quantities(names: ["available", "on_hand", "committed", "incoming"]) { name quantity }`,
        nested,
      );
      body = ["id", "sku", variants, levels].join(" ");
      break;
    }
    case "collections":
      body = [pick(cfg, COLLECTION, ["id"]), mf].filter(Boolean).join(" ");
      break;
  }
  return `{ ${conn(ROOT_FIELD[cfg.resource], rootArgs, body, top)} }`;
}
