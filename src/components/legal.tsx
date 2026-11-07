import type { ReactNode } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { COMPANY } from "@/lib/company";

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main className="mx-auto max-w-[760px] px-6 py-16">
        <h1 className="text-[36px] leading-[1.1] font-light">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated {COMPANY.policiesUpdated}</p>
        {intro && <p className="mt-6 text-[17px] leading-[27px] text-muted">{intro}</p>}
        <div className="mt-10 space-y-8">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function Section({ n, title, children }: { n?: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[22px] leading-[1.25] font-light">{n ? `${n}. ` : ""}{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[24px] text-ink/90">{children}</div>
    </section>
  );
}

export const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((i, idx) => <li key={idx}>{i}</li>)}
  </ul>
);

export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="text-primary hover:text-primary-hover underline underline-offset-2">{children}</a>
);
