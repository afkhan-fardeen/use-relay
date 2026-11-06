"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/exports/new", label: "New export" },
  { href: "/app/schedules", label: "Schedules" },
  { href: "/app/history", label: "History" },
  { href: "/app/destinations", label: "Destinations" },
];
const nav2 = [
  { href: "/app/stores", label: "Stores" },
  { href: "/app/billing", label: "Billing" },
];

export function Logo({ href = "/", tool = "Export" }: { href?: string; tool?: string | null }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-normal text-[17px]">
      <span aria-hidden className="grid place-items-center size-7 rounded-lg bg-primary text-white text-sm font-normal">
        U
      </span>
      Userelay {tool && <span className="text-muted font-normal">{tool}</span>}
    </Link>
  );
}

function Item({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 h-10 px-3 rounded-ctl text-sm font-normal transition-colors ${
        active ? "bg-wash text-primary" : "text-muted hover:text-ink hover:bg-wash"
      }`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
      {label}
    </Link>
  );
}

export function Sidebar({ email, storeName }: { email: string; storeName: string | null }) {
  const path = usePathname();
  const is = (h: string) => (h === "/app" ? path === "/app" : path.startsWith(h));
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface min-h-screen sticky top-0 h-screen p-5">
      <div className="px-2 pt-1 pb-6">
        <Logo href="/app" />
      </div>
      <button className="mb-6 flex items-center justify-between gap-2 py-2.5 px-3 rounded-ctl border border-line-strong text-left text-sm hover:bg-wash">
        <span className="min-w-0">
          <span className="block font-normal leading-5 truncate">{storeName ?? "No store yet"}</span>
          <span className="block text-xs text-muted leading-4 mt-0.5">{storeName ? "myshopify.com · connected" : "Connect one in Stores"}</span>
        </span>
        <span aria-hidden className="text-muted">⌄</span>
      </button>
      <nav aria-label="Primary" className="space-y-1">
        {nav.map((n) => (
          <Item key={n.href} {...n} active={is(n.href)} />
        ))}
      </nav>
      <p className="mt-8 mb-2 px-3 text-[13px] font-normal text-muted">Account</p>
      <nav aria-label="Account" className="space-y-1">
        {nav2.map((n) => (
          <Item key={n.href} {...n} active={is(n.href)} />
        ))}
      </nav>
      <div className="mt-auto rounded-card border border-line p-4">
        <p className="text-sm font-normal truncate" title={email}>{email}</p>
        <form action={signOut}>
          <button type="submit" className="mt-2 text-xs text-muted hover:text-primary">Log out</button>
        </form>
      </div>
    </aside>
  );
}

export function MobileBar() {
  const path = usePathname();
  const all = [...nav, ...nav2];
  return (
    <div className="lg:hidden sticky top-0 z-20 bg-surface/95 border-b border-line">
      <div className="flex items-center justify-between px-4 h-14">
        <Logo href="/app" />
      </div>
      <nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {all.map((n) => {
          const active = n.href === "/app" ? path === "/app" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 h-9 px-3 grid place-items-center rounded-full text-sm font-normal ${
                active ? "bg-primary text-white" : "text-muted border border-line"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
