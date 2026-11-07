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

      <Section title="Renewals and mistakes">
        <UL items={[
          "If a renewal is charged and you meant to cancel, contact us within 14 days of the charge and we will refund it, as long as you have not used the paid features in that period.",
          "If you were charged in error, or charged twice, we will refund the extra charge.",
          "If we withdraw a paid feature you are paying for, you can cancel and receive a refund for the unused period.",
        ]} />
      </Section>

      <Section title="How to ask for a refund">
        <UL items={[
          <>Request it from Paddle, our Merchant of Record, at <A href="https://paddle.net">paddle.net</A> using the email address on your order, or</>,
          <>email us at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with your order details and we will take care of it.</>,
        ]} />
        <p>Refunds are paid to your original payment method by Paddle. They include the taxes you paid and usually appear within 5 to 10 business days, depending on your bank.</p>
      </Section>

      <Section title="Cancelling">
        <p>
          You can cancel any time from the Billing page in the app or in Paddle&apos;s customer portal. When you cancel, you keep your plan until the end of the period you paid for and will not be charged again.
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
