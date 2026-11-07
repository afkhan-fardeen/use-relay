"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { signOut } from "@/app/login/actions";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ACCOUNT_NAV, APPS, appInfo, isNavActive, type AppNavItem, type AppSlug } from "@/lib/apps";

type Area = AppSlug | "account";
const areaName = (a: Area) => (a === "account" ? "Account" : appInfo(a).fullName);
const areaNav = (a: Area): AppNavItem[] => (a === "account" ? ACCOUNT_NAV : appInfo(a).nav);
const areaHome = (a: Area) => (a === "account" ? "/account" : appInfo(a).href);
const areaIcon = (a: Area): IconName => (a === "account" ? "user" : a === "qr" ? "qr" : "list");

// ───────── remembers whether the desktop sidebar is collapsed ─────────
const KEY = "klyroo.sidebar";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("klyroo-sidebar", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("klyroo-sidebar", cb);
  };
};
const readCollapsed = () => {
  try { return localStorage.getItem(KEY) === "collapsed"; } catch { return false; }
};
const writeCollapsed = (v: boolean) => {
  try { localStorage.setItem(KEY, v ? "collapsed" : "open"); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event("klyroo-sidebar"));
};

function NavItem({ item, active, collapsed, onNavigate }: { item: AppNavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const ext = item.external ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <Link
      href={item.href}
      {...ext}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`group flex items-center h-10 rounded-ctl text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
        active ? "bg-wash text-primary" : "text-muted hover:text-ink hover:bg-wash"
      }`}
    >
      <Icon name={item.icon as IconName} size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.external && <Icon name="external" size={13} className="ml-auto opacity-50" />}
    </Link>
  );
}

function AppSwitcher({ area, enabled, collapsed, onNavigate }: { area: Area; enabled: AppSlug[]; collapsed: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => { setOpen(false); onNavigate?.(); };
  return (
    <div className="relative mb-5">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch app. Current: ${areaName(area)}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        title={collapsed ? areaName(area) : undefined}
        className={`w-full flex items-center rounded-ctl border border-line-strong text-left text-sm hover:bg-wash transition-colors ${collapsed ? "justify-center h-11" : "gap-3 px-3 py-2.5"}`}
      >
        <span className="grid place-items-center size-7 shrink-0 rounded-md bg-primary/10 text-primary"><Icon name={areaIcon(area)} size={16} /></span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted leading-4">{area === "account" ? "Klyroo" : "Klyroo app"}</span>
              <span className="block leading-5 truncate">{areaName(area)}</span>
            </span>
            <Icon name={open ? "chevronUp" : "chevronDown"} size={16} className="text-muted shrink-0" />
          </>
        )}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className={`absolute z-30 rounded-card border border-line bg-surface p-1.5 shadow-[0_8px_24px_rgba(10,37,64,0.10)] ${collapsed ? "left-full ml-2 top-0 w-56" : "left-0 right-0 mt-1"}`}>
            {APPS.filter((a) => enabled.includes(a.slug)).map((a) => (
              <Link key={a.slug} role="menuitem" href={a.href} onClick={close} className={`flex items-center gap-3 h-10 px-3 rounded-ctl text-sm hover:bg-wash ${a.slug === area ? "text-primary bg-wash" : ""}`}>
                <Icon name={a.slug === "qr" ? "qr" : "list"} size={16} />{a.fullName}
              </Link>
            ))}
            <div className="my-1 border-t border-line" />
            <Link role="menuitem" href="/account" onClick={close} className={`flex items-center gap-3 h-10 px-3 rounded-ctl text-sm hover:bg-wash ${area === "account" ? "text-primary bg-wash" : "text-muted"}`}><Icon name="user" size={16} />Account</Link>
            <Link role="menuitem" href="/account/apps" onClick={close} className="flex items-center gap-3 h-10 px-3 rounded-ctl text-sm text-muted hover:bg-wash"><Icon name="apps" size={16} />Add or remove apps</Link>
          </div>
        </>
      )}
    </div>
  );
}

