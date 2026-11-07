// Plans per app. Shared by the UI and the server. No secrets, no Node-only imports.
// Prices are NOT stored here: the Paddle catalog is the source of truth (in GBP) and the UI
// reads live prices from Paddle by price ID. Each app has its own plans and its own billing.
//
// Features marked `soon` are on the roadmap and are shown honestly as "Soon"; limits only
// cover what is built today.

import type { AppSlug } from "../apps.ts";

export type Limits = Record<string, number>;
export type Feature = { text: string; soon?: boolean };
export type PlanInfo = {
  key: string;
  name: string;
  blurb: string;
  features: Feature[];
  limits: Limits;
  recommended?: boolean;
  /** Price in the Paddle catalog is the real one; this is a label for the landing page only. */
  priceLabel: string;
};

// ───────── Klyroo Export ─────────
// Limits: maxStores, maxRows (per export), exportsPerHour.
export const EXPORT_PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Evaluate it on a small store.",
    priceLabel: "£0",
    features: [{ text: "1 store" }, { text: "Up to 1,000 rows per export" }, { text: "5 exports an hour" }, { text: "All templates and columns" }],
    limits: { maxStores: 1, maxRows: 1_000, exportsPerHour: 5 },
  },
  {
    key: "starter",
    name: "Starter",
    blurb: "Single-store manual exports.",
    priceLabel: "£19",
    features: [
      { text: "1 store" },
      { text: "Up to 50,000 rows per export" },
      { text: "Manual CSV downloads" },
      { text: "Weekly scheduled export", soon: true },
      { text: "Google Sheets delivery", soon: true },
      { text: "Standard email support" },
    ],
    limits: { maxStores: 1, maxRows: 50_000, exportsPerHour: 20 },
  },
  {
    key: "growth",
    name: "Growth",
    blurb: "Multi-store, with metafields and daily automation.",
    priceLabel: "£49",
    recommended: true,
    features: [
      { text: "3 stores" },
      { text: "Up to 250,000 rows per export" },
      { text: "Product and variant metafield columns" },
      { text: "Daily automated exports", soon: true },
      { text: "Google Sheets, SFTP and email delivery", soon: true },
      { text: "Priority email support" },
    ],
    limits: { maxStores: 3, maxRows: 250_000, exportsPerHour: 30 },
  },
  {
    key: "scale",
    name: "Scale",
    blurb: "Hourly sync and developer destinations.",
    priceLabel: "£99",
    features: [
      { text: "Up to 5 stores" },
      { text: "Up to 250,000 rows per export" },
      { text: "Product and variant metafield columns" },
      { text: "Hourly and webhook-triggered exports", soon: true },
      { text: "S3 / R2, webhooks and custom feed URLs", soon: true },
      { text: "Direct chat support channel" },
    ],
    limits: { maxStores: 5, maxRows: 250_000, exportsPerHour: 60 },
  },
];

// ───────── Klyroo QR (preview: nothing to buy yet) ─────────
export const QR_PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Free while QR is in preview.",
    priceLabel: "£0",
    features: [{ text: "Try the designer" }, { text: "Saving and downloads", soon: true }],
    limits: {},
  },
  {
    key: "plus",
    name: "Plus",
    blurb: "Save, download and add your logo.",
    priceLabel: "TBC",
    features: [{ text: "Saved codes", soon: true }, { text: "PNG and SVG downloads", soon: true }, { text: "Your logo", soon: true }],
    limits: {},
  },
];

export const PLANS: Record<AppSlug, PlanInfo[]> = { export: EXPORT_PLANS, qr: QR_PLANS };

/** Plans that can be bought for an app (everything except "free"). */
export const paidPlans = (app: AppSlug): string[] => PLANS[app].filter((p) => p.key !== "free").map((p) => p.key);

export const planInfo = (app: AppSlug, key: string): PlanInfo => PLANS[app].find((p) => p.key === key) ?? PLANS[app][0];

/** Used while an app's billing is switched off (the beta): everyone gets generous limits. */
export const BETA_LIMITS: Record<AppSlug, Limits> = {
  export: { maxStores: 5, maxRows: 250_000, exportsPerHour: 30 },
  qr: {},
};
