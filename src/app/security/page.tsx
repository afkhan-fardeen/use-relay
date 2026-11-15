import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Security — Klyroo", description: "How Klyroo Context protects your workspace, tokens and documents." };

export default function Security() {
  return (
    <LegalPage title="Security" intro="What we do to protect your data, stated plainly. If something here is unclear, ask us.">
      <Section title="What we ask of your store">
        <UL items={[
          "Nothing. Klyroo Context reads only your public pages and public product list. It never asks for your Shopify login, admin access or API keys.",
          "It does not read customers, orders or payment data.",
        ]} />
      </Section>

      <Section title="How our web reader stays in bounds">
        <UL items={[
          "It only visits public web addresses over standard web ports. Private, internal and local addresses are refused, including after redirects and after the address is looked up.",
          "It follows robots.txt, identifies itself as KlyrooBot, reads a small number of pages slowly, and sets limits on size and time.",
          "It does not log in, run scripts or use a headless browser.",
          "Text copied from websites is treated as data, never as instructions, when it is sent to an AI model or returned through our tools.",
        ]} />
      </Section>

      <Section title="Your data">
        <UL items={[
          "Data travels over HTTPS, with certificates managed automatically.",
          "Each workspace is kept apart, and every request is checked against the workspace it belongs to.",
          "Access tokens are long, random and stored only as one-way hashes. You can revoke them at any time, and free previews expire after 24 hours.",
          "Our MCP tools are read-only for approved documents. The tool that saves AI drafts writes only to a separate draft area and never overwrites approved documents.",
          "We do not use your content to train AI models.",
        ]} />
      </Section>

      <Section title="How we operate">
        <UL items={[
          "Crawls run one at a time and are rate-limited per network and per site.",
          "Servers are kept up to date, only the web ports and our management port are open, and access is by key, not password.",
          "Our automated tests cover the address checks, robots.txt handling, token checks, expiry and the MCP tools, including hostile inputs.",
        ]} />
      </Section>

      <Section title="Where data is stored">
        <p>Server software runs on a host in the United States. See the <A href="/dpa">subprocessors table</A> and the <A href="/privacy">privacy policy</A> for the full list of providers.</p>
      </Section>

      <Section title="Availability">
        <p>We monitor the Service and work to keep it available, but we do not yet offer a formal uptime guarantee. The Service is in early access.</p>
      </Section>

      <Section title="Report a vulnerability">
        <p>
          If you find a security problem, please email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with the details and mark it &ldquo;Security&rdquo;. We will acknowledge it within 2 business days, will not take legal action against good-faith research that avoids other people&apos;s data, and will credit you if you wish. Our contact details are also published in <A href="/.well-known/security.txt">security.txt</A>.
        </p>
      </Section>
    </LegalPage>
  );
}
