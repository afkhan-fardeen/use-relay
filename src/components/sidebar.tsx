"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { signOut } from "@/app/login/actions";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ACCOUNT_NAV, appInfo, isNavActive, type AppNavItem, type AppSlug } from "@/lib/apps";

type Area = AppSlug | "account";
const areaName = (a: Area) => (a === "account" ? "Account" : appInfo(a).fullName);
const areaNav = (a: Area): AppNavItem[] => (a === "account" ? ACCOUNT_NAV : appInfo(a).nav);
const areaHome = (a: Area) => (a === "account" ? "/account" : appInfo(a).href);

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

/** Names the current area. (One app today, so there is nothing to switch.) */
function AreaHeader({ area, collapsed }: { area: Area; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mb-5 px-3">
      <span className="block text-xs text-muted leading-4">{area === "account" ? "Klyroo" : "App"}</span>
      <span className="block text-sm leading-5 truncate">{areaName(area)}</span>
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

type BodyProps = { area: Area; email: string; name: string; storeName: string | null; collapsed: boolean; onNavigate?: () => void };

function NavBody({ area, email, name, storeName, collapsed, onNavigate }: BodyProps) {
  const path = usePathname();
  return (
    <>
      <AreaHeader area={area} collapsed={collapsed} />
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
