import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { CountUp } from "@/components/kit/count-up";
import { ExportDemo } from "@/components/kit/export-demo";
import { Magnetic } from "@/components/kit/magnetic";
import { Marquee } from "@/components/kit/marquee";
import { Particles } from "@/components/kit/particles";
import { Reveal } from "@/components/kit/reveal";
import { Spotlight } from "@/components/kit/spotlight";
import { SplitText } from "@/components/kit/split-text";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Feature, SectionHead } from "@/components/marketing-blocks";
import { Button } from "@/components/ui";
import { CTA, PRODUCT } from "@/lib/product";
import { organizationLd, websiteLd } from "@/lib/seo";

export const metadata = {
  title: "Klyroo: Shopify apps that keep it simple",
  description: "Klyroo is a company that makes Shopify apps. Simple, focused apps that do one job well, starting with Klyroo Data Exporter.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex-1">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div className="particles-in absolute inset-0"><Particles /></div>
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 pt-24 sm:pt-40 pb-28 sm:pb-44">
            <h1 className="max-w-[1100px] text-[44px] sm:text-[80px] leading-[1.02] tracking-[-0.045em] font-normal">
              <span className="sr-only">We make Shopify apps. Simple ones.</span>
              <span aria-hidden="true"><SplitText text="We make Shopify apps." /><br /><SplitText text="Simple ones." className="text-muted" start={4} /></span>
            </h1>
            <p className="anim-fade-up delay-4 mt-8 max-w-[600px] text-[18px] leading-[28px] text-muted">
              Klyroo is a small company with a plain idea: a good Shopify app does one job, does it well, and stays out of your way. No bloat, no setup marathon, no surprises on the invoice.
            </p>
            <div className="anim-fade-up delay-4 mt-10 flex flex-col sm:flex-row gap-3">
              <Magnetic><Button href="#apps">See our apps</Button></Magnetic>
              <Magnetic><Button href="/contact" variant="secondary">Get in touch</Button></Magnetic>
            </div>
          </div>
        </section>

        <Marquee items={["Products", "Variants", "Inventory", "Collections", "Metafields", "Excel", "CSV"]} />

        <Reveal as="section" id="apps" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="Our apps" title="Built for the people who run the store." />
          <Spotlight className="mt-12 rounded-card">
            <Link href="/data-exporter" className="lift grid gap-10 md:grid-cols-[1.1fr_1fr] rounded-card border border-line bg-surface p-8 sm:p-12">
              <div>
                <p className="text-sm text-muted">Data · Reporting</p>
                <h3 className="mt-3 text-[32px] leading-[1.1] tracking-[-0.03em]">{PRODUCT.name}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-[27px] text-muted">{PRODUCT.tagline} Pick a template, check a live preview, and download in minutes, right inside your Shopify Admin.</p>
                <ul className="mt-8 space-y-2 text-[15px]">
                  {["Excel and CSV files that open cleanly", "Read-only access, nothing changes in your store", "Free plan, and free on development stores"].map((t) => (
                    <li key={t} className="border-t border-line-strong pt-2">{t}</li>
                  ))}
                </ul>
                <span className="mt-8 inline-block underline underline-offset-4">Learn more</span>
              </div>
              <div className="self-center"><ExportDemo /></div>
            </Link>
          </Spotlight>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <dl className="grid gap-10 sm:grid-cols-3">
            {[
              [<CountUp key="a" to={0} />, "customer records stored"],
              [<CountUp key="b" to={7} suffix=" days" />, "and export files are deleted"],
              [<CountUp key="c" to={1000000} />, "rows in a single export, on Plus"],
            ].map(([n, l], i) => (
              <div key={i} className="border-t border-primary pt-5">
                <dt className="text-[56px] sm:text-[72px] leading-none tracking-[-0.045em]">{n}</dt>
                <dd className="mt-3 text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="How we build" title="Three rules for every app we ship." />
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            <Feature icon="list" title="One job, done well">Each app solves a single problem completely, instead of ten problems halfway.</Feature>
            <Feature icon="store" title="Respect the store">We ask only for the access an app needs. Our first app is read-only and stores no customer data.</Feature>
            <Feature icon="download" title="Honest pricing">Clear plans, billed by Shopify, with a free way to try. Cancel from your admin at any time.</Feature>
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="Talk to us" title="Real people answer." sub="Questions, ideas for an app, or help with an export: write to us and a person replies within two business days." />
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button href="/support" variant="secondary">Contact support</Button>
            <Button href="/docs" variant="tertiary">Read the docs</Button>
          </div>
        </Reveal>

        <CtaBand title="Try Klyroo Data Exporter." sub="Clean spreadsheets of your store, in minutes." href={CTA.href} label={CTA.label} />
      </main>
      <MarketingFooter />
    </div>
  );
}
