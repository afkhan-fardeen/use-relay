import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, PlanGrid, SectionHead } from "@/components/marketing-blocks";
import { APP_STORE_URL } from "@/lib/product";

export const metadata = { title: "Pricing — Klyroo Data Exporter", description: "Klyroo Data Exporter plans from free. Prices in US dollars per month, billed by Shopify. Free on development stores." };

const cta = APP_STORE_URL ? { href: APP_STORE_URL, label: "Install on Shopify" } : { href: "mailto:support@useklyroo.com?subject=Early%20access", label: "Request early access" };

export default function Pricing() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-6 text-center">
          <h1 className="text-[40px] sm:text-[52px] leading-[1.08] tracking-[-0.025em] font-normal">Simple pricing for Klyroo Data Exporter</h1>
          <p className="mt-5 mx-auto max-w-2xl text-[18px] leading-[28px] text-muted">
            Start free and upgrade when your exports get bigger. Prices are in US dollars per month, billed by Shopify every 30 days. You can change or cancel at any time from the app.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-14">
          <PlanGrid cta={cta} />
        </section>

        <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-16 border-t border-line">
          <SectionHead eyebrow="Billing" title="Questions about paying." center />
          <div className="mt-10">
            <Faq items={[
              ["Who takes the payment?", "Shopify. Charges appear on your normal Shopify invoice, and you approve each plan on Shopify's own approval page."],
              ["Is there a free plan?", "Yes. It exports up to 100 rows at a time as CSV, so you can try the app on a small catalog. The app is also free on Shopify development stores, with the Growth plan's limits, so agencies can test everything."],
              ["What counts as a row?", "One row in the file. Products export one row per variant."],
              ["Can I change or cancel?", "Yes, any time from the Plans page in the app. Changes are handled by Shopify."],
              ["What happens if my export is bigger than my plan allows?", "It stops with a clear message. You can narrow it with filters (status, vendor, collection) or upgrade for a higher limit."],
              ["Do the plans have different features?", "A few. Excel files and metafields start on Starter, inventory by location and variant-level metafields on Growth. Every plan has the live preview and templates."],
            ]} />
          </div>
        </section>

        <CtaBand title="Start free. Upgrade when you need to." href={cta.href} label={cta.label} />
      </main>
      <MarketingFooter />
    </div>
  );
}
