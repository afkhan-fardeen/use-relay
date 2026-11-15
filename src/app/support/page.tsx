import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Support — Klyroo", description: "Get help with Klyroo Context. Email support@useklyroo.com." };

export default function Support() {
  return (
    <LegalPage title="Support" intro="Email is the fastest way to reach us. A real person reads every message.">
      <Section title="Email us">
        <p><A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A></p>
        <p>We aim to reply within 2 business days, Monday to Friday.</p>
      </Section>
      <Section title="What to include">
        <UL items={[
          "The web address of your store.",
          "Your plan, if you have one.",
          "What you tried and what you expected. A screenshot helps.",
          "Which AI tool you are connecting, if the question is about connecting.",
        ]} />
        <p>Please do not send a password or an access token.</p>
      </Section>
      <Section title="Early access">
        <p>Klyroo Context is in early access. To ask for access, email us with the subject “Early access” and the web address of the store you want to try.</p>
      </Section>
      <Section title="Docs">
        <p>Most questions are answered in the <A href="/docs">documentation</A>, starting with <A href="/docs/getting-started">getting started</A> and <A href="/docs/troubleshooting">troubleshooting</A>.</p>
      </Section>
      <Section title="Billing">
        <p>Paddle handles payment. See <A href="/pricing">pricing</A> and <A href="/refunds">billing and refunds</A>.</p>
      </Section>
      <Section title="Data requests and blocking KlyrooBot">
        <p>Questions about data we hold, or requests to stop us reading a site, go to the same address. See the <A href="/privacy">privacy policy</A> and the <A href="/bot">KlyrooBot page</A>.</p>
      </Section>
    </LegalPage>
  );
}
