import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Refund policy — Klyroo", description: "How refunds work for Klyroo subscriptions." };

export default function Refunds() {
  return (
    <LegalPage title="Refund policy" intro="We want you to be confident trying Klyroo. If a paid plan isn't right for you, you can get your money back as described below.">
      <Section title="30-day money-back guarantee">
        <p>
          If you subscribe to a paid plan of any Klyroo app for the first time, you can ask for a full refund within <strong className="font-normal">30 days</strong> of your first payment for that app. No reason is needed.
        </p>
      </Section>

      <Section title="Free trial">
        <p>
          Every paid plan starts with a <strong className="font-normal">3-day free trial</strong>. You are not charged during the trial, and you can cancel before it ends to pay nothing. If you do not cancel, the first payment is taken when the trial ends, and the 30-day guarantee then runs from that payment.
        </p>
      </Section>

      <Section title="Renewals and mistakes">
        <UL items={[
          "If a renewal is charged and you meant to cancel, contact us within 14 days of the charge and we will refund it, as long as you have not used the paid features in that period.",
          "If you were charged in error, or charged twice, we will refund the extra charge.",
          "If we withdraw a paid feature you are paying for, you can cancel and receive a refund for the unused period.",
        ]} />
      </Section>

      <Section title="How to ask for a refund">
        <UL items={[
          <>Email us at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> from the address on your account, with the app and plan.</>,
          "We approve valid requests and Dodo Payments, our Merchant of Record, sends the refund. You do not need to contact anyone else.",
        ]} />
        <p>Refunds are paid to your original payment method by Dodo Payments. They include the taxes you paid and usually appear within 5 to 10 business days, depending on your bank.</p>
      </Section>

      <Section title="Cancelling">
        <p>
          You can cancel any time from the Billing page in the app or in the customer portal (the Billing page links to it). When you cancel, you keep your plan until the end of the period you paid for and will not be charged again.
          Each Klyroo app is billed separately, so cancelling one does not affect the others.
        </p>
      </Section>

      <Section title="Your legal rights">
        <p>This policy does not affect any rights you have under the law of your country.</p>
      </Section>

      <Section title="Questions">
        <p>Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. See also our <A href="/terms">terms of service</A>.</p>
      </Section>
    </LegalPage>
  );
}
