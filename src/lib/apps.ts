// Klyroo's apps. One account can switch on any of them; the sidebar shows the current app's menu.
// Client-safe (no secrets, no Node-only imports).

export type AppSlug = "export" | "qr";

export type AppNavItem = { href: string; label: string };
export type AppInfo = {
  slug: AppSlug;
  name: string;
  tagline: string;
  points: string[];
  status: "live" | "preview";
  href: string; // where the app starts
  nav: AppNavItem[];
};

export const APPS: AppInfo[] = [
  {
    slug: "export",
    name: "Export",
    tagline: "Get your Shopify data into spreadsheets.",
    points: ["Products, orders, customers, inventory and collections", "Hundreds of columns, with a live preview", "Download as CSV in minutes"],
    status: "live",
    href: "/app",
    nav: [
      { href: "/app", label: "Home" },
      { href: "/app/exports/new", label: "New export" },
      { href: "/app/schedules", label: "Schedules" },
      { href: "/app/history", label: "History" },
      { href: "/app/destinations", label: "Destinations" },
    ],
  },
  {
    slug: "qr",
    name: "QR Codes",
    tagline: "Create branded QR codes for packaging, flyers and your store.",
    points: ["Links, Wi-Fi, text and more", "Your colours and logo", "Download as PNG or SVG"],
    status: "preview",
    href: "/app/qr",
    nav: [
      { href: "/app/qr", label: "Overview" },
      { href: "/app/qr/new", label: "Create" },
      { href: "/app/qr/library", label: "My codes" },
    ],
  },
];

export const isAppSlug = (v: unknown): v is AppSlug => APPS.some((a) => a.slug === v);
export const appInfo = (slug: AppSlug): AppInfo => APPS.find((a) => a.slug === slug)!;

/** Which app's menu to show for this URL. Shared pages (stores, billing, apps) fall back to Export. */
export function appForPath(pathname: string): AppSlug {
  return pathname === "/app/qr" || pathname.startsWith("/app/qr/") ? "qr" : "export";
}
