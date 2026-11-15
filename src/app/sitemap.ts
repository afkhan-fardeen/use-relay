import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";
import { DOCS } from "@/lib/docs-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${COMPANY.domain}`;
  return ["", "/pricing", "/support", "/security", "/bot", "/docs", ...DOCS.map((d) => `/docs/${d.slug}`), "/terms", "/privacy", "/about", "/refunds", "/cookies", "/dpa"].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const }));
}
