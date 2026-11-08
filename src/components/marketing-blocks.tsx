import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Button, Card, Chip } from "@/components/ui";
import type { AppSlug } from "@/lib/apps";
import { PLAN_COMMON, PLANS } from "@/lib/billing/plans";

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}>
      {eyebrow && <p className="text-sm text-primary">{eyebrow}</p>}
      <h2 className="mt-2 text-[30px] sm:text-[36px] leading-[1.1] font-light tracking-[-0.02em]">{title}</h2>
      {sub && <p className="mt-4 text-[17px] leading-[27px] text-muted">{sub}</p>}
    </div>
  );
}

export function Feature({ icon, title, children }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; children: ReactNode }) {
  return (
    <div className="lift rounded-card border border-line p-6 bg-surface">
      <span className="grid place-items-center size-10 rounded-ctl bg-primary/10 text-primary"><Icon name={icon} size={20} /></span>
      <h3 className="mt-5 text-[19px] leading-[1.3] font-light">{title}</h3>
      <p className="mt-2 text-[15px] leading-6 text-muted">{children}</p>
    </div>
  );
}

export function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="grid md:grid-cols-3 gap-4">
      {items.map(([t, d], i) => (
        <li key={t} className="rounded-card border border-line p-7 bg-surface">
          <span className="grid place-items-center size-8 rounded-full bg-primary text-white text-sm">{i + 1}</span>
          <h3 className="mt-5 text-[20px] leading-[1.25] font-light">{t}</h3>
          <p className="mt-2 text-[15px] leading-6 text-muted">{d}</p>
        </li>
      ))}
    </ol>
  );
}

export function PlanGrid({ app }: { app: AppSlug }) {
  const plans = PLANS[app];
  return (
    <div>
      <div className={`grid gap-4 ${plans.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        {plans.map((p) => (
          <Card key={p.key} lift featured={p.recommended} className={`!p-6 flex flex-col ${p.recommended ? "!border-primary/60 shadow-[0_8px_30px_rgba(83,58,253,0.10)]" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] leading-[26px] font-light">{p.name}</h3>
              {p.recommended && <Chip tone="info">Most popular</Chip>}
            </div>
            <p className="mt-1 text-sm text-muted">{p.blurb}</p>
            <p className="mt-5 text-[40px] leading-[44px] font-normal tabular">
              {p.priceLabel}
              {p.key !== "free" && <span className="text-base font-normal text-muted"> /month</span>}
            </p>
            <ul className="mt-6 space-y-3 text-[15px] flex-1">
              {p.features.map((f) => (
                <li key={f.text} className="flex gap-3"><Icon name="check" size={18} className="mt-0.5 shrink-0 text-primary" /><span>{f.text}</span></li>
              ))}
            </ul>
            <Button variant={p.recommended ? "primary" : "secondary"} href={`/login?app=${app}`} className="mt-8 w-full">
              {p.key === "free" ? "Start free" : `Choose ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted max-w-3xl">{PLAN_COMMON[app]} Prices are in GBP per month, taxes are added at checkout, and you can cancel any time.</p>
    </div>
  );
}

export function Faq({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map(([q, a]) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px]">
            {q}
            <Icon name="chevronDown" size={20} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 max-w-3xl text-[15px] leading-[24px] text-muted">{a}</div>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title, sub, href, label }: { title: string; sub?: string; href: string; label: string }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-20">
      <div className="rounded-feat bg-ink text-white px-6 py-12 sm:px-12 sm:py-16 text-center">
        <h2 className="mx-auto max-w-2xl text-[30px] sm:text-[40px] leading-[1.1] font-light tracking-[-0.02em]">{title}</h2>
        {sub && <p className="mx-auto mt-4 max-w-xl text-[17px] leading-[27px] text-white/70">{sub}</p>}
        <div className="mt-8 flex justify-center"><Button href={href}>{label}</Button></div>
      </div>
    </section>
  );
}

export function TrustRow({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-muted">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2"><Icon name="check" size={16} className="text-success" />{t}</li>
      ))}
    </ul>
  );
}

/** A real screenshot of the app inside a simple browser frame. */
export function ProductShot({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <figure className="mx-auto max-w-[1100px] overflow-hidden rounded-feat border border-line-strong/60 bg-surface shadow-[0_30px_90px_rgba(10,37,64,0.14)]">
      <div className="flex items-center gap-2 border-b border-line bg-wash/60 px-4 py-3" aria-hidden>
        <span className="size-3 rounded-full bg-[#FF5F57]" /><span className="size-3 rounded-full bg-[#FEBC2E]" /><span className="size-3 rounded-full bg-[#28C840]" />
        <span className="ml-4 hidden sm:block rounded-full bg-surface px-4 py-1 text-xs text-muted">useklyroo.com/export</span>
      </div>
      <Image src={src} alt={alt} width={2880} height={1800} sizes="(min-width: 1200px) 1100px, 100vw" priority={priority} className="h-auto w-full" />
    </figure>
  );
}
