import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Security — Klyroo Data Exporter", description: "How Klyroo Data Exporter protects your store data and exports." };

export default function Security() {
  return (
    <LegalPage title="Security" intro="What we do to protect your store data, stated plainly. If something here is unclear, ask us.">
      <Section title="Access to your store">
        <UL items={[
          "The app asks Shopify only for read access to products, inventory and locations. It cannot change your store, and it never asks for customer, order or payment data.",
          "Merchants sign in through Shopify: every action in the app is authenticated with a Shopify session token, and every webhook from Shopify is verified with its signature before we act on it.",
          "When you uninstall the app, your access token is deleted immediately, and everything else is deleted when Shopify sends its shop erasure request.",
        ]} />
      </Section>

      <Section title="Your data">
        <UL items={[
          "Data travels over HTTPS, with certificates managed automatically.",
          "Each store's data and files are kept apart. Files are stored under keys derived from the store, and every request is checked against the signed-in store, so one store can never reach another's exports.",
          "Export files are private. They are downloaded through signed links that expire after 30 minutes, and are deleted automatically after 7 days.",
          "We do not store customer personal data, so there is none to leak from the app.",
        ]} />
      </Section>

      <Section title="How we operate">
        <UL items={[
          "Exports run in the background and are retried automatically; a job that fails shows a clear reason.",
          "We rate-limit previews and exports per store, and cap how many exports can run at once.",
          "Servers are kept up to date with automatic security updates, only the web ports and our management port are open, and access is by key, not password.",
          "Our automated tests check the privacy webhooks, plan limits, per-store isolation and the export engine, including what happens when things fail.",
        ]} />
      </Section>

      <Section title="Where data is stored">
        <p>The app runs on a server in the United States. Its database is hosted by Turso. See the <A href="/privacy">privacy policy</A> for the full list of providers.</p>
      </Section>

      <Section title="Availability">
        <p>We monitor the app and work to keep it available, but we do not yet offer a formal uptime guarantee. If it is briefly unavailable, Shopify retries the notifications it sends us, and your exports resume.</p>
      </Section>

      <Section title="Report a vulnerability">
        <p>
          If you find a security problem, please email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with the details and mark it &ldquo;Security&rdquo;. We will acknowledge it within 2 business days, will not take legal action against good-faith research that avoids other people&apos;s data, and will credit you if you wish. Our contact details are also published in <A href="/.well-known/security.txt">security.txt</A>.
        </p>
      </Section>
    </LegalPage>
  );
}
