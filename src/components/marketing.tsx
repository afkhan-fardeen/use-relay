import Link from "next/link";
import { Logo } from "@/components/sidebar";
import { Button } from "@/components/ui";
import { COMPANY, operatorName } from "@/lib/company";

export function MarketingHeader({ tool, anchors }: { tool?: string; anchors?: { href: string; label: string }[] }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1200px] px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo href="/" tool={tool ?? null} />
          {tool && <Link href="/" className="hidden sm:inline text-xs text-muted hover:text-ink">All apps</Link>}
        </div>
        <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm text-muted">
          {(anchors ?? [{ href: "/apps/export", label: "Export" }, { href: "/apps/qr", label: "QR" }, { href: "/pricing", label: "Pricing" }, { href: "/contact", label: "Contact" }]).map((a) => (
            <Link key={a.href} href={a.href} className="hover:text-ink">{a.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden sm:inline text-sm text-muted hover:text-ink">Log in</Link>
          <Button size="sm" href="/login">Start free</Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-6 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr] text-sm">
        <div>
          <Logo />
          <p className="mt-4 text-muted max-w-xs">Small, sharp tools for ecommerce teams.</p>
          <a href={`mailto:${COMPANY.supportEmail}`} className="mt-4 inline-block text-primary hover:text-primary-hover">{COMPANY.supportEmail}</a>
        </div>
        <nav aria-label="Apps" className="space-y-2.5">
          <p className="text-muted">Apps</p>
          <Link href="/apps/export" className="block hover:text-primary">Klyroo Export</Link>
          <Link href="/apps/qr" className="block hover:text-primary">Klyroo QR</Link>
          <Link href="/pricing" className="block hover:text-primary">Pricing</Link>
        </nav>
        <nav aria-label="Company" className="space-y-2.5">
          <p className="text-muted">Company</p>
          <Link href="/contact" className="block hover:text-primary">Contact</Link>
          <Link href="/login" className="block hover:text-primary">Log in</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2.5">
          <p className="text-muted">Legal</p>
          <Link href="/terms" className="block hover:text-primary">Terms of service</Link>
          <Link href="/privacy" className="block hover:text-primary">Privacy policy</Link>
          <Link href="/refunds" className="block hover:text-primary">Refund policy</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-[1200px] px-6 pb-10 text-xs text-muted">
        © 2026 {operatorName()}. Payments are handled by Paddle, our Merchant of Record.
      </div>
    </footer>
  );
}
