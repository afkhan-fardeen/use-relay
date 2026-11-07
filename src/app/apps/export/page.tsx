import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, Feature, PlanGrid, SectionHead, Steps, TrustRow } from "@/components/marketing-blocks";
import { Button, Chip } from "@/components/ui";
import { resources, templates } from "@/lib/export";

export const metadata = {
  title: "Klyroo Export — Shopify data to spreadsheets",
  description: "Export Shopify products, orders, customers, inventory and collections to CSV. Hundreds of columns, a live preview, ready-made templates and read-only access.",
};

const COLUMNS = resources.reduce((n, r) => n + r.fields.length, 0);

export default function ExportLanding() {
  return (
    <div className="flex-1">
      <MarketingHeader tool="Export" anchors={[{ href: "#features", label: "Features" }, { href: "#how", label: "How it works" }, { href: "#pricing", label: "Pricing" }, { href: "/docs/export/getting-started", label: "Docs" }]} />

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 text-center">
        <Chip tone="info">Klyroo Export · for Shopify</Chip>
        <h1 className="mt-6 mx-auto max-w-[860px] text-[40px] sm:text-[56px] leading-[1.05] tracking-[-0.025em] font-light">
          Every Shopify export, <span className="text-primary">ready in minutes.</span>
        </h1>
        <p className="mt-6 mx-auto max-w-[640px] text-[18px] leading-[28px] text-muted">
          Products, orders, customers, inventory and collections to CSV. Pick a template or choose your own columns, check a live preview, and download. No code, no API.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/login?app=export" className="w-full sm:w-auto">Start free</Button>
          <Button href="#pricing" variant="secondary" className="w-full sm:w-auto">See pricing</Button>
        </div>
        <div className="mt-7 flex justify-center"><TrustRow items={["Read-only access", "No card needed", "30-day money-back"]} /></div>
      </section>

      <section id="features" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="What you get" title={`${COLUMNS}+ columns, and the right ones in two clicks.`} sub="Everything Shopify holds about your catalog and orders, laid out the way your team, your 3PL or your accountant needs it." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon="list" title={`${templates.length} ready-made templates`}>Orders for your 3PL, a full catalog, inventory by location, customer lists and more. Pick one and run it.</Feature>
          <Feature icon="plus" title="Build your own">Choose the data, filter it, pick, reorder and rename the columns to match the system that will read the file.</Feature>
          <Feature icon="history" title="Live preview">See real rows from your store before you export, so you know the file is right before you run it.</Feature>
          <Feature icon="store" title="Built for big stores">Exports run in the background and finish even on large stores. Leave the page and come back to History.</Feature>
          <Feature icon="apps" title="Metafields included">Add any product, variant, order, customer or collection metafield as a column on every plan.</Feature>
          <Feature icon="download" title="Read-only and private">We only read your store. Files are private, download links are short-lived, and files are deleted after 7 days.</Feature>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Templates" title="Start from the job, not the field list." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-line rounded-card p-6 bg-surface">
              <p className="text-sm text-primary">{t.category}</p>
              <h3 className="mt-3 text-[17px] font-normal">{t.name}</h3>
              <p className="mt-2 text-sm text-muted">{t.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="How it works" title="From connect to first file in three minutes." />
        <div className="mt-12">
          <Steps items={[
            ["Connect your store", "Create a read-only app in Shopify and paste its credentials. About two minutes."],
            ["Pick a template", "Start from a ready-made export or build your own, and check the preview."],
            ["Download your file", "Run the export and download the CSV when it's ready. It's kept in History for 7 days."],
          ]} />
          <p className="mt-6 text-sm text-muted">Need help connecting? Read the <Link href="/docs/export/connect-shopify" className="text-primary">connection guide</Link>.</p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Pricing" title="Pay for stores and export size. Nothing else." sub="Every plan has every column and every template. Plans differ only by how many stores you connect and how many rows an export can have." />
        <div className="mt-12"><PlanGrid app="export" /></div>
      </section>

      <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Questions" title="Good to know." center />
        <div className="mt-12">
          <Faq items={[
            ["Will it change anything in my store?", "No. Klyroo Export only reads data. The credentials you create have read-only permissions."],
            ["What counts as a row?", "One row in the file. Products export one row per variant, and orders export one row per line item."],
            ["What if my export is bigger than my plan allows?", "The export stops with a clear message. You can narrow it with filters, or upgrade for a higher limit."],
            ["Can I export orders older than 60 days?", "Yes, if you add the optional read_all_orders permission to your Shopify app."],
            ["How long are my files kept?", "7 days. After that they're deleted automatically."],
            ["Do the plans have different features?", "No. Only the number of stores and the rows per export differ."],
          ]} />
        </div>
      </section>

      <CtaBand title="Stop copy-pasting from Shopify." sub="Connect a store and run your first export for free." href="/login?app=export" label="Start free" />
      <MarketingFooter />
    </div>
  );
}
