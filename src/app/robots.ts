import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

// Public marketing and policy pages can be indexed. The signed-in areas and API cannot.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/export/", "/export$", "/qr/", "/qr$", "/account", "/app$", "/app/", "/api/", "/onboarding", "/auth/", "/r/"] }],
    sitemap: `https://${COMPANY.domain}/sitemap.xml`,
  };
}
