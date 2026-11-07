import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, PlanGrid, SectionHead } from "@/components/marketing-blocks";

export const metadata = { title: "Pricing — Klyroo", description: "Klyroo Export and Klyroo QR plans. Prices in GBP per month. Each app has its own plan. Cancel any time." };

export default function Pricing() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-6 text-center">
          <h1 className="text-[40px] sm:text-[52px] leading-[1.08] tracking-[-0.025em] font-light">Simple pricing, separate per app</h1>
          <p className="mt-5 mx-auto max-w-2xl text-[18px] leading-[28px] text-muted">
            Pay only for the apps you use. Prices are in pounds sterling (GBP) per month, taxes are added at checkout, and you can cancel any time. Every first purchase has a 30-day money-back guarantee.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-14">
          <SectionHead eyebrow="Klyroo Export" title="For your Shopify data." sub="Plans differ only by the number of stores and the rows in each export." />
          <div className="mt-10"><PlanGrid app="export" /></div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-14 border-t border-line">
          <SectionHead eyebrow="Klyroo QR" title="For QR codes." sub="Static codes are free. Dynamic links add editable destinations, scan analytics and custom short link names." />
          <div className="mt-10"><PlanGrid app="qr" /></div>
          <p className="mt-4 text-sm text-muted max-w-3xl">If you pass your monthly scan limit, your codes keep working and we invite you to upgrade. We never switch off a printed code.</p>
        </section>

        <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-16 border-t border-line">
          <SectionHead eyebrow="Billing" title="Questions about paying." center />
          <div className="mt-10">
            <Faq items={[
              ["Who takes the payment?", "Paddle, our Merchant of Record. Paddle handles payment, tax and invoices. Our checkout shows the exact price, including tax, before you pay."],
              ["Can I cancel?", "Yes, any time from the app's Billing page or Paddle's customer portal. You keep your plan until the end of the period you paid for."],
              ["Can I get a refund?", <>Yes. Every first purchase has a 30-day money-back guarantee. See the <Link href="/refunds" className="text-primary">refund policy</Link>.</>],
              ["Do I pay once for everything?", "No. Each Klyroo app has its own plan and its own billing, so you only pay for what you use."],
              ["Can I change plan later?", "Yes. You can move up or down at any time. Upgrades are prorated by Paddle."],
            ]} />
          </div>
        </section>

        <CtaBand title="Start free. Upgrade when you need to." href="/login" label="Create your account" />
      </main>
      <MarketingFooter />
    </div>
  );
}
