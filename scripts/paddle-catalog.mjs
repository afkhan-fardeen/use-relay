// Creates Klyroo's Paddle catalog: one product per paid plan, one monthly GBP price with a 3-day trial.
//   PADDLE_API_KEY=pdl_sdbx_... npm run paddle:catalog            (sandbox, the default)
//   PADDLE_ENV=live PADDLE_API_KEY=pdl_live_... npm run paddle:catalog
// Safe to re-run: products are matched by custom_data.plan_key and prices by product, so nothing is duplicated.
// Amounts are in the lowest denomination, as strings (GBP 19.00 = "1900").
import { PLANS, paidPlans } from "../src/lib/billing/plans.ts";

const env = process.env.PADDLE_ENV || "sandbox";
if (!["sandbox", "live"].includes(env)) throw new Error('PADDLE_ENV must be "sandbox" or "live"');
const key = process.env.PADDLE_API_KEY;
if (!key) throw new Error("Set PADDLE_API_KEY (Paddle > Developer tools > Authentication > API keys)");
if (env === "sandbox" && !key.startsWith("pdl_sdbx_")) throw new Error("A sandbox run needs a pdl_sdbx_ key");
if (env === "live" && !key.startsWith("pdl_live_")) throw new Error("A live run needs a pdl_live_ key");
const base = env === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
const TRIAL_DAYS = 3;

async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j.error ?? j)}`);
  return j;
}

const existing = (await api("GET", "/products?per_page=200&status=active")).data;
const rows = [];
for (const app of ["export", "qr"]) {
  for (const plan of paidPlans(app)) {
    const planKey = `${app}_${plan.key}`;
    const appName = app === "export" ? "Klyroo Export" : "Klyroo QR";
    let product = existing.find((p) => p.custom_data?.plan_key === planKey);
    if (!product) {
      product = (await api("POST", "/products", {
        name: `${appName} ${plan.name}`,
        description: `${appName} ${plan.name} plan, billed monthly.`,
        tax_category: "standard",
        custom_data: { plan_key: planKey, app, plan: plan.key },
      })).data;
    }
    const prices = (await api("GET", `/prices?product_id=${product.id}&status=active`)).data;
    let price = prices.find((p) => p.billing_cycle?.interval === "month" && p.unit_price.currency_code === "GBP");
    if (!price) {
      const pounds = Number(plan.priceLabel.replace(/[^0-9.]/g, ""));
      price = (await api("POST", "/prices", {
        product_id: product.id,
        description: `${appName} ${plan.name} monthly`,
        unit_price: { amount: String(Math.round(pounds * 100)), currency_code: "GBP" },
        billing_cycle: { interval: "month", frequency: 1 },
        trial_period: { interval: "day", frequency: TRIAL_DAYS },
        quantity: { minimum: 1, maximum: 1 },
        custom_data: { plan_key: planKey },
      })).data;
    }
    rows.push({ planKey, name: `${appName} ${plan.name}`, product: product.id, price: price.id, amount: price.unit_price.amount, trial: price.trial_period ? `${price.trial_period.frequency} ${price.trial_period.interval}s` : "none", env: `PADDLE_PRICE_${app.toUpperCase()}_${plan.key.toUpperCase()}=${price.id}` });
  }
}
console.log(`\nPaddle ${env} catalog\n`);
console.table(rows.map(({ env: _e, ...r }) => r));
console.log("\nAdd these to web/.env.local and to Render:\n");
for (const r of rows) console.log(r.env);
void PLANS;
