import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY } from "@/lib/company";
import { SupportForm } from "./form";

export const metadata = { title: "Support — Klyroo", description: "Contact Klyroo support. Replies within 2 business days." };

export default function Support() {
  return (
    <LegalPage title="Support" intro="Tell us what's happening and we'll get back to you. A real person reads every message.">
      <Section title="Send us a message"><SupportForm /></Section>
      <Section title="How fast we reply">
        <p>We reply within <strong className="font-normal">2 business days</strong>, Monday to Friday. Billing problems and anything that stops your exports from running are handled first.</p>
      </Section>
      <Section title="Prefer email?">
        <p>Write to <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. See also the <A href="/docs">documentation</A>, which answers most setup questions, and the <A href="/refunds">refund policy</A>.</p>
      </Section>
    </LegalPage>
  );
}
