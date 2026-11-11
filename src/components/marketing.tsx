import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { COMPANY, operatorName } from "@/lib/company";
import { MobileMenu } from "./mobile-menu";

export const MAIN_NAV = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export function MarketingHeader({ tool, anchors }: { tool?: string; anchors?: { href: string; label: string }[] }) {
  const nav = anchors ?? MAIN_NAV;
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo href="/" tool={tool ?? null} />
        </div>
        <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm text-muted">
          {nav.map((a) => (
            <Link key={a.href} href={a.href} className="hover:text-ink transition-colors">{a.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/login" className="hidden sm:inline text-sm text-muted hover:text-ink">Log in</Link>
          <Button size="sm" href="/login" className="hidden sm:inline-flex">Start free</Button>
          <MobileMenu nav={nav} />
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-14 grid gap-10 grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] text-sm">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 text-muted max-w-xs leading-6">Klyroo builds Shopify apps. Klyroo Data Exporter turns your store data into clean Excel and CSV files.</p>
          <a href={`mailto:${COMPANY.supportEmail}`} className="mt-4 inline-block text-primary hover:text-primary-hover">{COMPANY.supportEmail}</a>
        </div>
        <nav aria-label="Product" className="space-y-2.5">
          <p className="text-muted">Product</p>
          <Link href="/" className="block hover:text-primary">Klyroo Data Exporter</Link>
          <Link href="/#features" className="block hover:text-primary">Features</Link>
          <Link href="/pricing" className="block hover:text-primary">Pricing</Link>
        </nav>
        <nav aria-label="Help" className="space-y-2.5">
          <p className="text-muted">Help</p>
          <Link href="/docs" className="block hover:text-primary">Documentation</Link>
          <Link href="/docs/getting-started" className="block hover:text-primary">Getting started</Link>
          <Link href="/support" className="block hover:text-primary">Support</Link>
          <Link href="/contact" className="block hover:text-primary">Contact</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2.5">
          <p className="text-muted">Legal</p>
          <Link href="/terms" className="block hover:text-primary">Terms of service</Link>
          <Link href="/privacy" className="block hover:text-primary">Privacy policy</Link>
          <Link href="/security" className="block hover:text-primary">Security</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p>© 2026 {operatorName()}. All rights reserved.</p>
          <p className="max-w-xl">Billing is handled by Shopify. Shopify is a trademark of Shopify Inc. Klyroo is an independent product and is not affiliated with or endorsed by Shopify.</p>
        </div>
      </div>
    </footer>
  );
}
