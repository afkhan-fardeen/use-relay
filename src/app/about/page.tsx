import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "About — Klyroo", description: "Klyroo is an independent maker of simple, focused Shopify apps." };

export default function About() {
  return (
    <LegalPage title="About Klyroo" intro="Klyroo makes Shopify apps. Simple ones.">
      <Section title="What we believe">
        <p>A good Shopify app does one job, does it well, and stays out of your way. We build small, focused apps with clear pricing, read-only access wherever that is enough, and support from a real person.</p>
      </Section>
      <Section title="What we make">
        <p>Our first app is <A href="/data-exporter">Klyroo Data Exporter</A>, which turns your store data into clean Excel and CSV files from inside your Shopify Admin.</p>
      </Section>
      <Section title="Who is behind it">
        <p>Klyroo is a small independent studio. We are not affiliated with or endorsed by Shopify.</p>
      </Section>
      <Section title="Get in touch">
        <p>Ideas, questions or feedback: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> or the <A href="/support">support page</A>.</p>
      </Section>
    </LegalPage>
  );
}
