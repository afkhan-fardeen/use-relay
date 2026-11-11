import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/kit/reveal";
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
        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-20 sm:pt-32 pb-24 sm:pb-32">
          <h1 className="anim-fade-up max-w-[960px] text-[48px] sm:text-[84px] leading-[1.02] tracking-[-0.045em] font-normal">
            We make Shopify apps.<br />
            <span className="text-muted">Simple ones.</span>
          </h1>
          <p className="anim-fade-up delay-2 mt-8 max-w-[600px] text-[18px] leading-[28px] text-muted">
            Klyroo is a small company with a plain idea: a good Shopify app does one job, does it well, and stays out of your way. No bloat, no setup marathon, no surprises on the invoice.
          </p>
          <div className="anim-fade-up delay-3 mt-10 flex flex-col sm:flex-row gap-3">
            <Button href="#apps">See our apps</Button>
            <Button href="/contact" variant="secondary">Get in touch</Button>
          </div>
        </section>

        <Reveal as="section" id="apps" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="Our apps" title="Built for the people who run the store." />
          <Link href="/data-exporter" className="lift mt-12 grid gap-8 md:grid-cols-[1.1fr_1fr] rounded-card border border-line bg-surface p-8 sm:p-12 block md:grid">
            <div>
              <p className="text-sm text-muted">Data · Reporting</p>
              <h3 className="mt-3 text-[32px] leading-[1.1] tracking-[-0.03em]">{PRODUCT.name}</h3>
              <p className="mt-4 max-w-md text-[17px] leading-[27px] text-muted">{PRODUCT.tagline} Pick a template, check a live preview, and download in minutes, right inside your Shopify Admin.</p>
              <span className="mt-8 inline-block underline underline-offset-4">Learn more</span>
            </div>
            <ul className="space-y-3 text-[15px] self-end">
              {["Excel and CSV files that open cleanly", "Live preview before you export", "Read-only access, nothing changes in your store", "Free plan, and free on development stores"].map((t) => (
                <li key={t} className="border-t border-line-strong pt-3">{t}</li>
              ))}
            </ul>
          </Link>
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
