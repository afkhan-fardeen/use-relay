import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY } from "@/lib/company";
import { Suspense } from "react";
import { SupportForm } from "./form";

export const metadata = { title: "Support — Klyroo", description: "Contact Klyroo support. Replies within 2 business days." };

// The ?topic=access link from the home page preselects the early-access category.
async function FormWithTopic({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <SupportForm category={topic === "access" ? "Early access request" : undefined} />;
}

export default function Support({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  return (
    <LegalPage title="Support" intro="Tell us what's happening and we'll get back to you. A real person reads every message.">
      <Section title="Send us a message"><Suspense fallback={<SupportForm />}><FormWithTopic searchParams={searchParams} /></Suspense></Section>
      <Section title="How fast we reply">
        <p>We reply within <strong className="font-normal">2 business days</strong>, Monday to Friday. Billing problems and anything that stops your exports from running are handled first.</p>
      </Section>
      <Section title="Prefer email?">
        <p>Write to <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. See also the <A href="/docs">documentation</A>, which answers most setup questions.</p>
      </Section>
    </LegalPage>
  );
}
