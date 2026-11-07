// Paddle go-live readiness check against a running site.
//   npm run check:launch                      (checks https://useklyroo.com)
//   BASE=http://localhost:3000 npm run check:launch
// Mirrors Paddle's published requirements: public HTTPS site, product + pricing described,
// Terms (naming the seller, with Merchant of Record wording), Privacy and Refund policies
// reachable from navigation, refund window of 14-90 days, no login wall on any of it.
import { COMPANY, missingCompanyDetails } from "../src/lib/company.ts";

const BASE = (process.env.BASE || `https://${COMPANY.domain}`).replace(/\/$/, "");
const results = [];
const check = (area, name, ok, detail = "") => results.push({ area, name, ok, detail });

async function get(path, init) {
  try {
    const r = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(20000), ...init });
    return { status: r.status, text: r.status === 200 ? await r.text() : "", headers: r.headers };
  } catch (e) {
    return { status: 0, text: "", error: e.message, headers: new Headers() };
  }
}
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&apos;|&#x27;|&#39;/g, "'").replace(/\s+/g, " ");

// 1. Pages are public (HTTP 200 without logging in)
const pages = ["/", "/apps/export", "/apps/qr", "/pricing", "/terms", "/privacy", "/refunds", "/contact", "/robots.txt", "/sitemap.xml"];
const body = {};
for (const p of pages) {
  const r = await get(p);
  body[p] = strip(r.text);
  check("Public pages", `${p} is public (200, no login)`, r.status === 200, r.status ? `HTTP ${r.status}` : r.error);
}

// 2. HTTPS and domain
check("Domain", "site is served over HTTPS", BASE.startsWith("https://") || BASE.includes("localhost"), BASE);
if (BASE.startsWith("https://")) {
  const w = await get("", { headers: {} });
  const www = await fetch(BASE.replace("https://", "https://www."), { redirect: "manual", signal: AbortSignal.timeout(20000) }).catch(() => null);
  check("Domain", "www redirects to the main domain", !!www && [301, 302, 307, 308].includes(www.status), www ? `HTTP ${www.status}` : "no response");
  void w;
}
const health = await get("/api/health");
check("Domain", "health endpoint answers", health.status === 200);

// 3. Product and pricing are described
check("Product", "home page says what the product does", /Klyroo Export/.test(body["/"]) && /Klyroo QR/.test(body["/"]));
check("Product", "Export page describes the product and features", /Shopify/.test(body["/apps/export"]) && /templates/i.test(body["/apps/export"]));
check("Pricing", "pricing page shows plans and prices (£19, £49, £99)", ["£19", "£49", "£99"].every((x) => (body["/pricing"] || "").includes(x)));
check("Pricing", "pricing page states currency and cancel-any-time", /GBP/.test(body["/pricing"]) && /Cancel any time/i.test(body["/pricing"]));

// 4. Terms
const terms = body["/terms"] || "";
check("Terms", "names Paddle as Merchant of Record", /Paddle\.com is the Merchant of Record/.test(terms));
check("Terms", "links Paddle's buyer terms", /paddle\.com\/legal\/checkout-buyer-terms/.test((await get("/terms")).text));
check("Terms", "covers acceptable use, IP, termination, liability, governing law", ["Acceptable use", "Intellectual property", "Suspension and termination", "Liability", "Governing law"].every((x) => terms.includes(x)));
check("Terms", "has contact details", terms.includes(COMPANY.supportEmail));

// 5. Refunds
const refunds = body["/refunds"] || "";
const days = [...refunds.matchAll(/(\d+)[- ]day/gi)].map((m) => Number(m[1]));
check("Refunds", "refund window is between 14 and 90 days", days.some((d) => d >= 14 && d <= 90), `found: ${days.join(", ") || "none"}`);
check("Refunds", 'does not say "all sales are final" / "no refunds"', !/all sales are final|no refunds/i.test(refunds));
check("Refunds", "tells buyers how to request a refund (Paddle or email)", /paddle\.net/i.test(refunds) && refunds.includes(COMPANY.supportEmail));

// 6. Privacy
const priv = body["/privacy"] || "";
check("Privacy", "identifies the controller and a privacy contact", /controller/i.test(priv) && priv.includes(COMPANY.supportEmail));
check("Privacy", "lists data collected with purposes and legal basis", /Legal basis/i.test(priv) && /Why/.test(priv));
check("Privacy", "names recipients including Paddle as Merchant of Record", /Paddle/.test(priv) && /Supabase/.test(priv));
check("Privacy", "covers retention, security, cookies, rights, international transfers", ["How long we keep it", "How we protect it", "Cookies", "Your rights", "International transfers"].every((x) => priv.includes(x)));
check("Privacy", "mentions the right to complain to a supervisory authority", /complain/i.test(priv));

// 7. Policies reachable from navigation (footer on every public page)
for (const p of ["/", "/apps/export", "/pricing", "/contact"]) {
  const html = (await get(p)).text;
  const links = ["/terms", "/privacy", "/refunds", "/contact"].every((l) => html.includes(`href="${l}"`));
  check("Navigation", `${p} links to Terms, Privacy, Refunds and Contact`, links);
}
check("Navigation", "sign-up page links Terms and Privacy", (await get("/login")).text.includes('href="/terms"') && (await get("/login")).text.includes('href="/privacy"'));
check("Navigation", "robots.txt hides signed-in areas and lists the sitemap", /Disallow: \/export/.test((await get("/robots.txt")).text) && /Sitemap:/.test((await get("/robots.txt")).text));

// 8. Seller details Paddle requires (set in src/lib/company.ts)
const missing = missingCompanyDetails();
check("Seller details", "legal name, postal address, country and governing law are filled in", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "");
if (COMPANY.legalName) {
  check("Seller details", "legal name appears in the Terms and Privacy policy", terms.includes(COMPANY.legalName) && priv.includes(COMPANY.legalName));
  if (COMPANY.entity === "individual") check("Seller details", 'individual seller is shown as "trading as Klyroo"', /trading as Klyroo/.test(terms) && /trading as Klyroo/.test(priv));
}

// Report
let area = "";
let failed = 0;
for (const r of results) {
  if (r.area !== area) { area = r.area; console.log(`\n${area}`); }
  console.log(`  ${r.ok ? "✔" : "✖"} ${r.name}${r.detail && !r.ok ? `  (${r.detail})` : ""}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} checks pass.`);
console.log(failed ? "NOT READY for Paddle review: fix the items marked ✖." : "READY for Paddle review (still submit your domain in Paddle: Settings → Website approval).");
process.exitCode = failed ? 1 : 0;
