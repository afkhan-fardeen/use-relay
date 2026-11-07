"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { ACCOUNT_NAV, APPS, appInfo, isNavActive, type AppSlug } from "@/lib/apps";

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

type Area = AppSlug | "account";
const areaName = (a: Area) => (a === "account" ? "Account" : appInfo(a).fullName);
const areaNav = (a: Area) => (a === "account" ? ACCOUNT_NAV : appInfo(a).nav);
const areaHome = (a: Area) => (a === "account" ? "/account" : appInfo(a).href);

function AppSwitcher({ area, enabled }: { area: Area; enabled: AppSlug[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
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
          <span className="block text-xs text-muted leading-4">{area === "account" ? "Klyroo" : "Klyroo app"}</span>
          <span className="block leading-5 truncate">{areaName(area)}</span>
        </span>
        <span aria-hidden className="text-muted">⌄</span>
      </button>
      {open && (
        <div role="menu" className="absolute z-30 left-0 right-0 mt-1 rounded-card border border-line bg-surface p-1.5 shadow-[0_8px_24px_rgba(10,37,64,0.08)]">
          {APPS.filter((a) => enabled.includes(a.slug)).map((a) => (
            <Link key={a.slug} role="menuitem" href={a.href} onClick={close} className={`flex items-center justify-between h-10 px-3 rounded-ctl text-sm hover:bg-wash ${a.slug === area ? "text-primary" : ""}`}>
              {a.fullName}
              {a.status === "preview" && <span className="text-[11px] text-secondary">Preview</span>}
            </Link>
          ))}
          <Link role="menuitem" href="/account" onClick={close} className={`flex items-center h-10 px-3 rounded-ctl text-sm hover:bg-wash ${area === "account" ? "text-primary" : "text-muted"}`}>Account</Link>
          <Link role="menuitem" href="/account/apps" onClick={close} className="flex items-center h-10 px-3 rounded-ctl text-sm text-muted hover:bg-wash">Add or remove apps</Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ area, email, name, storeName, apps }: { area: Area; email: string; name: string; storeName: string | null; apps: AppSlug[] }) {
  const path = usePathname();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface min-h-screen sticky top-0 h-screen p-5">
      <div className="px-2 pt-1 pb-6">
        <Logo href={areaHome(area)} />
      </div>
      <AppSwitcher area={area} enabled={apps} />
      <nav aria-label="Primary" className="space-y-1">
        {areaNav(area).map((n) => (
          <Item key={n.href} {...n} active={isNavActive(path, n.href)} />
        ))}
      </nav>
      {area === "export" && (
        <div className="mt-6 px-3 text-xs text-muted">
          <span className="block">Store</span>
          <Link href="/export/stores" className="block text-ink truncate hover:text-primary">{storeName ?? "None connected"}</Link>
        </div>
      )}
      <div className="mt-auto rounded-card border border-line p-4">
        {name && <p className="text-sm font-normal truncate">{name}</p>}
        <p className="text-xs text-muted truncate" title={email}>{email}</p>
        <div className="mt-2 flex items-center gap-4">
          <Link href="/account" className="text-xs text-muted hover:text-primary">Account</Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-muted hover:text-primary">Log out</button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileBar({ area, apps }: { area: Area; apps: AppSlug[] }) {
  const path = usePathname();
  return (
    <div className="lg:hidden sticky top-0 z-20 bg-surface/95 border-b border-line">
      <div className="flex items-center justify-between px-4 h-14">
        <Logo href={areaHome(area)} />
        <div className="flex gap-1">
          {APPS.filter((a) => apps.includes(a.slug)).map((a) => (
            <Link key={a.slug} href={a.href} className={`h-8 px-3 grid place-items-center rounded-full text-xs ${a.slug === area ? "bg-primary text-white" : "border border-line text-muted"}`}>{a.name}</Link>
          ))}
          <Link href="/account" className={`h-8 px-3 grid place-items-center rounded-full text-xs ${area === "account" ? "bg-primary text-white" : "border border-line text-muted"}`}>Account</Link>
        </div>
      </div>
      <nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {areaNav(area).map((n) => {
          const active = isNavActive(path, n.href);
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
