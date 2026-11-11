import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";

export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} className="mt-12 mb-4 text-[26px] leading-[1.15] font-normal tracking-[-0.01em] scroll-mt-24">{children}</h2>
);
export const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-8 mb-3 text-[19px] leading-[1.3] font-normal">{children}</h3>;
export const P = ({ children }: { children: ReactNode }) => <p className="my-4 text-[16px] leading-[26px] text-ink/90">{children}</p>;
export const UL = ({ children }: { children: ReactNode }) => <ul className="my-4 list-disc pl-6 space-y-2 text-[16px] leading-[26px] text-ink/90">{children}</ul>;
export const Code = ({ children }: { children: ReactNode }) => <code className="rounded bg-wash px-1.5 py-0.5 text-[0.9em] font-mono text-ink">{children}</code>;
export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-primary hover:text-primary-hover underline underline-offset-2">{children}</Link>
);

/** A numbered procedure. Each step has a short title and an explanation. */
export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="my-6 space-y-5">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="grid place-items-center size-8 shrink-0 rounded-full bg-primary text-white text-sm mt-0.5">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-[17px] leading-7">{s.title}</p>
            <div className="mt-1 text-[16px] leading-[26px] text-ink/80 [&_p]:my-2">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export const Tip = ({ children }: { children: ReactNode }) => <Notice tone="info" className="my-6">{children}</Notice>;
export const Warn = ({ children }: { children: ReactNode }) => <Notice tone="warning" className="my-6">{children}</Notice>;

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-card border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-line">{head.map((h) => <th key={h} className="px-4 py-3 font-normal whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="align-top">
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">{r.map((c, j) => <td key={j} className="px-4 py-3 leading-6">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-start justify-between gap-4 rounded-card border border-line p-5 hover:border-primary/50 transition-colors">
      <span>
        <span className="block text-[17px]">{title}</span>
        <span className="mt-1 block text-sm text-muted leading-6">{sub}</span>
      </span>
      <Icon name="chevronRight" size={18} className="mt-1 shrink-0 text-muted group-hover:text-primary" />
    </Link>
  );
}
