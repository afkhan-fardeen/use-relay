import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, PlanGrid, SectionHead } from "@/components/marketing-blocks";
import { CTA } from "@/lib/product";

export const metadata = { title: "Pricing — Klyroo Context", description: "Klyroo Context plans from free. Prices in US dollars per month. Payments handled by Paddle." };

export default function Pricing() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-6 text-center">
          <h1 className="text-[40px] sm:text-[52px] leading-[1.08] tracking-[-0.025em] font-normal">Simple pricing for Klyroo Context</h1>
          <p className="mt-5 mx-auto max-w-2xl text-[18px] leading-[28px] text-muted">
            Try a free preview on your own store. Pay when you want it to stay up to date. Prices are in US dollars per month, and you can cancel any time.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-14">
          <PlanGrid cta={CTA} />
        </section>

        <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-16 border-t border-line">
          <SectionHead eyebrow="Billing" title="Questions about paying." center />
          <div className="mt-10">
            <Faq items={[
              ["Who takes the payment?", "Paddle, our Merchant of Record. Paddle handles checkout, tax and invoices, and sends your receipt."],
              ["Is there a free plan?", "There is a free preview: one store, up to 15 pages and products, with a private link that works for 24 hours. No account or card. To keep a workspace and have it refreshed automatically, choose a paid plan."],
              ["What counts as a page or product?", "One page we read, or one product in your product list. Each plan sets how many a workspace can hold."],
              ["What is a workspace?", "One brand or market. A brand with US, UK and GCC stores uses three workspaces, so each region keeps its own prices and policies."],
              ["Can I change or cancel?", "Yes, any time. Cancelling takes effect at the end of the period you have paid for."],
              ["Is there a refund?", "Yes, within 14 days of your first payment for a plan. See billing and refunds."],
              ["When do paid plans open?", "Klyroo Context is in early access. Request access and we will tell you when paid plans open."],
            ]} />
          </div>
        </section>

        <CtaBand title="See it on your own store." sub="Build a free preview and ask your AI tool about your products." href={CTA.href} label={CTA.label} />
      </main>
      <MarketingFooter />
    </div>
  );
}
