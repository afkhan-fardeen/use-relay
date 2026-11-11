import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Billing, cancellation and refunds — Klyroo", description: "How billing, cancellation and refunds work for Klyroo Data Exporter." };

export default function Refunds() {
  return (
    <LegalPage title="Billing, cancellation and refunds" intro="Klyroo apps are billed through Shopify. This page explains what that means for you.">
      <Section title="How billing works">
        <UL items={[
          "Paid plans are monthly subscriptions, charged by Shopify every 30 days in US dollars, on your normal Shopify invoice.",
          "You approve each plan on Shopify's own approval page before any charge. We never see or store your payment details.",
          "The free plan costs nothing, and the app is free on Shopify development stores.",
        ]} />
      </Section>
      <Section title="Cancelling">
        <p>Open <strong className="font-normal">Plans</strong> in the app and move to the Free plan, or uninstall the app from your Shopify admin. Billing stops as Shopify describes at the time. You keep access to the paid features until the end of the period Shopify has already charged for, where Shopify allows it.</p>
      </Section>
      <Section title="Refunds">
        <p>Because Shopify collects the payment, refunds are issued by Shopify under its own app billing policy. If the app did not work as described, a charge was wrong, or you were billed after cancelling, email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with your store address. We will look into it within 2 business days and, where it is fair, ask Shopify to refund or credit you.</p>
      </Section>
      <Section title="Price changes">
        <p>We tell you before a price changes, and a new price applies only after you approve it in Shopify.</p>
      </Section>
      <Section title="Related">
        <p>See the <A href="/pricing">pricing page</A> and our <A href="/terms">terms of service</A>.</p>
      </Section>
    </LegalPage>
  );
}
