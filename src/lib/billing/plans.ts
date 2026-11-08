// Plans per app. Shared by the UI and the server. No secrets, no Node-only imports.
// Prices are NOT stored here: the Dodo Payments catalog is the source of truth (in GBP) and the UI
// shows the marketing label; checkout shows the exact price. Each app has its own plans and its own billing.
//
// Klyroo Export plans differ ONLY by number of stores and rows per export.
// Klyroo QR plans differ by dynamic links and scans per month.
// Everything listed here is built and working.

import type { AppSlug } from "../apps.ts";

export type Limits = Record<string, number>;
export type Feature = { text: string };
export type PlanInfo = {
  key: string;
  name: string;
  blurb: string;
  features: Feature[];
  limits: Limits;
  recommended?: boolean;
  /** The real price is in the Dodo Payments catalog; this label is for the marketing pages. */
  priceLabel: string;
};

/** Included in every plan of the app, shown once under the plan cards. */
export const PLAN_COMMON: Record<AppSlug, string> = {
  export: "Every plan includes all templates and columns, metafields, live preview, history and CSV downloads.",
  qr: "Every plan includes all code types, custom colours and styles, your logo, and PNG and SVG downloads.",
};

// ───────── Klyroo Export ─────────
// Limits: maxStores, maxRows (per export), exportsPerHour (a safety limit, the same on every plan).
export const EXPORT_PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Try it on a small store.",
    priceLabel: "£0",
    features: [{ text: "1 store" }, { text: "Up to 1,000 rows per export" }],
    limits: { maxStores: 1, maxRows: 1_000, exportsPerHour: 30 },
  },
  {
    key: "starter",
    name: "Starter",
    blurb: "One store, bigger exports.",
    priceLabel: "£19",
    features: [{ text: "1 store" }, { text: "Up to 50,000 rows per export" }],
    limits: { maxStores: 1, maxRows: 50_000, exportsPerHour: 30 },
  },
  {
    key: "growth",
    name: "Growth",
    blurb: "Several stores, big exports.",
    priceLabel: "£49",
    recommended: true,
    features: [{ text: "3 stores" }, { text: "Up to 250,000 rows per export" }],
    limits: { maxStores: 3, maxRows: 250_000, exportsPerHour: 30 },
  },
  {
    key: "scale",
    name: "Scale",
    blurb: "More stores for agencies and brands.",
    priceLabel: "£99",
    features: [{ text: "Up to 5 stores" }, { text: "Up to 250,000 rows per export" }],
    limits: { maxStores: 5, maxRows: 250_000, exportsPerHour: 30 },
  },
];

// ───────── Klyroo QR ─────────
// Limits: maxDynamic (active dynamic links), scansPerMonth, customSlug (1 = can choose short link names).
// Going over the scan limit never switches a printed code off: it keeps redirecting and the owner is asked to upgrade.
export const QR_PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "One-off prints, contact cards, Wi-Fi stickers.",
    priceLabel: "£0",
    features: [{ text: "Unlimited static QR codes" }, { text: "No dynamic links" }],
    limits: { maxDynamic: 0, scansPerMonth: 0, customSlug: 0 },
  },
  {
    key: "pro",
    name: "Pro",
    blurb: "Store links, packaging and event flyers.",
    priceLabel: "£20",
    recommended: true,
    features: [
      { text: "Up to 25 dynamic links" },
      { text: "20,000 scans a month" },
      { text: "Change a link's destination any time" },
      { text: "Scan analytics" },
      { text: "Custom short link names" },
    ],
    limits: { maxDynamic: 25, scansPerMonth: 20_000, customSlug: 1 },
  },
  {
    key: "business",
    name: "Business",
    blurb: "High-volume campaigns.",
    priceLabel: "£45",
    features: [
      { text: "Unlimited dynamic links" },
      { text: "100,000 scans a month" },
      { text: "Change a link's destination any time" },
      { text: "Scan analytics" },
      { text: "Custom short link names" },
    ],
    limits: { maxDynamic: 1_000_000, scansPerMonth: 100_000, customSlug: 1 },
  },
];

export const PLANS: Record<AppSlug, PlanInfo[]> = { export: EXPORT_PLANS, qr: QR_PLANS };

/** Plans that can be bought for an app (everything except "free"). */
export const paidPlans = (app: AppSlug): string[] => PLANS[app].filter((p) => p.key !== "free").map((p) => p.key);

export const planInfo = (app: AppSlug, key: string): PlanInfo => PLANS[app].find((p) => p.key === key) ?? PLANS[app][0];

/** Used while an app's billing is switched off: everyone gets generous limits. */
export const BETA_LIMITS: Record<AppSlug, Limits> = {
  export: { maxStores: 5, maxRows: 250_000, exportsPerHour: 30 },
  qr: { maxDynamic: 25, scansPerMonth: 20_000, customSlug: 1 },
};
