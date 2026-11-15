import { A, LegalPage, Section } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "About — Klyroo", description: "Klyroo is an independent maker of Klyroo Context, a brand guide for AI tools." };

export default function About() {
  return (
    <LegalPage title="About Klyroo" intro="Klyroo helps AI tools tell the truth about your brand.">
      <Section title="The problem">
        <p>People now ask AI tools about brands and products, and teams use AI tools to write for them. Without the facts, those tools guess: wrong prices, invented policies, off-brand tone.</p>
      </Section>
      <Section title="What we make">
        <p>Klyroo Context reads your public store and builds a living guide to your brand, catalog and policies. Your AI tools connect to it through one private link, so they answer from your facts. You can edit every document, set rules about what must never be claimed, and keep it fresh with scheduled refreshes.</p>
      </Section>
      <Section title="How we work">
        <p>We read only public pages, politely, and say who we are (see <A href="/bot">KlyrooBot</A>). We keep as little data as we can, and we explain what we keep in plain language in our <A href="/privacy">privacy policy</A>. Klyroo is a small independent company and is not affiliated with or endorsed by Shopify or any AI provider.</p>
      </Section>
      <Section title="Get in touch">
        <p>Ideas, questions or feedback: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> or the <A href="/support">support page</A>.</p>
      </Section>
    </LegalPage>
  );
}
