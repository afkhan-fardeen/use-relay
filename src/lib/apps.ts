// Klyroo is the company. Each app is its own product with its own pages, plans and billing.
// One Klyroo account can use any of them, or just one. Client-safe (no secrets).

export type AppSlug = "export" | "qr";

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
    marketing: "/apps/export",
    docs: "/docs/export/getting-started",
    nav: [
      { href: "/export", label: "Home", icon: "home" },
      { href: "/export/new", label: "New export", icon: "plus" },
      { href: "/export/history", label: "History", icon: "history" },
      { href: "/export/stores", label: "Stores", icon: "store" },
      { href: "/export/billing", label: "Billing", icon: "card" },
      { href: "/docs/export/getting-started", label: "Help", icon: "book", external: true },
    ],
  },
  {
    slug: "qr",
    name: "QR",
    fullName: "Klyroo QR",
    tagline: "Make QR codes for packaging, flyers and your store.",
    points: ["Static codes, free and made in your browser", "Dynamic links you can change any time", "Scan analytics without cookies"],
    href: "/qr",
    marketing: "/apps/qr",
    docs: "/docs/qr/getting-started",
    nav: [
      { href: "/qr", label: "My codes", icon: "list" },
      { href: "/qr/new", label: "Create", icon: "plus" },
      { href: "/qr/billing", label: "Billing", icon: "card" },
      { href: "/docs/qr/getting-started", label: "Help", icon: "book", external: true },
    ],
  },
];

export const ACCOUNT_NAV: AppNavItem[] = [
  { href: "/account", label: "Overview", icon: "user" },
  { href: "/account/apps", label: "Apps", icon: "apps" },
  { href: "/docs", label: "Help", icon: "book", external: true },
];

export const isAppSlug = (v: unknown): v is AppSlug => APPS.some((a) => a.slug === v);
export const appInfo = (slug: AppSlug): AppInfo => APPS.find((a) => a.slug === slug)!;

/** Where a person lands the first time they open an app. */
export const startPath = (slug: AppSlug): string => (slug === "export" ? "/export/stores" : "/qr");

/** An app's home and the account home match exactly; everything else matches by prefix. */
export function isNavActive(pathname: string, href: string): boolean {
  const exact = href === "/account" || APPS.some((a) => a.href === href);
  return exact ? pathname === href : pathname.startsWith(href);
}
