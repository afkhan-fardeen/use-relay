// Plans per app. Shared by the UI and the server. No secrets, no Node-only imports.
// Prices are NOT stored here: the Dodo Payments catalog is the source of truth (in GBP) and the UI
// shows the marketing label; checkout shows the exact price. Each app has its own plans and its own billing.
//
// Klyroo Export plans differ ONLY by number of stores and rows per export.
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

export const PLANS: Record<AppSlug, PlanInfo[]> = { export: EXPORT_PLANS };

/** Plans that can be bought for an app (everything except "free"). */
export const paidPlans = (app: AppSlug): string[] => PLANS[app].filter((p) => p.key !== "free").map((p) => p.key);

export const planInfo = (app: AppSlug, key: string): PlanInfo => PLANS[app].find((p) => p.key === key) ?? PLANS[app][0];

/** Used while an app's billing is switched off: everyone gets generous limits. */
export const BETA_LIMITS: Record<AppSlug, Limits> = {
  export: { maxStores: 5, maxRows: 250_000, exportsPerHour: 30 },
};
