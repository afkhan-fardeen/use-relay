import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Contact — Klyroo", description: "Contact Klyroo support." };

export default function Contact() {
  return (
    <LegalPage title="Contact us" intro="We read every message. Email is the fastest way to reach us.">
      <Section title="Support">
        <p>
          <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>, or use the <A href="/support">support form</A>.
        </p>
        <p>We aim to reply within 2 business days, Monday to Friday.</p>
        <p>Include your store address (your-store.myshopify.com) and, if it&apos;s about an export, what you expected. Please never send passwords or Shopify secrets.</p>
      </Section>
      <Section title="Billing">
        <p>Plans are billed by Shopify, so invoices and payment questions are handled in your Shopify admin. For anything the app did wrong, write to us and we will help you sort it out with Shopify.</p>
      </Section>
      <Section title="Company">
        <p>{operatorName()}{COMPANY.registeredAddress ? `, ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? `, ${COMPANY.country}` : ""}</p>
      </Section>
    </LegalPage>
  );
}
