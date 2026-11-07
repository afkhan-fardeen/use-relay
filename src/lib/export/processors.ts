// Turns Shopify bulk-operation JSONL lines into export rows.
//
// Bulk output rules (per Shopify docs): every node is its own JSON line; children carry
// `__parentId`; a child always appears AFTER its parent. We never assume children come
// immediately after the parent, so parents are remembered by id.
//
// Two shapes:
//  - streaming: rows are emitted as soon as a line arrives (orders, customers, collections)
//  - deferred: rows need data that can arrive later (product barcodes/collections/media,
//    inventory variant names), so they are emitted in finish() (products, inventory)

import type { ExportConfig } from "../export.ts";
import { metafieldColumns } from "./queries.ts";

export type Row = (string | number)[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Line = Record<string, any>;

export class LimitError extends Error {
  code: "too_many_rows" | "too_large";
  constructor(code: "too_many_rows" | "too_large", message: string) {
    super(message);
    this.code = code;
  }
}

export interface Processor {
  push(line: Line): void;
  finish(): void;
}

export const MAX_DEFERRED = 200_000;

const s = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const lower = (v: unknown): string => s(v).toLowerCase();
const join = (v: unknown, sep = ", "): string => (Array.isArray(v) ? v.join(sep) : s(v));
const bool = (v: unknown): string => (v === null || v === undefined ? "" : v ? "true" : "false");
const money = (v: Line | null | undefined): string => s(v?.shopMoney?.amount);

type Getter = (ctx: Line) => string | number;
type Getters = Record<string, Getter>;

/** Metafield getters: alias mf0/vmf0, ... as built in queries.ts */
function metafieldGetters(cfg: ExportConfig, variant = false): Getters {
  const out: Getters = {};
  for (const { alias, key } of metafieldColumns(cfg, variant)) {
    out[key] = (c) => s((variant ? c.v : c.p)?.[alias]?.value);
  }
  return out;
}

function rowFrom(cfg: ExportConfig, getters: Getters, ctx: Line): Row {
  return cfg.columns.map((k) => (getters[k] ? getters[k](ctx) : ""));
}

// ───────── getters per resource (also used by the completeness test) ─────────
const optionOf = (v: Line, i: number, field: "name" | "value") => s(v.selectedOptions?.[i]?.[field]);

const PRODUCT_GETTERS: Getters = {
  id: (c) => s(c.p.legacyResourceId),
  gid: (c) => s(c.p.id),
  handle: (c) => s(c.p.handle),
  title: (c) => s(c.p.title),
  body_html: (c) => s(c.p.descriptionHtml),
  description: (c) => s(c.p.description),
  vendor: (c) => s(c.p.vendor),
  type: (c) => s(c.p.productType),
  category: (c) => s(c.p.category?.fullName),
  tags: (c) => join(c.p.tags),
  status: (c) => lower(c.p.status),
  created_at: (c) => s(c.p.createdAt),
  updated_at: (c) => s(c.p.updatedAt),
  published_at: (c) => s(c.p.publishedAt),
  template_suffix: (c) => s(c.p.templateSuffix),
  gift_card: (c) => bool(c.p.isGiftCard),
  url: (c) => s(c.p.onlineStoreUrl),
  total_inventory: (c) => s(c.p.totalInventory),
  options: (c) => (Array.isArray(c.p.options) ? c.p.options.map((o: Line) => o.name).join(", ") : ""),
  image: (c) => s(c.p.featuredMedia?.preview?.image?.url),
  seo_title: (c) => s(c.p.seo?.title),
  seo_desc: (c) => s(c.p.seo?.description),
  variant_id: (c) => s(c.v.legacyResourceId),
  variant: (c) => s(c.v.title),
  option1_name: (c) => optionOf(c.v, 0, "name"),
  option1_value: (c) => optionOf(c.v, 0, "value"),
  option2_name: (c) => optionOf(c.v, 1, "name"),
  option2_value: (c) => optionOf(c.v, 1, "value"),
  option3_name: (c) => optionOf(c.v, 2, "name"),
  option3_value: (c) => optionOf(c.v, 2, "value"),
  position: (c) => s(c.v.position),
  sku: (c) => s(c.v.sku),
  barcode: (c) => s(c.barcode),
  price: (c) => s(c.v.price),
  compare_at: (c) => s(c.v.compareAtPrice),
  taxable: (c) => bool(c.v.taxable),
  inventory_policy: (c) => lower(c.v.inventoryPolicy),
  qty: (c) => s(c.v.inventoryQuantity),
  cost: (c) => s(c.v.inventoryItem?.unitCost?.amount),
  weight: (c) => {
    const w = c.v.inventoryItem?.measurement?.weight;
    return w ? `${w.value} ${lower(w.unit)}` : "";
  },
  requires_shipping: (c) => bool(c.v.inventoryItem?.requiresShipping),
  tracked: (c) => bool(c.v.inventoryItem?.tracked),
  hs_code: (c) => s(c.v.inventoryItem?.harmonizedSystemCode),
  origin_country: (c) => s(c.v.inventoryItem?.countryCodeOfOrigin),
  origin_province: (c) => s(c.v.inventoryItem?.provinceCodeOfOrigin),
  images: (c) => join(c.media, " | "),
  collections: (c) => join(c.cols, ", "),
};

const firstTracking = (p: Line) => (p.fulfillments as Line[] | undefined)?.flatMap((f) => f.trackingInfo ?? [])?.[0];
const ORDER_GETTERS: Getters = {
  id: (c) => s(c.p.legacyResourceId),
  order: (c) => s(c.p.name),
  number: (c) => s(c.p.number),
  created_at: (c) => s(c.p.createdAt),
  processed_at: (c) => s(c.p.processedAt),
  updated_at: (c) => s(c.p.updatedAt),
  cancelled_at: (c) => s(c.p.cancelledAt),
  cancel_reason: (c) => lower(c.p.cancelReason),
  financial: (c) => lower(c.p.displayFinancialStatus),
  fulfillment: (c) => lower(c.p.displayFulfillmentStatus),
  tags: (c) => join(c.p.tags),
  note: (c) => s(c.p.note),
  currency: (c) => s(c.p.currencyCode),
  source: (c) => s(c.p.sourceName),
  gateways: (c) => join(c.p.paymentGatewayNames),
  test: (c) => bool(c.p.test),
  email: (c) => s(c.p.email),
  phone: (c) => s(c.p.phone),
  customer_name: (c) => s(c.p.customer?.displayName),
  ship_name: (c) => s(c.p.shippingAddress?.name),
  ship_company: (c) => s(c.p.shippingAddress?.company),
  ship_addr: (c) => s(c.p.shippingAddress?.address1),
  ship_addr2: (c) => s(c.p.shippingAddress?.address2),
  ship_city: (c) => s(c.p.shippingAddress?.city),
  ship_province: (c) => s(c.p.shippingAddress?.provinceCode),
  ship_zip: (c) => s(c.p.shippingAddress?.zip),
  ship_country: (c) => s(c.p.shippingAddress?.countryCodeV2),
  ship_phone: (c) => s(c.p.shippingAddress?.phone),
  bill_name: (c) => s(c.p.billingAddress?.name),
  bill_addr: (c) => s(c.p.billingAddress?.address1),
  bill_city: (c) => s(c.p.billingAddress?.city),
  bill_zip: (c) => s(c.p.billingAddress?.zip),
  bill_country: (c) => s(c.p.billingAddress?.countryCodeV2),
  ship_method: (c) => s(c.p.shippingLine?.title),
  ship_price: (c) => money(c.p.shippingLine?.originalPriceSet),
  tracking_company: (c) => s(firstTracking(c.p)?.company),
  tracking_number: (c) => s(firstTracking(c.p)?.number),
  tracking_url: (c) => s(firstTracking(c.p)?.url),
  discount: (c) => join(c.p.discountCodes),
  subtotal: (c) => money(c.p.subtotalPriceSet),
  shipping_total: (c) => money(c.p.totalShippingPriceSet),
  discounts_total: (c) => money(c.p.totalDiscountsSet),
  tax: (c) => money(c.p.totalTaxSet),
  total: (c) => money(c.p.totalPriceSet),
  refunded: (c) => money(c.p.totalRefundedSet),
  line_id: (c) => s(c.l.id).replace(/^.*\//, ""),
  line_sku: (c) => s(c.l.sku),
  line_title: (c) => s(c.l.title),
  line_variant: (c) => s(c.l.variantTitle),
  line_vendor: (c) => s(c.l.vendor),
  line_qty: (c) => s(c.l.quantity),
  line_price: (c) => money(c.l.originalUnitPriceSet),
  line_discount: (c) => money(c.l.totalDiscountSet),
  line_taxable: (c) => bool(c.l.taxable),
  line_requires_shipping: (c) => bool(c.l.requiresShipping),
  line_product_id: (c) => s(c.l.product?.legacyResourceId),
  line_variant_id: (c) => s(c.l.variant?.legacyResourceId),
};

const CUSTOMER_GETTERS: Getters = {
  id: (c) => s(c.p.legacyResourceId),
  email: (c) => s(c.p.defaultEmailAddress?.emailAddress),
  first: (c) => s(c.p.firstName),
  last: (c) => s(c.p.lastName),
  name: (c) => s(c.p.displayName),
  phone: (c) => s(c.p.defaultPhoneNumber?.phoneNumber),
  state: (c) => lower(c.p.state),
  verified: (c) => bool(c.p.verifiedEmail),
  tax_exempt: (c) => bool(c.p.taxExempt),
  locale: (c) => s(c.p.locale),
  note: (c) => s(c.p.note),
  created_at: (c) => s(c.p.createdAt),
  updated_at: (c) => s(c.p.updatedAt),
  status: (c) => lower(c.p.defaultEmailAddress?.marketingState),
  tags: (c) => join(c.p.tags),
  orders: (c) => s(c.p.numberOfOrders),
  spent: (c) => s(c.p.amountSpent?.amount),
  last_order: (c) => s(c.p.lastOrder?.name),
  company: (c) => s(c.p.defaultAddress?.company),
  address1: (c) => s(c.p.defaultAddress?.address1),
  address2: (c) => s(c.p.defaultAddress?.address2),
  city: (c) => s(c.p.defaultAddress?.city),
  province: (c) => s(c.p.defaultAddress?.provinceCode),
  zip: (c) => s(c.p.defaultAddress?.zip),
  country: (c) => s(c.p.defaultAddress?.countryCodeV2),
  address_phone: (c) => s(c.p.defaultAddress?.phone),
};

const qty = (l: Line, name: string): number => {
  const found = (l.quantities as { name: string; quantity: number }[] | undefined)?.find((x) => x.name === name);
  return found?.quantity ?? 0;
};
const INVENTORY_GETTERS: Getters = {
  item_id: (c) => s(c.i.legacyResourceId),
  sku: (c) => s(c.i.sku),
  title: (c) => s(c.v?.product?.title),
  variant: (c) => s(c.v?.title),
  tracked: (c) => bool(c.i.tracked),
  requires_shipping: (c) => bool(c.i.requiresShipping),
  cost: (c) => s(c.i.unitCost?.amount),
  hs_code: (c) => s(c.i.harmonizedSystemCode),
  origin_country: (c) => s(c.i.countryCodeOfOrigin),
  location: (c) => s(c.l.location?.name),
  available: (c) => qty(c.l, "available"),
  on_hand: (c) => qty(c.l, "on_hand"),
  committed: (c) => qty(c.l, "committed"),
  incoming: (c) => qty(c.l, "incoming"),
  reserved: (c) => qty(c.l, "reserved"),
  damaged: (c) => qty(c.l, "damaged"),
  quality_control: (c) => qty(c.l, "quality_control"),
  safety_stock: (c) => qty(c.l, "safety_stock"),
  level_updated: (c) => s(c.l.updatedAt),
};

const COLLECTION_GETTERS: Getters = {
  id: (c) => s(c.p.legacyResourceId),
  handle: (c) => s(c.p.handle),
  title: (c) => s(c.p.title),
  description: (c) => s(c.p.description),
  description_html: (c) => s(c.p.descriptionHtml),
  count: (c) => s(c.p.productsCount?.count),
  sort_order: (c) => lower(c.p.sortOrder),
  template_suffix: (c) => s(c.p.templateSuffix),
  image: (c) => s(c.p.image?.url),
  created_at: (c) => s(c.p.createdAt),
  updated_at: (c) => s(c.p.updatedAt),
  seo_title: (c) => s(c.p.seo?.title),
  seo_desc: (c) => s(c.p.seo?.description),
};

/** Column keys each resource can produce (for the completeness test). */
export const GETTER_KEYS: Record<string, string[]> = {
  products: Object.keys(PRODUCT_GETTERS),
  orders: Object.keys(ORDER_GETTERS),
  customers: Object.keys(CUSTOMER_GETTERS),
  inventory: Object.keys(INVENTORY_GETTERS),
  collections: Object.keys(COLLECTION_GETTERS),
};

// ───────── products: one row per variant ─────────
function products(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const prods = new Map<string, Line>();
  const variants: { id: string; parent: string; v: Line; barcode?: string }[] = [];
  const byId = new Map<string, (typeof variants)[number]>();
  const cols = new Map<string, string[]>();
  const media = new Map<string, string[]>();
  const g: Getters = { ...PRODUCT_GETTERS, ...metafieldGetters(cfg), ...metafieldGetters(cfg, true) };
  const push = <T,>(m: Map<string, T[]>, k: string, v: T) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  return {
    push(line) {
      const id = s(line.id);
      if (id.includes("/ProductVariant/")) {
        if (variants.length >= MAX_DEFERRED) throw new LimitError("too_many_rows", "This export is too large. Narrow it with filters.");
        const rec = { id, parent: s(line.__parentId), v: line };
        variants.push(rec);
        byId.set(id, rec);
      } else if (id.includes("/Collection/") && line.__parentId) {
        push(cols, s(line.__parentId), s(line.handle));
      } else if (id.includes("/Product/")) {
        prods.set(id, line);
      } else if (line.__parentId && "value" in line && !id) {
        const rec = byId.get(s(line.__parentId));
        if (rec && rec.barcode === undefined) rec.barcode = s(line.value); // first barcode only
      } else if (line.__parentId && "preview" in line) {
        const url = s(line.preview?.image?.url);
        if (url) push(media, s(line.__parentId), url);
      }
    },
    finish() {
      for (const rec of variants) {
        const p = prods.get(rec.parent);
        if (!p) continue;
        emit(rowFrom(cfg, g, { p, v: rec.v, barcode: rec.barcode ?? "", cols: cols.get(rec.parent) ?? [], media: media.get(rec.parent) ?? [] }));
      }
    },
  };
}

// ───────── orders: one row per line item ─────────
function orders(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const parents = new Map<string, Line>();
  const g: Getters = { ...ORDER_GETTERS, ...metafieldGetters(cfg) };
  return {
    push(line) {
      const id = s(line.id);
      if (id.includes("/LineItem/")) {
        const p = parents.get(s(line.__parentId));
        if (p) emit(rowFrom(cfg, g, { p, l: line }));
      } else if (id.includes("/Order/")) {
        if (parents.size >= MAX_DEFERRED) throw new LimitError("too_many_rows", "This export is too large. Narrow it with filters.");
        parents.set(id, line);
      }
    },
    finish() {},
  };
}

// ───────── customers: one row per customer ─────────
function customers(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const g: Getters = { ...CUSTOMER_GETTERS, ...metafieldGetters(cfg) };
  return {
    push(line) {
      if (!s(line.id).includes("/Customer/")) return;
      // These filters are applied here because Shopify's search syntax for them is unreliable.
      if (cfg.status && lower(line.defaultEmailAddress?.marketingState) !== cfg.status) return;
      const day = s(line.createdAt).slice(0, 10);
      if (cfg.dateFrom && day < cfg.dateFrom) return;
      if (cfg.dateTo && day > cfg.dateTo) return;
      emit(rowFrom(cfg, g, { p: line }));
    },
    finish() {},
  };
}

// ───────── inventory: one row per item per location ─────────
function inventory(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const items = new Map<string, Line>();
  const variantOf = new Map<string, Line>();
  const levels: { parent: string; l: Line }[] = [];
  const bucket = (n: number) => (n <= 0 ? "out_of_stock" : n < 10 ? "low_stock" : "in_stock");
  return {
    push(line) {
      const id = s(line.id);
      if (id.includes("/InventoryLevel/")) {
        if (levels.length >= MAX_DEFERRED) throw new LimitError("too_many_rows", "This export is too large. Narrow it with filters.");
        levels.push({ parent: s(line.__parentId), l: line });
      } else if (id.includes("/ProductVariant/")) {
        if (!variantOf.has(s(line.__parentId))) variantOf.set(s(line.__parentId), line); // first variant of the item
      } else if (id.includes("/InventoryItem/")) {
        items.set(id, line);
      }
    },
    finish() {
      for (const { parent, l } of levels) {
        const i = items.get(parent);
        if (!i) continue;
        if (cfg.status && bucket(qty(l, "available")) !== cfg.status) continue;
        emit(rowFrom(cfg, INVENTORY_GETTERS, { i, v: variantOf.get(parent), l }));
      }
    },
  };
}

// ───────── collections ─────────
function collections(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const g: Getters = { ...COLLECTION_GETTERS, ...metafieldGetters(cfg) };
  return {
    push(line) {
      if (s(line.id).includes("/Collection/")) emit(rowFrom(cfg, g, { p: line }));
    },
    finish() {},
  };
}

export function createProcessor(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  switch (cfg.resource) {
    case "products": return products(cfg, emit);
    case "orders": return orders(cfg, emit);
    case "customers": return customers(cfg, emit);
    case "inventory": return inventory(cfg, emit);
    case "collections": return collections(cfg, emit);
  }
}

/** Flattens an ordinary nested GraphQL response into bulk-style JSONL lines (for the live preview). */
export function* toBulkLines(edges: { node: Line }[], parentId?: string): Generator<Line> {
  for (const { node } of edges) {
    const copy: Line = {};
    const children: { node: Line }[][] = [];
    for (const [k, v] of Object.entries(node)) {
      if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray((v as Line).edges)) children.push((v as Line).edges);
      else copy[k] = v;
    }
    if (parentId) copy.__parentId = parentId;
    yield copy;
    for (const c of children) yield* toBulkLines(c, s(node.id));
  }
}
