// What the website says about Klyroo Data Exporter. Plain data: the app itself (a Shopify App Store app) lives in
// its own project; keep these numbers in step with its plans (klyroo-data-exporter/app/lib/plans.ts).

/** Where merchants install the app. Set to the App Store listing address once it is live. */
export const APP_STORE_URL: string | null = null;

export const PRODUCT = {
  name: "Klyroo Data Exporter",
  short: "Data Exporter",
  tagline: "Shopify products, inventory and metafields as clean Excel and CSV files.",
};

export type Plan = { key: string; name: string; price: number; blurb: string; recommended?: boolean; features: string[] };

export const PLANS: Plan[] = [
  { key: "free", name: "Free", price: 0, blurb: "Try it on a small catalog.", features: ["Up to 100 rows per export", "CSV files", "Products and collections", "Unlimited export runs"] },
  { key: "starter", name: "Starter", price: 29, blurb: "Boutique stores and small catalogs.", features: ["Up to 5,000 rows per export", "Excel (.xlsx) and CSV", "Choose and order your own columns", "Product and collection metafields"] },
  { key: "growth", name: "Growth", price: 119, recommended: true, blurb: "Scaling brands and multi-warehouse stores.", features: ["Up to 50,000 rows per export", "Inventory by location", "Variant-level metafields", "Everything in Starter"] },
  { key: "plus", name: "Plus", price: 249, blurb: "Large catalogs and Shopify Plus stores.", features: ["Up to 1,000,000 rows per export", "Everything in Growth", "Priority support"] },
];

export const TEMPLATES: { name: string; category: string; blurb: string }[] = [
  { name: "Full product catalog", category: "Catalog", blurb: "Every variant with price, inventory, images and SEO." },
  { name: "Price and cost sheet", category: "Catalog", blurb: "SKU, price, compare-at and cost to review margin." },
  { name: "SEO and collections audit", category: "Catalog", blurb: "Titles, descriptions, category and which collections each product sits in." },
  { name: "Product audit", category: "Catalog", blurb: "Spot missing images, SEO and zero-stock active products." },
  { name: "Inventory by location", category: "Fulfillment", blurb: "Available, on hand and committed per SKU and location." },
  { name: "Inventory, every state", category: "Fulfillment", blurb: "Available, on hand, committed, reserved, damaged, incoming and safety stock." },
];

export const FEATURES: { icon: "list" | "plus" | "history" | "store" | "apps" | "download"; title: string; text: string }[] = [
  { icon: "download", title: "Excel that behaves", text: "Real .xlsx files with a styled header. SKUs and barcodes stay text, so 001234 never becomes 1234." },
  { icon: "history", title: "Live preview", text: "See real rows from your store before you export, so the file is right the first time." },
  { icon: "plus", title: "Your columns, your order", text: "Pick, reorder and rename columns to match the system that will read the file." },
  { icon: "apps", title: "Metafields", text: "Choose from your store's own metafield definitions, product or variant level." },
  { icon: "store", title: "Built for big catalogs", text: "Exports run in the background and stream to the file, so large stores finish. Leave and come back." },
  { icon: "list", title: "Ready-made templates", text: "Catalog audits, price sheets and stock by location: start from the job, not the field list." },
];

export const money = (n: number) => (n === 0 ? "Free" : `$${n}`);

/** The main call to action. Until the app is listed it asks for early access rather than pointing at a page that does not exist. */
export const CTA = APP_STORE_URL ? { href: APP_STORE_URL, label: "Install on Shopify" } : { href: "/support?topic=access", label: "Request early access" };
