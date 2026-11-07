// Checks that the environment is complete and consistent before deploying.
//   npm run check:env                      (reads .env.local)
//   node scripts/check-env.mjs --production   (also demands live billing settings)
const prod = process.argv.includes("--production");
const need = (names, why) => names.filter((n) => !process.env[n]).map((n) => `${n} (${why})`);
const problems = [
  ...need(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"], "database and sign-in"),
  ...need(["MASTER_KEY"], "encrypts Shopify secrets and signs checkout tokens"),
  ...need(["TICK_SECRET"], "protects the scheduled /api/tick"),
];
if (process.env.MASTER_KEY && Buffer.from(process.env.MASTER_KEY, "base64").length !== 32) problems.push("MASTER_KEY must be 32 random bytes, base64 encoded");
if (process.env.TICK_SECRET && process.env.TICK_SECRET.length < 24) problems.push("TICK_SECRET is too short (use 24+ characters)");
const mode = process.env.DODO_PAYMENTS_ENVIRONMENT;
const dodoKeys = ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY"];
if (mode && !["test_mode", "live_mode"].includes(mode)) problems.push('DODO_PAYMENTS_ENVIRONMENT must be "test_mode" or "live_mode"');
if (mode || dodoKeys.some((k) => process.env[k])) {
  problems.push(...need([...dodoKeys, "DODO_PAYMENTS_ENVIRONMENT"], "billing"));
  const missing = ["EXPORT_STARTER", "EXPORT_GROWTH", "EXPORT_SCALE", "QR_PRO", "QR_BUSINESS"].filter((k) => !process.env[`DODO_PRODUCT_${k}`]);
  if (missing.length) problems.push(`DODO_PRODUCT_${missing.join(", DODO_PRODUCT_")} (a plan with no product can't be bought)`);
  if (mode === "test_mode" && process.env.DODO_PAYMENTS_API_KEY && !process.env.DODO_PAYMENTS_API_KEY.startsWith("dodo_test_")) problems.push("test_mode with a non-test API key");
}
if (prod) {
  problems.push(...need(["NEXT_PUBLIC_SITE_URL"], "short links and the checkout return address"));
  if (mode !== "live_mode") problems.push("production should use DODO_PAYMENTS_ENVIRONMENT=live_mode once Dodo verification is approved");
  if (!(process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https://")) problems.push("NEXT_PUBLIC_SITE_URL must be https in production");
  if (process.env.DODO_API_BASE) problems.push("DODO_API_BASE is for tests only; remove it in production");
}
if (problems.length) { console.log("✖ Environment problems:\n  - " + problems.join("\n  - ")); process.exit(1); }
console.log(`✔ Environment looks complete${mode ? ` (billing: ${mode})` : " (billing off)"}.`);
