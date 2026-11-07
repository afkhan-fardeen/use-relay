// Plan definitions shared by the UI and the server. No secrets, no Node-only imports.
// Prices are NOT stored here: the Paddle catalog is the source of truth (in GBP) and the UI
// reads live prices from Paddle by price ID.
//
// Features marked `soon` are on the roadmap and are shown honestly as "Soon"; limits only
// cover what is built today.

export type PlanKey = "free" | "starter" | "growth" | "scale";
export type PaidPlan = Exclude<PlanKey, "free">;

export type Limits = {
  maxStores: number;
  maxRows: number; // rows per export
  exportsPerHour: number;
};

export type Feature = { text: string; soon?: boolean };
export type PlanInfo = { key: PlanKey; name: string; blurb: string; features: Feature[]; limits: Limits };

export const PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Try it on a small store.",
    features: [{ text: "1 store" }, { text: "Up to 1,000 rows per export" }, { text: "5 exports an hour" }, { text: "All templates and columns" }],
    limits: { maxStores: 1, maxRows: 1_000, exportsPerHour: 5 },
  },
  {
    key: "starter",
    name: "Starter",
    blurb: "For one growing store.",
    features: [
      { text: "1 store" },
      { text: "Up to 50,000 rows per export" },
      { text: "Manual CSV downloads" },
      { text: "Standard product and variant columns" },
      { text: "Weekly scheduled export", soon: true },
      { text: "Google Sheets delivery", soon: true },
      { text: "Standard email support" },
    ],
    limits: { maxStores: 1, maxRows: 50_000, exportsPerHour: 20 },
  },
  {
    key: "growth",
    name: "Growth",
    blurb: "For busy stores that run on automation.",
    features: [
      { text: "2 stores" },
      { text: "Up to 250,000 rows per export" },
      { text: "All columns plus product and variant metafields" },
      { text: "Daily automated exports", soon: true },
      { text: "Google Sheets, SFTP and email delivery", soon: true },
      { text: "Priority email support" },
    ],
    limits: { maxStores: 2, maxRows: 250_000, exportsPerHour: 30 },
  },
  {
    key: "scale",
    name: "Scale",
    blurb: "For agencies and multi-store brands.",
    features: [
      { text: "Up to 5 stores" },
      { text: "Up to 250,000 rows per export" },
      { text: "All columns plus product and variant metafields" },
      { text: "Hourly and webhook-triggered exports", soon: true },
      { text: "S3 / R2, webhooks and custom feed URLs", soon: true },
      { text: "Custom column formulas and regional pricing", soon: true },
      { text: "Direct chat support channel" },
    ],
    limits: { maxStores: 5, maxRows: 250_000, exportsPerHour: 60 },
  },
];

export const planInfo = (key: PlanKey): PlanInfo => PLANS.find((p) => p.key === key)!;

/** Used while billing is switched off (the beta): everyone gets generous limits. */
export const BETA_LIMITS: Limits = { maxStores: 5, maxRows: 250_000, exportsPerHour: 30 };

export const PAID_PLANS: PaidPlan[] = ["starter", "growth", "scale"];
