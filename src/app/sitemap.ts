import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${COMPANY.domain}`;
  return ["", "/apps/export", "/apps/qr", "/pricing", "/contact", "/terms", "/privacy", "/refunds"].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const }));
}
