// What the website says about Klyroo Context. Plain data. Keep it in step with what the service really does.

export const PRODUCT = {
  name: "Klyroo Context",
  tagline: "Your store's brand brain for AI tools.",
  description: "Paste your store address. Klyroo reads your public site and builds a living guide to your brand, products and policies that Claude, ChatGPT, Cursor and other AI tools can use.",
};

/** Address of the preview API. Set NEXT_PUBLIC_PREVIEW_API once the service is deployed; until then the site asks for early access. */
export const PREVIEW_API: string | null = process.env.NEXT_PUBLIC_PREVIEW_API ?? null;

export type Plan = { key: string; name: string; price: number; blurb: string; recommended?: boolean; features: string[] };

export const PLANS: Plan[] = [
  { key: "preview", name: "Free preview", price: 0, blurb: "See what AI tools would know about your store.", features: ["One store, up to 15 pages and products", "Five brand documents", "A private link that works for 24 hours", "No card, no account"] },
  { key: "solo", name: "Solo brand", price: 24, blurb: "A single store that wants AI to get it right.", features: ["One brand workspace", "Up to 250 products and pages", "Remote MCP link and private Markdown links", "Edit and approve every document", "Weekly automatic refresh"] },
  { key: "growth", name: "Multi-market", price: 69, recommended: true, blurb: "Brands with stores in more than one market.", features: ["Up to 3 workspaces (for example US, UK, GCC)", "Up to 2,500 products and pages", "Daily automatic refresh", "5 team seats", "Everything in Solo brand"] },
  { key: "agency", name: "Agency", price: 169, blurb: "Agencies and groups running many brands.", features: ["10 workspaces, $12 for each extra", "Up to 15,000 products and pages", "Faster refresh", "20 seats and read-only contractor links", "Everything in Multi-market"] },
];

export const DOCUMENTS: { file: string; name: string; blurb: string }[] = [
  { file: "01", name: "Brand identity and voice", blurb: "What you stand for, who you sell to, and how you sound." },
  { file: "02", name: "Catalog and hero products", blurb: "Titles, variants, prices and stock, read straight from your store data." },
  { file: "03", name: "Policies and operations", blurb: "Shipping, returns and payment terms, in your own words." },
  { file: "04", name: "FAQ and objection handling", blurb: "The questions shoppers ask, answered from your site only." },
  { file: "05", name: "AI agent guide", blurb: "A short rulebook, ready for your agents.md file." },
];

export const FEATURES: { icon: "list" | "plus" | "history" | "store" | "apps" | "download"; title: string; text: string }[] = [
  { icon: "download", title: "One link for every AI tool", text: "Connect Claude, ChatGPT, Cursor and others with the same address. Everyone works from the same facts." },
  { icon: "list", title: "Prices and stock come from data", text: "The catalog document is built from your store's product data, not written by a model, so SKUs and prices are not made up." },
  { icon: "history", title: "Stays current", text: "Scheduled refreshes pick up new prices, stock, collections and policy changes, and show you what changed." },
  { icon: "plus", title: "You stay in charge", text: "Edit any document, add banned claims and rules, and keep drafts hidden until you approve them." },
  { icon: "store", title: "Made for more than one market", text: "Give each region its own workspace so currencies and policies never leak into each other." },
  { icon: "apps", title: "Light on your store", text: "We read public pages politely, follow robots.txt, and never ask for your Shopify login." },
];

export const money = (n: number) => (n === 0 ? "Free" : `$${n}`);

/** The main call to action. */
export const CTA = { href: "mailto:support@useklyroo.com?subject=Early%20access", label: "Request early access" };
