"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { APPS, appForPath, appInfo, type AppSlug } from "@/lib/apps";

const account = [
  { href: "/app/stores", label: "Stores" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/apps", label: "Apps" },
];

export function Logo({ href = "/", tool = null }: { href?: string; tool?: string | null }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-normal text-[17px]">
      <span aria-hidden className="grid place-items-center size-7 rounded-lg bg-primary text-white text-sm font-normal">
        K
      </span>
      Klyroo {tool && <span className="text-muted font-normal">{tool}</span>}
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

function isActive(path: string, href: string, siblings: string[]) {
  // The exact-match items (an app's home) must not light up for every sub-page.
  if (siblings.some((h) => h !== href && h.startsWith(`${href}/`) && path.startsWith(h))) return false;
  return href === "/app" || href === "/app/qr" ? path === href : path.startsWith(href);
}

function AppSwitcher({ current, enabled }: { current: AppSlug; enabled: AppSlug[] }) {
  const [open, setOpen] = useState(false);
  const cur = appInfo(current);
  return (
    <div className="relative mb-5">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-ctl border border-line-strong text-left text-sm hover:bg-wash"
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted leading-4">App</span>
          <span className="block leading-5 truncate">{cur.name}</span>
        </span>
        <span aria-hidden className="text-muted">⌄</span>
      </button>
      {open && (
        <div role="menu" className="absolute z-30 left-0 right-0 mt-1 rounded-card border border-line bg-surface p-1.5 shadow-[0_8px_24px_rgba(10,37,64,0.08)]">
          {APPS.filter((a) => enabled.includes(a.slug)).map((a) => (
            <Link key={a.slug} role="menuitem" href={a.href} onClick={() => setOpen(false)} className={`flex items-center justify-between h-10 px-3 rounded-ctl text-sm hover:bg-wash ${a.slug === current ? "text-primary" : ""}`}>
              {a.name}
              {a.status === "preview" && <span className="text-[11px] text-secondary">Preview</span>}
            </Link>
          ))}
          <Link role="menuitem" href="/app/apps" onClick={() => setOpen(false)} className="flex items-center h-10 px-3 rounded-ctl text-sm text-muted hover:bg-wash">Add or remove apps</Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ email, name, storeName, apps }: { email: string; name: string; storeName: string | null; apps: AppSlug[] }) {
  const path = usePathname();
  const current = appForPath(path);
  const shown: AppSlug = apps.includes(current) ? current : apps[0] ?? "export";
  const nav = appInfo(shown).nav;
  const navHrefs = nav.map((n) => n.href);
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface min-h-screen sticky top-0 h-screen p-5">
      <div className="px-2 pt-1 pb-6">
        <Logo href="/app" />
      </div>
      <AppSwitcher current={shown} enabled={apps} />
      <nav aria-label="Primary" className="space-y-1">
        {nav.map((n) => (
          <Item key={n.href} {...n} active={isActive(path, n.href, navHrefs)} />
        ))}
      </nav>
      <p className="mt-8 mb-2 px-3 text-[13px] font-normal text-muted">Account</p>
      <nav aria-label="Account" className="space-y-1">
        {account.map((n) => (
          <Item key={n.href} {...n} active={path.startsWith(n.href)} />
        ))}
      </nav>
      {apps.includes("export") && (
        <div className="mt-6 px-3 text-xs text-muted">
          <span className="block">Store</span>
          <Link href="/app/stores" className="block text-ink truncate hover:text-primary">{storeName ?? "None connected"}</Link>
        </div>
      )}
      <div className="mt-auto rounded-card border border-line p-4">
        {name && <p className="text-sm font-normal truncate">{name}</p>}
        <p className="text-xs text-muted truncate" title={email}>{email}</p>
        <form action={signOut}>
          <button type="submit" className="mt-2 text-xs text-muted hover:text-primary">Log out</button>
        </form>
      </div>
    </aside>
  );
}

export function MobileBar({ apps }: { apps: AppSlug[] }) {
  const path = usePathname();
  const current = appForPath(path);
  const shown: AppSlug = apps.includes(current) ? current : apps[0] ?? "export";
  const all = [...appInfo(shown).nav, ...account];
  const navHrefs = appInfo(shown).nav.map((n) => n.href);
  return (
    <div className="lg:hidden sticky top-0 z-20 bg-surface/95 border-b border-line">
      <div className="flex items-center justify-between px-4 h-14">
        <Logo href="/app" />
        <div className="flex gap-1">
          {APPS.filter((a) => apps.includes(a.slug)).map((a) => (
            <Link key={a.slug} href={a.href} className={`h-8 px-3 grid place-items-center rounded-full text-xs ${a.slug === shown ? "bg-primary text-white" : "border border-line text-muted"}`}>{a.name}</Link>
          ))}
        </div>
      </div>
      <nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {all.map((n) => {
          const active = navHrefs.includes(n.href) ? isActive(path, n.href, navHrefs) : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 h-9 px-3 grid place-items-center rounded-full text-sm font-normal ${active ? "bg-wash text-primary border border-primary/30" : "text-muted border border-line"}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
