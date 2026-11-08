import type { ReactNode } from "react";

/** One consistent table: horizontal scroll on small screens, quiet header, hover rows. */
export function DataTable({ head, children, caption }: { head: { label: string; className?: string }[]; children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="text-left text-muted border-b border-line">
            {head.map((h) => <th key={h.label} scope="col" className={`px-5 py-3 font-normal whitespace-nowrap ${h.className ?? ""}`}>{h.label}</th>)}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:last-child]:border-0 [&>tr]:transition-colors [&>tr:hover]:bg-wash/60 [&_td]:px-5 [&_td]:py-3.5 align-top">{children}</tbody>
      </table>
    </div>
  );
}
