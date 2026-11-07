import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Card, Chip, Eyebrow } from "@/components/ui";
import { APPS } from "@/lib/apps";

export default function Home() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-16 text-center">
        <Chip tone="info">Klyroo</Chip>
        <h1 className="mt-8 mx-auto max-w-[860px] text-[40px] sm:text-[56px] leading-[1.08] tracking-[-0.02em] font-light">
          Small, sharp tools for ecommerce teams.
        </h1>
        <p className="mt-6 mx-auto max-w-[620px] text-[17px] leading-[27px] text-muted">
          Klyroo makes focused apps that each do one job well. Use one or several. Every app works on its own, with its own plan.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/login">Create your account</Button>
          <Button variant="secondary" href="#apps">See the apps</Button>
        </div>
      </section>

      <section id="apps" className="mx-auto max-w-[1200px] px-6 py-20 border-t border-line">
        <Eyebrow>Apps</Eyebrow>
        <h2 className="mt-4 text-[32px] leading-[1.1] font-light">Pick the one you need.</h2>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          {APPS.map((a) => (
            <Card key={a.slug} featured className="!p-8 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-[26px] leading-[1.12] font-light">{a.fullName}</h3>
                {a.status === "live" ? <Chip>Live</Chip> : <Chip tone="info">Preview</Chip>}
              </div>
              <p className="mt-3 text-muted">{a.tagline}</p>
              <ul className="mt-6 space-y-2 text-sm text-muted flex-1">
                {a.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-primary">✓</span>{p}</li>)}
              </ul>
              <div className="mt-8 flex items-center gap-5">
                <Button href={`/login?app=${a.slug}`}>Start with {a.name}</Button>
                <Link href={a.marketing} className="text-sm text-primary hover:text-primary-hover">Learn more →</Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20 border-t border-line">
        <Eyebrow>How it works</Eyebrow>
        <ol className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            ["01", "Create one account", "One login for everything Klyroo."],
            ["02", "Choose an app", "Start with the one you came for. Add another any time."],
            ["03", "Pay only for what you use", "Every app has its own plan and its own billing."],
          ].map(([n, t, d]) => (
            <li key={n} className="border border-line rounded-card p-8">
              <span className="text-primary text-sm">{n}</span>
              <h3 className="mt-6 text-[22px] leading-[26px] font-light">{t}</h3>
              <p className="mt-3 text-[15px] leading-6 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-[1200px] px-6 py-20 border-t border-line">
        <Eyebrow>Why Klyroo</Eyebrow>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            ["Read-only by design", "Klyroo Export only reads your Shopify data. It never changes your store."],
            ["Private by default", "Credentials are encrypted. Export files are private and deleted after 7 days."],
            ["Real people", "Questions go to a real inbox. We reply within one working day."],
          ].map(([t, d]) => (
            <div key={t} className="border border-line rounded-card p-8">
              <h3 className="text-[22px] leading-[26px] font-light">{t}</h3>
              <p className="mt-3 text-[15px] leading-6 text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <Card featured className="!p-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-[26px] leading-[1.12] font-light">Simple, separate pricing</h2>
            <p className="mt-2 text-muted max-w-xl">Klyroo Export starts free, with paid plans from £19 a month. Klyroo QR is free while in preview. Each app has its own plan.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button href="/pricing">See pricing</Button>
            <Link href="/contact" className="text-sm text-primary hover:text-primary-hover">Contact us →</Link>
          </div>
        </Card>
      </section>
      <MarketingFooter />
    </div>
  );
}
