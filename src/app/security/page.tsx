import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Security — Klyroo", description: "How Klyroo protects your Shopify credentials, exports and account data." };

export default function Security() {
  return (
    <LegalPage title="Security" intro="What we do to protect your account and your store data, stated plainly. If something here is unclear, ask us.">
      <Section title="Your Shopify access">
        <UL items={[
          "You create the credentials in your own Shopify account, and you choose the permissions. Klyroo Export asks for read-only access.",
          "Your Shopify client secret is encrypted with AES-256-GCM before it is stored. Each secret has its own data key, wrapped by a master key kept outside the database and bound to the specific store, so a copied value cannot be decrypted for another store.",
          "Secrets are never sent to the browser, never written to logs, and are deleted when you disconnect a store.",
          "You can revoke access at any time by uninstalling or deleting the app in Shopify.",
        ]} />
      </Section>
      <Section title="Your data">
        <UL items={[
          "Data is encrypted in transit over HTTPS. Our database and file storage (Supabase) encrypt data at rest.",
          "Every account's data is separated by database access rules (row level security) that are checked on every request. The signed-in browser can read only its own account and cannot write directly.",
          "Export files are private, downloadable only by signed-in members of your account through links that expire within a minute, and deleted automatically after 7 days.",
          "Passwords are handled by our sign-in provider and stored only as secure hashes.",
        ]} />
      </Section>
      <Section title="How we operate">
        <UL items={[
          "Checkout and card data are handled entirely by Dodo Payments, our Merchant of Record. We never see or store card numbers.",
          "Webhooks from our payment provider are verified with a signature and are safe to retry.",
          "We rate-limit sign-in, password reset and support requests, and our automated tests check the access rules, the security headers and common web accessibility problems.",
          "We keep server error logs and alert on failures. Logs contain no secrets or exported customer data.",
        ]} />
      </Section>
      <Section title="Where data is stored">
        <p>Our database and storage are hosted by Supabase in Japan (AWS Tokyo) and our application runs on Render in Singapore. See the <A href="/privacy">privacy policy</A> for the full list of providers.</p>
      </Section>
      <Section title="Availability">
        <p>We work to keep Klyroo available and monitor it, but we do not yet offer a formal uptime guarantee. Exports run in the background and are retried automatically if something fails mid-way.</p>
      </Section>
      <Section title="Report a vulnerability">
        <p>
          If you find a security problem, please email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with the details and mark it &ldquo;Security&rdquo;. We will acknowledge it within 2 business days, will not take legal action against good-faith research that avoids other people&apos;s data, and will credit you if you wish. Our contact details are also published in <A href="/.well-known/security.txt">security.txt</A>.
        </p>
      </Section>
    </LegalPage>
  );
}
