import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Support — Klyroo", description: "Get help with Klyroo Data Exporter. Email support@useklyroo.com." };

export default function Support() {
  return (
    <LegalPage title="Support" intro="Email is the fastest way to reach us. A real person reads every message.">
      <Section title="Email us">
        <p><A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A></p>
        <p>We aim to reply within 2 business days, Monday to Friday. Anything that stops your exports from running is handled first.</p>
      </Section>
      <Section title="What to include">
        <UL items={[
          "Your .myshopify.com store address.",
          "Your plan, if you know it.",
          "What you tried to export and what you expected. For a failed export, the reason shown in Export history helps.",
          "A screenshot, if it makes things clearer.",
        ]} />
        <p>Please do not send a password or an access token.</p>
      </Section>
      <Section title="Early access">
        <p>Klyroo Data Exporter is not on the Shopify App Store yet. To ask for early access, email us from the address you would like to use, with your .myshopify.com store address and the subject “Early access”.</p>
      </Section>
      <Section title="Docs">
        <p>Most setup questions are answered in the <A href="/docs">documentation</A>, starting with <A href="/docs/getting-started">getting started</A> and <A href="/docs/troubleshooting">troubleshooting</A>.</p>
      </Section>
      <Section title="Billing">
        <p>Shopify bills paid plans on your store invoice. See <A href="/pricing">pricing</A> and <A href="/refunds">billing and refunds</A>.</p>
      </Section>
      <Section title="Data requests">
        <p>Questions about data we hold go to the same address. See the <A href="/privacy">privacy policy</A>.</p>
      </Section>
    </LegalPage>
  );
}
