import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Billing, cancellation and refunds — Klyroo", description: "How billing, cancellation and refunds work for Klyroo Context." };

export default function Refunds() {
  return (
    <LegalPage title="Billing, cancellation and refunds" intro="Payments for Klyroo Context are handled by Paddle. This page explains what that means for you.">
      <Section title="How billing works">
        <UL items={[
          "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.",
          "Paid plans are subscriptions, billed monthly or, if you choose, yearly, in US dollars. Prices exclude taxes, which Paddle adds where required.",
          "You pay at Paddle's checkout. We never see or store your card details.",
          "The free preview costs nothing and needs no card.",
        ]} />
      </Section>
      <Section title="Cancelling">
        <p>You can cancel at any time from your account, or by emailing us. Cancellation takes effect at the end of the period you have already paid for, and you keep access until then. We do not charge cancellation fees.</p>
      </Section>
      <Section title="Refunds">
        <p>If the Service is not right for you, ask for a refund within 14 days of your first payment for a plan and we will refund it. After that, we do not refund periods that have already started, unless the law requires it or the Service failed to work as described. Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with the email address you paid with. We reply within 2 business days. You can also contact Paddle directly about an order.</p>
      </Section>
      <Section title="Price changes">
        <p>We tell you before a price changes, and a new price applies from your next renewal after the notice.</p>
      </Section>
      <Section title="Related">
        <p>See the <A href="/pricing">pricing page</A> and our <A href="/terms">terms of service</A>.</p>
      </Section>
    </LegalPage>
  );
}
