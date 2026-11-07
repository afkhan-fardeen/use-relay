import Link from "next/link";
import { Logo } from "@/components/sidebar";
import { Button } from "@/components/ui";

export function MarketingHeader({ tool, anchors }: { tool?: string; anchors?: { href: string; label: string }[] }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1200px] px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo href="/" tool={tool ?? null} />
          {tool && <Link href="/" className="hidden sm:inline text-xs text-muted hover:text-ink">All apps</Link>}
        </div>
        <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm text-muted">
          {(anchors ?? [{ href: "/apps/export", label: "Export" }, { href: "/apps/qr", label: "QR" }]).map((a) => (
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
      <div className="mx-auto max-w-[1200px] px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <Logo />
        <div className="flex gap-6">
          <Link href="/apps/export" className="hover:text-ink">Klyroo Export</Link>
          <Link href="/apps/qr" className="hover:text-ink">Klyroo QR</Link>
        </div>
        <p>© 2026 Klyroo</p>
      </div>
    </footer>
  );
}