function UserBlock({ email, name, collapsed, onNavigate }: { email: string; name: string; collapsed: boolean; onNavigate?: () => void }) {
  const initial = (name || email || "?").trim()[0]?.toUpperCase();
  return (
    <div className="mt-auto pt-4 border-t border-line">
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-1"}`}>
        <span aria-hidden className="grid place-items-center size-9 shrink-0 rounded-full bg-primary/10 text-primary text-sm">{initial}</span>
        {!collapsed && (
          <div className="min-w-0">
            {name && <p className="text-sm truncate">{name}</p>}
            <p className="text-xs text-muted truncate" title={email}>{email}</p>
          </div>
        )}
      </div>
      <form action={signOut} className="mt-3">
        <button
          type="submit"
          title={collapsed ? "Log out" : undefined}
          aria-label="Log out"
          onClick={onNavigate}
          className={`w-full flex items-center h-10 rounded-ctl text-sm text-danger hover:bg-danger/[0.07] transition-colors ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <Icon name="logout" size={18} />
          {!collapsed && "Log out"}
        </button>
      </form>
    </div>
  );
}

type BodyProps = { area: Area; email: string; name: string; storeName: string | null; apps: AppSlug[]; collapsed: boolean; onNavigate?: () => void };

function NavBody({ area, email, name, storeName, apps, collapsed, onNavigate }: BodyProps) {
  const path = usePathname();
  return (
    <>
      <AppSwitcher area={area} enabled={apps} collapsed={collapsed} onNavigate={onNavigate} />
      <nav aria-label="Primary" className="space-y-1">
        {areaNav(area).map((n) => (
          <NavItem key={n.href} item={n} active={!n.external && isNavActive(path, n.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      {area === "export" && !collapsed && (
        <div className="mt-6 px-3 text-xs text-muted">
          <span className="block">Store</span>
          <Link href="/export/stores" onClick={onNavigate} className="block text-ink truncate hover:text-primary">{storeName ?? "None connected"}</Link>
        </div>
      )}
      <UserBlock email={email} name={name} collapsed={collapsed} onNavigate={onNavigate} />
    </>
  );
}

export function Sidebar(props: Omit<BodyProps, "collapsed" | "onNavigate">) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  return (
    <aside
      aria-label="Sidebar"
      className={`hidden lg:flex shrink-0 flex-col border-r border-line bg-surface sticky top-0 h-screen p-4 transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-64"}`}
    >
      <div className={`flex items-center pt-1 pb-6 ${collapsed ? "justify-center" : "justify-between px-1"}`}>
        <Logo href={areaHome(props.area)} iconOnly={collapsed} />
        {!collapsed && (
          <button type="button" onClick={() => writeCollapsed(true)} aria-label="Collapse sidebar" title="Collapse sidebar" className="grid place-items-center size-8 rounded-ctl text-muted hover:text-ink hover:bg-wash">
            <Icon name="chevronLeft" size={18} />
          </button>
        )}
      </div>
      {collapsed && (
        <button type="button" onClick={() => writeCollapsed(false)} aria-label="Expand sidebar" title="Expand sidebar" className="mx-auto mb-4 grid place-items-center size-9 rounded-ctl text-muted hover:text-ink hover:bg-wash">
          <Icon name="chevronRight" size={18} />
        </button>
      )}
      <NavBody {...props} collapsed={collapsed} />
    </aside>
  );
}

/** Phones and small tablets: a top bar with a menu button that opens the same navigation as a drawer. */
export function MobileBar(props: Omit<BodyProps, "collapsed" | "onNavigate">) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between px-4 h-14">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="grid place-items-center size-10 -ml-2 rounded-ctl text-ink hover:bg-wash">
          <Icon name="menu" size={22} />
        </button>
        <Logo href={areaHome(props.area)} />
        <span className="w-8" />
      </div>
      {open && (
        <div className="fixed inset-0 z-40">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-surface p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between pt-1 pb-6 px-1">
              <Logo href={areaHome(props.area)} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid place-items-center size-9 rounded-ctl text-muted hover:text-ink hover:bg-wash"><Icon name="close" size={20} /></button>
            </div>
            <NavBody {...props} collapsed={false} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
