import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { COMPANY, operatorName } from "@/lib/company";
import { CTA } from "@/lib/product";
import { MobileMenu } from "./mobile-menu";

export const MAIN_NAV = [
  { href: "/data-exporter", label: "Data Exporter" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/support", label: "Support" },
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
          <Button size="sm" href={CTA.href} className="hidden sm:inline-flex">{CTA.label}</Button>
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
          <p className="mt-4 text-muted max-w-xs leading-6">Klyroo makes Shopify apps. Simple, focused and built to do one job well.</p>
          <a href={`mailto:${COMPANY.supportEmail}`} className="mt-4 inline-block underline underline-offset-4">{COMPANY.supportEmail}</a>
        </div>
        <nav aria-label="Apps" className="space-y-2.5">
          <p className="text-muted">Apps</p>
          <Link href="/data-exporter" className="block hover:underline underline-offset-4">Klyroo Data Exporter</Link>
          <Link href="/pricing" className="block hover:underline underline-offset-4">Pricing</Link>
        </nav>
        <nav aria-label="Help" className="space-y-2.5">
          <p className="text-muted">Help</p>
          <Link href="/docs" className="block hover:underline underline-offset-4">Documentation</Link>
          <Link href="/docs/getting-started" className="block hover:underline underline-offset-4">Getting started</Link>
          <Link href="/support" className="block hover:underline underline-offset-4">Support</Link>
          <Link href="/changelog" className="block hover:underline underline-offset-4">Changelog</Link>
          <Link href="/contact" className="block hover:underline underline-offset-4">Contact</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2.5">
          <p className="text-muted">Legal</p>
          <Link href="/about" className="block hover:underline underline-offset-4">About</Link>
          <Link href="/terms" className="block hover:underline underline-offset-4">Terms of service</Link>
          <Link href="/privacy" className="block hover:underline underline-offset-4">Privacy policy</Link>
          <Link href="/refunds" className="block hover:underline underline-offset-4">Billing and refunds</Link>
          <Link href="/cookies" className="block hover:underline underline-offset-4">Cookie policy</Link>
          <Link href="/dpa" className="block hover:underline underline-offset-4">Data processing</Link>
          <Link href="/security" className="block hover:underline underline-offset-4">Security</Link>
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
