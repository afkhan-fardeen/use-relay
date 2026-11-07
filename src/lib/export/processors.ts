// Turns Shopify bulk-operation JSONL lines into export rows.
//
// Bulk output rules (per Shopify docs): every node is its own JSON line; children carry
// `__parentId`; a child always appears AFTER its parent. We never assume children come
// immediately after the parent, so parents are remembered by id.
//
// Two shapes:
//  - streaming: rows are emitted as soon as a line arrives (orders, customers, collections)
//  - deferred: rows need data that can arrive later (product barcodes, inventory variant
//    names), so they are emitted in finish() (products, inventory)

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
const join = (v: unknown): string => (Array.isArray(v) ? v.join(", ") : s(v));
const money = (v: Line | null | undefined): string => s(v?.shopMoney?.amount);

type Getter = (ctx: Line) => string | number;

/** Metafield getters: alias mf0, mf1, ... as built in queries.ts */
function metafieldGetters(cfg: ExportConfig): Record<string, Getter> {
  const out: Record<string, Getter> = {};
  for (const { alias, key } of metafieldColumns(cfg)) out[key] = (c) => s(c.p?.[alias]?.value);
  return out;
}

function rowFrom(cfg: ExportConfig, getters: Record<string, Getter>, ctx: Line): Row {
  return cfg.columns.map((k) => (getters[k] ? getters[k](ctx) : ""));
}

// ───────── products: one row per variant ─────────
function products(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const prods = new Map<string, Line>();
  const variants: { id: string; parent: string; v: Line; barcode?: string }[] = [];
  const byId = new Map<string, (typeof variants)[number]>();
  const g: Record<string, Getter> = {
    handle: (c) => s(c.p.handle),
    title: (c) => s(c.p.title),
    vendor: (c) => s(c.p.vendor),
    type: (c) => s(c.p.productType),
    status: (c) => lower(c.p.status),
    tags: (c) => join(c.p.tags),
    created_at: (c) => s(c.p.createdAt),
    image: (c) => s(c.p.featuredMedia?.preview?.image?.url),
    seo_title: (c) => s(c.p.seo?.title),
    seo_desc: (c) => s(c.p.seo?.description),
    sku: (c) => s(c.v.sku),
    variant: (c) => s(c.v.title),
    price: (c) => s(c.v.price),
    compare_at: (c) => s(c.v.compareAtPrice),
    qty: (c) => s(c.v.inventoryQuantity),
    cost: (c) => s(c.v.inventoryItem?.unitCost?.amount),
    weight: (c) => {
      const w = c.v.inventoryItem?.measurement?.weight;
      return w ? `${w.value} ${lower(w.unit)}` : "";
    },
    barcode: (c) => s(c.barcode),
    ...metafieldGetters(cfg),
  };
  return {
    push(line) {
      const id = s(line.id);
      if (id.includes("/ProductVariant/")) {
        if (variants.length >= MAX_DEFERRED) throw new LimitError("too_many_rows", "This export is too large. Narrow it with filters.");
        const rec = { id, parent: s(line.__parentId), v: line };
        variants.push(rec);
        byId.set(id, rec);
      } else if (id.includes("/Product/")) {
        prods.set(id, line);
      } else if (line.__parentId && "value" in line) {
        const rec = byId.get(s(line.__parentId));
        if (rec && rec.barcode === undefined) rec.barcode = s(line.value); // first barcode only
      }
    },
    finish() {
      for (const rec of variants) {
        const p = prods.get(rec.parent);
        if (!p) continue;
        emit(rowFrom(cfg, g, { p, v: rec.v, barcode: rec.barcode ?? "" }));
      }
    },
  };
}

// ───────── orders: one row per line item ─────────
function orders(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const parents = new Map<string, Line>();
  const g: Record<string, Getter> = {
    order: (c) => s(c.p.name),
    created_at: (c) => s(c.p.createdAt),
    financial: (c) => lower(c.p.displayFinancialStatus),
    fulfillment: (c) => lower(c.p.displayFulfillmentStatus),
    tags: (c) => join(c.p.tags),
    note: (c) => s(c.p.note),
    email: (c) => s(c.p.email),
    ship_name: (c) => s(c.p.shippingAddress?.name),
    ship_addr: (c) => s(c.p.shippingAddress?.address1),
    ship_city: (c) => s(c.p.shippingAddress?.city),
    ship_country: (c) => s(c.p.shippingAddress?.countryCodeV2),
    ship_method: (c) => s(c.p.shippingLine?.title),
    discount: (c) => join(c.p.discountCodes),
    subtotal: (c) => money(c.p.subtotalPriceSet),
    tax: (c) => money(c.p.totalTaxSet),
    total: (c) => money(c.p.totalPriceSet),
    line_sku: (c) => s(c.l.sku),
    line_title: (c) => s(c.l.title),
    line_qty: (c) => s(c.l.quantity),
    line_price: (c) => money(c.l.originalUnitPriceSet),
    ...metafieldGetters(cfg),
  };
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
  const g: Record<string, Getter> = {
    email: (c) => s(c.p.defaultEmailAddress?.emailAddress),
    first: (c) => s(c.p.firstName),
    last: (c) => s(c.p.lastName),
    phone: (c) => s(c.p.defaultPhoneNumber?.phoneNumber),
    status: (c) => lower(c.p.defaultEmailAddress?.marketingState),
    tags: (c) => join(c.p.tags),
    orders: (c) => s(c.p.numberOfOrders),
    spent: (c) => s(c.p.amountSpent?.amount),
    city: (c) => s(c.p.defaultAddress?.city),
    country: (c) => s(c.p.defaultAddress?.countryCodeV2),
    created_at: (c) => s(c.p.createdAt),
    ...metafieldGetters(cfg),
  };
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
  const qty = (l: Line, name: string): number => {
    const found = (l.quantities as { name: string; quantity: number }[] | undefined)?.find((x) => x.name === name);
    return found?.quantity ?? 0;
  };
  const g: Record<string, Getter> = {
    sku: (c) => s(c.i.sku),
    title: (c) => s(c.v?.product?.title),
    variant: (c) => s(c.v?.title),
    location: (c) => s(c.l.location?.name),
    available: (c) => qty(c.l, "available"),
    on_hand: (c) => qty(c.l, "on_hand"),
    committed: (c) => qty(c.l, "committed"),
    incoming: (c) => qty(c.l, "incoming"),
  };
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
        emit(rowFrom(cfg, g, { i, v: variantOf.get(parent), l }));
      }
    },
  };
}

// ───────── collections ─────────
function collections(cfg: ExportConfig, emit: (r: Row) => void): Processor {
  const g: Record<string, Getter> = {
    handle: (c) => s(c.p.handle),
    title: (c) => s(c.p.title),
    count: (c) => s(c.p.productsCount?.count),
    created_at: (c) => s(c.p.createdAt),
    updated_at: (c) => s(c.p.updatedAt),
    seo_title: (c) => s(c.p.seo?.title),
    ...metafieldGetters(cfg),
  };
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
