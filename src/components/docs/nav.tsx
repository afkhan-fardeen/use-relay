"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

export type NavGroup = { title: string; items: { slug: string; title: string }[] };

export function DocsNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const body = (
    <nav aria-label="Documentation" className="space-y-7 text-sm">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 text-muted">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const href = `/docs/${i.slug}`;
              const active = path === href;
              return (
                <li key={i.slug}>
                  <Link href={href} aria-current={active ? "page" : undefined} className={`block rounded-ctl px-3 py-2 leading-5 ${active ? "bg-wash text-primary" : "text-ink/80 hover:bg-wash hover:text-ink"}`}>{i.title}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
  return (
    <>
      <details className="lg:hidden mb-8 rounded-card border border-line group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          Browse the guides
          <Icon name="chevronDown" size={18} className="text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-5">{body}</div>
      </details>
      <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-4">{body}</aside>
    </>
  );
}
