import { A, LegalPage, Section, UL } from "@/components/legal";

export const metadata = { title: "Cookie policy — Klyroo", description: "The cookies used by the Klyroo website and apps." };

export default function Cookies() {
  return (
    <LegalPage title="Cookie policy" intro="Short version: this website does not use advertising or tracking cookies.">
      <Section title="This website">
        <p>useklyroo.com sets no cookies of its own for tracking, analytics or advertising, so there is no cookie banner and nothing to switch off. If we ever add analytics, it will be cookie-free or we will ask for your consent first, and update this page.</p>
      </Section>
      <Section title="Inside Shopify Admin">
        <p>Klyroo Data Exporter runs inside your Shopify Admin and uses only the session mechanisms Shopify provides to sign you in (session tokens). We do not use them to track you.</p>
      </Section>
      <Section title="Third parties">
        <UL items={[
          "Fonts and other assets are served from our own domain.",
          "Links to Shopify and other sites are governed by their own cookie policies.",
        ]} />
        <p>More in our <A href="/privacy">privacy policy</A>.</p>
      </Section>
    </LegalPage>
  );
}
