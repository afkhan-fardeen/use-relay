import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Card, Chip } from "@/components/ui";
import { APPS } from "@/lib/apps";
import { EXPORT_PLANS, QR_PLANNED } from "@/lib/billing/plans";

export const metadata = { title: "Pricing — Klyroo", description: "Klyroo Export plans and what's planned for Klyroo QR. Prices in GBP per month." };

export default function Pricing() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-16">
        <h1 className="text-[40px] leading-[1.1] font-light">Pricing</h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-[27px] text-muted">
          Every Klyroo app has its own plan and its own billing. Pay only for the apps you use. Prices are in pounds sterling (GBP) per month. Taxes are calculated at checkout. Cancel any time.
        </p>

        <section className="mt-14">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] leading-[1.12] font-light">Klyroo Export</h2>
            <Chip>Live</Chip>
          </div>
          <p className="mt-2 text-muted">Export Shopify products, orders, customers, inventory and collections to spreadsheets.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXPORT_PLANS.map((p) => (
              <Card key={p.key} featured={p.recommended} className={`!p-6 flex flex-col ${p.recommended ? "!border-primary/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[22px] leading-[26px] font-light">{p.name}</h3>
                  {p.recommended && <Chip tone="info">Recommended</Chip>}
                </div>
                <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                <p className="mt-5 text-[40px] leading-[44px] font-normal tabular">{p.priceLabel}{p.key !== "free" && <span className="text-base font-normal text-muted"> /mo</span>}</p>
                <ul className="mt-6 space-y-3 text-[15px] text-muted flex-1">
                  {p.features.map((f) => (
                    <li key={f.text} className="flex gap-3">
                      <span aria-hidden className={f.soon ? "text-muted" : "text-primary"}>{f.soon ? "○" : "✓"}</span>
                      <span>{f.text}{f.soon && <span className="ml-2 text-[11px] text-secondary">Soon</span>}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={p.recommended ? "primary" : "secondary"} href="/login?app=export" className="mt-8 w-full">{p.key === "free" ? "Start free" : `Choose ${p.name}`}</Button>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">Items marked “Soon” are on the roadmap and are not included yet.</p>
        </section>

        <section className="mt-20 pt-14 border-t border-line">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] leading-[1.12] font-light">Klyroo QR</h2>
            <Chip tone="info">Preview</Chip>
          </div>
          <p className="mt-2 text-muted">{APPS.find((a) => a.slug === "qr")!.tagline} Free while in preview. The plans below are planned and open at launch.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {QR_PLANNED.map((p) => (
              <Card key={p.key} featured={p.recommended} className={`!p-6 flex flex-col ${p.recommended ? "!border-primary/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[22px] leading-[26px] font-light">{p.name}</h3>
                  <Chip tone="outline">Planned</Chip>
                </div>
                <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                <p className="mt-5 text-[40px] leading-[44px] font-normal tabular">{p.priceLabel}{p.key !== "free" && <span className="text-base font-normal text-muted"> /mo</span>}</p>
                <ul className="mt-6 space-y-3 text-[15px] text-muted flex-1">
                  {p.features.map((f) => (
                    <li key={f.text} className="flex gap-3"><span aria-hidden className="text-muted">○</span><span>{f.text}</span></li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">Not yet for sale. If a code passes its scan limit it keeps working, and we ask you to upgrade. <Link href="/apps/qr" className="text-primary">See Klyroo QR</Link>.</p>
        </section>

        <p className="mt-16 text-sm text-muted max-w-2xl">
          Payments are processed by Paddle, our Merchant of Record. See our <Link href="/refunds" className="text-primary">refund policy</Link> (30-day money-back guarantee) and <Link href="/terms" className="text-primary">terms</Link>.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
