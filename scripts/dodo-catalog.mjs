// Creates Klyroo's Dodo Payments catalog: one subscription product per paid plan,
// monthly in GBP, with a 3-day free trial. Safe to re-run (products are matched by metadata.plan_key).
//   npm run dodo:catalog                      (test mode, from .env.local)
//   DODO_PAYMENTS_ENVIRONMENT=live_mode DODO_PAYMENTS_API_KEY=... node scripts/dodo-catalog.mjs
// Amounts are integers in the smallest unit: GBP 19.00 = 1900.
import { paidPlans, planInfo } from "../src/lib/billing/plans.ts";

const mode = process.env.DODO_PAYMENTS_ENVIRONMENT || "";
if (!["test_mode", "live_mode"].includes(mode)) throw new Error('Set DODO_PAYMENTS_ENVIRONMENT to "test_mode" or "live_mode"');
const key = process.env.DODO_PAYMENTS_API_KEY;
if (!key) throw new Error("Set DODO_PAYMENTS_API_KEY");
const base = mode === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
const TRIAL_DAYS = 3;

async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
}

const existing = (await api("GET", "/products?page_size=100")).items ?? [];
const rows = [];
for (const app of ["export", "qr"]) {
  for (const plan of paidPlans(app)) {
    const planKey = `${app}_${plan}`;
    const info = planInfo(app, plan);
    const appName = app === "export" ? "Klyroo Export" : "Klyroo QR";
    let p = existing.find((x) => x.metadata?.plan_key === planKey);
    const created = !p;
    if (!p) {
      const pounds = Number(info.priceLabel.replace(/[^0-9.]/g, ""));
      p = await api("POST", "/products", {
        name: `${appName} ${info.name}`,
        description: `${appName} ${info.name} plan, billed monthly.`,
        tax_category: "saas",
        price: {
          type: "recurring_price",
          currency: "GBP",
          price: Math.round(pounds * 100),
          tax_inclusive: false,
          payment_frequency_count: 1,
          payment_frequency_interval: "Month",
          subscription_period_count: 20,
          subscription_period_interval: "Year",
          trial_period_days: TRIAL_DAYS,
        },
        metadata: { plan_key: planKey, app, plan },
      });
    }
    rows.push({ plan: `${appName} ${info.name}`, product_id: p.product_id, price: `${p.price?.currency} ${p.price?.price}`, trial_days: p.price?.trial_period_days, created, env: `DODO_PRODUCT_${app.toUpperCase()}_${plan.toUpperCase()}=${p.product_id}` });
  }
}
console.log(`\nDodo Payments ${mode} catalog\n`);
console.table(rows.map((r) => ({ plan: r.plan, product_id: r.product_id, price: r.price, trial_days: r.trial_days, created: r.created })));
console.log("\nAdd to web/.env.local and Render:\n");
for (const r of rows) console.log(r.env);
