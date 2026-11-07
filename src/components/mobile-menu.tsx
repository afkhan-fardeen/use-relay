"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";

/** The public site's menu on phones: a button that opens a full-width panel. */
export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
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
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="grid place-items-center size-10 rounded-ctl text-ink hover:bg-wash">
        <Icon name={open ? "close" : "menu"} size={22} />
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 bg-canvas overflow-y-auto border-t border-line">
          <nav aria-label="Mobile" className="px-4 py-6 flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex items-center justify-between h-14 border-b border-line text-[17px]">
                {n.label}
                <Icon name="chevronRight" size={18} className="text-muted" />
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className="flex items-center justify-between h-14 border-b border-line text-[17px]">Contact<Icon name="chevronRight" size={18} className="text-muted" /></Link>
            <div className="mt-8 grid gap-3">
              <Button href="/login" onClick={() => setOpen(false)} className="w-full">Start free</Button>
              <Button href="/login" variant="secondary" onClick={() => setOpen(false)} className="w-full">Log in</Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
