// Plan definitions shared by the UI and the server. No secrets, no Node-only imports.
// Prices are NOT stored here: the Paddle catalog is the source of truth and the UI reads
// live prices from Paddle by price ID.

export type PlanKey = "free" | "starter" | "pro" | "agency";
export type PaidPlan = Exclude<PlanKey, "free">;

export type Limits = {
  maxStores: number;
  maxRows: number; // rows per export
  exportsPerHour: number;
};

export type PlanInfo = { key: PlanKey; name: string; blurb: string; features: string[]; limits: Limits };

export const PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Try it on a small store.",
    features: ["1 store", "Up to 1,000 rows per export", "5 exports an hour", "All templates"],
    limits: { maxStores: 1, maxRows: 1_000, exportsPerHour: 5 },
  },
  {
    key: "starter",
    name: "Starter",
    blurb: "For one growing store.",
    features: ["1 store", "Up to 50,000 rows per export", "20 exports an hour", "All templates"],
    limits: { maxStores: 1, maxRows: 50_000, exportsPerHour: 20 },
  },
  {
    key: "pro",
    name: "Pro",
    blurb: "For busy stores and teams.",
    features: ["3 stores", "Up to 250,000 rows per export", "30 exports an hour", "Custom metafield columns"],
    limits: { maxStores: 3, maxRows: 250_000, exportsPerHour: 30 },
  },
  {
    key: "agency",
    name: "Agency",
    blurb: "For agencies managing many stores.",
    features: ["25 stores", "Up to 250,000 rows per export", "60 exports an hour", "Priority support"],
    limits: { maxStores: 25, maxRows: 250_000, exportsPerHour: 60 },
  },
];

export const planInfo = (key: PlanKey): PlanInfo => PLANS.find((p) => p.key === key)!;

/** Used while billing is switched off (the beta): everyone gets generous limits. */
export const BETA_LIMITS: Limits = { maxStores: 25, maxRows: 250_000, exportsPerHour: 30 };

export const PAID_PLANS: PaidPlan[] = ["starter", "pro", "agency"];
