// Readiness check for the public showcase site.
//   npm run check:launch                      (checks https://useklyroo.com)
//   BASE=http://localhost:3000 npm run check:launch
import { COMPANY } from "../src/lib/company.ts";

const BASE = (process.env.BASE || `https://${COMPANY.domain}`).replace(/\/$/, "");
const results = [];
const check = (area, name, ok, detail = "") => results.push({ area, name, ok, detail });
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
async function get(path) {
  try {
    const r = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    return { status: r.status, text: r.status === 200 ? await r.text() : "" };
  } catch (e) { return { status: 0, text: "", error: e.message }; }
}

const pages = ["/", "/pricing", "/docs", "/docs/getting-started", "/terms", "/privacy", "/support", "/security", "/about", "/bot", "/refunds", "/cookies", "/dpa", "/robots.txt", "/sitemap.xml"];
const body = {};
for (const p of pages) {
  const r = await get(p);
  body[p] = strip(r.text);
  check("Public pages", `${p} answers 200`, r.status === 200, r.status ? `HTTP ${r.status}` : r.error);
}
for (const gone of ["/login", "/export", "/qr-code-generator"]) {
  const r = await get(gone);
  check("Old routes", `${gone} no longer serves the old product`, r.status !== 200 || !/Klyroo QR/.test(r.text));
}
check("Product", "home page describes Klyroo Context", /Klyroo/.test(body["/"]) && /brand/i.test(body["/"]) && /AI tools/.test(body["/"]));
check("Honesty", "no old Exporter, QR or Dodo wording left on the main pages", !["/", "/pricing", "/terms", "/privacy", "/security", "/about", "/support", "/refunds", "/dpa", "/cookies", "/docs/getting-started"].some((p) => /Data Exporter|Klyroo QR|Dodo|Turso|Shopify App Store/i.test(body[p] || "")));
check("Pricing", "pricing shows $24, $69 and $169", ["$24", "$69", "$169"].every((x) => (body["/pricing"] || "").includes(x)));
check("Pricing", "pricing names Paddle and US dollars", /Paddle/.test(body["/pricing"]) && /US dollars/i.test(body["/pricing"]));
check("Legal", "terms, privacy and security carry the support email", ["/terms", "/privacy", "/security"].every((p) => (body[p] || "").includes(COMPANY.supportEmail)));
check("Legal", "terms and refunds name Paddle as Merchant of Record", ["/terms", "/refunds"].every((p) => /Merchant of Record/.test(body[p] || "")));
check("Legal", "KlyrooBot page explains how to block it", /User-agent: KlyrooBot/.test(body["/bot"]) && /robots\.txt/.test(body["/bot"]));

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.area}] ${r.name}${r.detail && !r.ok ? ` (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
