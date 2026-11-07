import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Contact — Klyroo", description: "Contact Klyroo support." };

export default function Contact() {
  return (
    <LegalPage title="Contact us" intro="We read every message. Email is the fastest way to reach us.">
      <Section title="Support">
        <p>
          <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>
        </p>
        <p>Include your account email and, if it&apos;s about an export, the name of the export and what you expected. Please never send passwords or Shopify secrets.</p>
      </Section>
      <Section title="Billing and refunds">
        <p>
          Payments are handled by Dodo Payments, our Merchant of Record. For invoices, use the customer portal on your app&apos;s Billing page. For refunds, email us. See our <A href="/refunds">refund policy</A>.
        </p>
      </Section>
      <Section title="Company">
        <p>{operatorName()}{COMPANY.registeredAddress ? `, ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? `, ${COMPANY.country}` : ""}</p>
      </Section>
    </LegalPage>
  );
}
