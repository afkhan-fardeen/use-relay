// Klyroo is the company. Each app is its own product with its own pages, plans and billing.
// One Klyroo account can use any of them, or just one. Client-safe (no secrets).

export type AppSlug = "export" | "qr";

export type AppNavItem = { href: string; label: string };
export type AppInfo = {
  slug: AppSlug;
  name: string; // short name, used inside the app
  fullName: string; // product name, used on marketing pages
  tagline: string;
  points: string[];
  status: "live" | "preview";
  href: string; // the app's home inside the signed-in area
  marketing: string; // the app's public product page
  nav: AppNavItem[];
};

export const APPS: AppInfo[] = [
  {
    slug: "export",
    name: "Export",
    fullName: "Klyroo Export",
    tagline: "Get your Shopify data into spreadsheets.",
    points: ["Products, orders, customers, inventory and collections", "Hundreds of columns, with a live preview", "Download as CSV in minutes"],
    status: "live",
    href: "/export",
    marketing: "/apps/export",
    nav: [
      { href: "/export", label: "Home" },
      { href: "/export/new", label: "New export" },
      { href: "/export/schedules", label: "Schedules" },
      { href: "/export/history", label: "History" },
      { href: "/export/destinations", label: "Destinations" },
      { href: "/export/stores", label: "Stores" },
      { href: "/export/billing", label: "Billing" },
    ],
  },
  {
    slug: "qr",
    name: "QR",
    fullName: "Klyroo QR",
    tagline: "Create branded QR codes for packaging, flyers and your store.",
    points: ["Links, Wi-Fi, text and more", "Your colours and logo", "Download as PNG or SVG"],
    status: "preview",
    href: "/qr",
    marketing: "/apps/qr",
    nav: [
      { href: "/qr", label: "Overview" },
      { href: "/qr/new", label: "Create" },
      { href: "/qr/library", label: "My codes" },
      { href: "/qr/billing", label: "Billing" },
    ],
  },
];

export const ACCOUNT_NAV: AppNavItem[] = [
  { href: "/account", label: "Overview" },
  { href: "/account/apps", label: "Apps" },
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
