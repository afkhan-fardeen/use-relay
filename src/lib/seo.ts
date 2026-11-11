import { COMPANY } from "./company.ts";

const base = `https://${COMPANY.domain}`;

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Klyroo",
  url: base,
  logo: `${base}/brand/klyroo-email.png`,
  email: COMPANY.supportEmail,
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: COMPANY.supportEmail, availableLanguage: "English" },
};

export const websiteLd = { "@context": "https://schema.org", "@type": "WebSite", name: "Klyroo", url: base };

/** A SoftwareApplication entry with a price range in USD (monthly). */
export const softwareLd = (o: { name: string; description: string; path: string; category: string; low: number; high: number; features: string[] }) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: o.name,
  description: o.description,
  url: `${base}${o.path}`,
  applicationCategory: o.category,
  operatingSystem: "Shopify",
  featureList: o.features,
  publisher: { "@type": "Organization", name: "Klyroo", url: base },
  offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: String(o.low), highPrice: String(o.high), offerCount: 4 },
});
