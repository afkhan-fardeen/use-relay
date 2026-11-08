// Klyroo is the company. Each app is its own product with its own pages, plans and billing.
// Today there is one app, Klyroo Export; more can be added here later. Client-safe (no secrets).

export type AppSlug = "export";

export type AppNavItem = {
  href: string;
  label: string;
  /** Name of an icon in components/icons. */
  icon: string;
  /** Opens in a new tab (used for the help docs). */
  external?: boolean;
};

export type AppInfo = {
  slug: AppSlug;
  name: string; // short name, used inside the app
  fullName: string; // product name, used on marketing pages
  tagline: string;
  points: string[];
  href: string; // the app's home inside the signed-in area
  marketing: string; // the app's public product page
  docs: string; // the app's help pages
  nav: AppNavItem[];
};

export const APPS: AppInfo[] = [
  {
    slug: "export",
    name: "Export",
    fullName: "Klyroo Export",
    tagline: "Get your Shopify data into spreadsheets.",
    points: ["Products, orders, customers, inventory and collections", "Hundreds of columns, with a live preview", "Download as CSV in minutes"],
    href: "/export",
    marketing: "/",
    docs: "/docs/export/getting-started",
    nav: [
      { href: "/export", label: "Home", icon: "home" },
      { href: "/export/new", label: "New export", icon: "plus" },
      { href: "/export/history", label: "History", icon: "history" },
      { href: "/export/stores", label: "Stores", icon: "store" },
      { href: "/export/billing", label: "Billing", icon: "card" },
      { href: "/account", label: "Account", icon: "user" },
      { href: "/docs/export/getting-started", label: "Help", icon: "book", external: true },
    ],
  },
];

export const ACCOUNT_NAV: AppNavItem[] = [
  { href: "/account", label: "Overview", icon: "user" },
  { href: "/export", label: "Back to Klyroo Export", icon: "list" },
  { href: "/docs", label: "Help", icon: "book", external: true },
];

export const isAppSlug = (v: unknown): v is AppSlug => APPS.some((a) => a.slug === v);
export const appInfo = (slug: AppSlug): AppInfo => APPS.find((a) => a.slug === slug)!;

/** Whether a nav link is the current page. App and account home links match exactly; others match their sub-pages. */
export function isNavActive(pathname: string, href: string): boolean {
  const exact = href === "/account" || APPS.some((a) => a.href === href);
  return exact ? pathname === href : pathname.startsWith(href);
}
