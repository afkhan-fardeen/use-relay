import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { Magnetic } from "@/components/kit/magnetic";
import { Particles } from "@/components/kit/particles";
import { Reveal } from "@/components/kit/reveal";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, Feature, PlanGrid, ProductShot, SectionHead, Steps, TrustRow } from "@/components/marketing-blocks";
import { Button, Chip } from "@/components/ui";
import { CTA as cta, FEATURES, PRODUCT, TEMPLATES } from "@/lib/product";
import { organizationLd, softwareLd, websiteLd } from "@/lib/seo";

export const metadata = {
  title: "Klyroo Data Exporter: Shopify data as clean Excel and CSV files",
  description: "Export Shopify products, inventory and metafields to Excel or CSV from inside your Shopify Admin. Live preview, ready-made templates, read-only access.",
  alternates: { canonical: "/data-exporter" },
};

export default function Home() {
  return (
    <div className="flex-1">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <JsonLd data={softwareLd({ name: PRODUCT.name, description: PRODUCT.tagline, path: "/data-exporter", category: "BusinessApplication", low: 0, high: 249, features: FEATURES.map((f) => f.title) })} />
      <MarketingHeader anchors={[{ href: "#features", label: "Features" }, { href: "#how", label: "How it works" }, { href: "#pricing", label: "Pricing" }, { href: "/docs", label: "Docs" }]} />
      <main>
        <section className="relative overflow-hidden"><div className="particles-in absolute inset-0"><Particles /></div><div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 text-center">
          <div className="anim-fade-up"><Chip tone="outline">A Shopify app by Klyroo</Chip></div>
          <h1 className="mt-6 mx-auto max-w-[900px] text-[44px] sm:text-[72px] leading-[1.05] tracking-[-0.04em] font-normal">
            Your Shopify data, <span className="text-muted">as clean spreadsheets.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-[680px] text-[18px] leading-[28px] text-muted">
            Klyroo Data Exporter lives inside your Shopify Admin. Export products, variants, inventory by location and metafields to Excel or CSV, check a live preview first, and download in minutes.
          </p>
          <div className="anim-fade-up delay-3 mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Magnetic><Button href={cta.href} className="w-full sm:w-auto">{cta.label}</Button></Magnetic>
            <Button href="#how" variant="secondary" className="w-full sm:w-auto">See how it works</Button>
          </div>
          <div className="mt-7 flex justify-center"><TrustRow items={["Read-only access", "Free plan", "Free on development stores"]} /></div>
        </div>
        </section>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-20">
          <ProductShot src="/product/builder.png" alt="The Klyroo Data Exporter inside Shopify Admin: choose what to export, add filters and columns, and see a live preview of real rows from your store before you run it." priority />
          <p className="mt-5 text-center text-sm text-muted">The export builder, with a live preview of rows from your store. Sample data shown.</p>
        </Reveal>

        <Reveal as="section" id="features" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
          <SectionHead eyebrow="What you get" title="Built for the people who run the catalog." sub="Everything is chosen in Shopify Admin, so there is nothing to install on your computer and no code to write." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => <Feature key={f.title} icon={f.icon} title={f.title}>{f.text}</Feature>)}
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
          <SectionHead eyebrow="Templates" title="Start from the job, not the field list." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => (
              <div key={t.name} className="border border-line rounded-card p-6 bg-surface">
                <p className="text-sm text-muted">{t.category}</p>
                <h3 className="mt-3 text-[17px] font-normal">{t.name}</h3>
                <p className="mt-2 text-sm text-muted">{t.blurb}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" id="how" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
          <SectionHead eyebrow="How it works" title="From install to first file in minutes." />
          <div className="mt-12">
            <Steps items={[
              ["Install the app", "Add Klyroo Data Exporter from the Shopify App Store. It asks for read-only access to products, inventory and locations."],
              ["Pick a template and preview", "Start from a ready-made export or build your own. The preview shows real rows from your store."],
              ["Download your file", "Press Run export. Large exports run in the background, and the finished file waits in Export history for 7 days."],
            ]} />
            <p className="mt-6 text-sm text-muted">Read the <Link href="/docs/getting-started" className="underline underline-offset-4">getting started guide</Link>.</p>
          </div>
        </Reveal>

        <Reveal as="section" id="pricing" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
          <SectionHead eyebrow="Pricing" title="Pay for the size of your exports." sub="Every plan includes the same templates and the live preview. Plans differ by rows per export and a few advanced features." />
          <div className="mt-12"><PlanGrid cta={cta} /></div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[900px] px-4 sm:px-6 py-20 border-t border-line">
          <SectionHead eyebrow="Questions" title="Good to know." center />
          <div className="mt-12">
            <Faq items={[
              ["Will it change anything in my store?", "No. The app only reads products, inventory, locations and metafields. It never writes to your store."],
              ["Does it see my customers' personal data?", "No. Version 1 exports products, inventory and collections only. We do not store customer personal information."],
              ["What counts as a row?", "One row in the file. Products export one row per variant."],
              ["What if my export is bigger than my plan allows?", "It stops with a clear message. You can narrow it with filters (status, vendor, collection) or upgrade for a higher limit."],
              ["How long are my files kept?", "7 days, then they are deleted automatically."],
              ["How is it billed?", "By Shopify, on your normal Shopify invoice. It is free on development stores."],
            ]} />
          </div>
        </Reveal>

        <CtaBand title="Stop copy-pasting from Shopify." sub="Get clean spreadsheets of your catalog in minutes." href={cta.href} label={cta.label} />
      </main>
      <MarketingFooter />
    </div>
  );
}
