import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Privacy policy — Klyroo", description: "What data Klyroo apps handle, why, how long we keep it, who we share it with, and your rights." };

const b = (t: string) => <strong className="font-normal">{t}</strong>;

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" intro="Klyroo makes Shopify apps. This policy explains what data our apps and this website handle, why, and what choices you have.">
      <Section n={1} title="Overview and scope">
        <p>
          This policy covers Klyroo Data Exporter (“the App”) and useklyroo.com. “We”, “us” and “our” mean Klyroo. We only collect what is needed to run the App.
          For the store data you export, you (the merchant) are the controller and we process it on your behalf. See <A href="/dpa">Data processing and subprocessors</A>.
        </p>
        <p>We do not sell merchant data, and we do not use it for advertising.</p>
      </Section>

      <Section n={2} title="Information we collect">
        <p>{b("Store and account data.")} Your .myshopify.com domain, the access token Shopify gives the App, the permissions you approved, your plan, and install and uninstall dates.</p>
        <p>{b("Export data.")} Product, variant, inventory, location, collection and metafield data that you ask us to export. It is read from Shopify while the export runs and is kept only inside the export file.</p>
        <p>{b("Export history.")} What was exported, when, its status, size and any error, so you can download and re-run exports.</p>
        <p>{b("Support messages.")} The emails you send us, and what they contain.</p>
        <p>{b("Technical data.")} Server logs such as IP address, requests and errors, used to keep the service secure and fix problems.</p>
        <p>{b("What we do not collect.")} The App does not read customers or orders, and stores no customer personal data. It cannot change your store.</p>
      </Section>

      <Section n={3} title="How we use information">
        <UL items={[
          "To run the App: sign you in through Shopify, build the files you request and apply your plan&apos;s limits.",
          "To bill you: Shopify handles payment. We receive your plan status, not your payment details.",
          "To answer support requests.",
          "To secure and improve the service, for example by rate-limiting abuse and fixing errors.",
          "To meet legal obligations.",
        ]} />
      </Section>

      <Section n={4} title="Legal bases">
        <p>Where the GDPR or UK GDPR applies: we process data to perform our contract with you (providing the App), for our legitimate interests (security, preventing abuse, improving the service), to comply with law, and with your consent where we ask for it.</p>
      </Section>

      <Section n={5} title="Data retention">
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted border-b border-line"><th className="px-4 py-3 font-normal">Data</th><th className="px-4 py-3 font-normal">Kept</th></tr></thead>
            <tbody>
              {[
                ["Shopify access token", "Deleted immediately when you uninstall"],
                ["Store record, plan and job history", "Until Shopify&apos;s shop erasure request, sent 48 hours after uninstall, then deleted"],
                ["Export files", "7 days, then deleted automatically"],
                ["Store data read for an export", "Not kept beyond the export file"],
                ["Support emails", "Until resolved, then up to 24 months"],
                ["Server logs", "A short period set by our hosting provider"],
              ].map(([a, c]) => (
                <tr key={a} className="border-b border-line last:border-0"><td className="px-4 py-3">{a}</td><td className="px-4 py-3 text-muted">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={6} title="Sharing and service providers">
        <p>We share data only with providers that help us run the App, and with Shopify itself.</p>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted border-b border-line"><th className="px-4 py-3 font-normal">Provider</th><th className="px-4 py-3 font-normal">Purpose</th><th className="px-4 py-3 font-normal">Data</th></tr></thead>
            <tbody>
              {[
                ["Shopify", "Sign-in, billing, source of the data you export", "Store data you choose to export"],
                ["Spaceship", "Server hosting (United States)", "Everything the App processes, and export files for up to 7 days"],
                ["Turso", "Database (United States)", "Store record, plan, job history, Shopify session data"],
                ["Our email provider", "Email, including support replies", "Your email address and messages"],
              ].map(([a, c, d]) => (
                <tr key={a} className="border-b border-line last:border-0"><td className="px-4 py-3">{a}</td><td className="px-4 py-3 text-muted">{c}</td><td className="px-4 py-3 text-muted">{d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>We may also disclose data to professional advisers, and to authorities where the law requires. We do not sell data.</p>
      </Section>

      <Section n={7} title="Security">
        <UL items={[
          "Data travels over HTTPS. The App asks only for read access to products, inventory and locations.",
          "Every request from Shopify is verified, and every action in the App is authenticated with a Shopify session token. One store can never see another store&apos;s data or files.",
          "Export files are private. Download links are signed and expire after 30 minutes.",
        ]} />
        <p>No system is perfectly secure. If a breach affects you we will tell you and the authorities as the law requires. See our <A href="/security">security page</A>.</p>
      </Section>

      <Section n={8} title="Your rights and choices">
        <p>{b("EEA, UK and Switzerland.")} You can ask to access, correct, delete or export your personal data, to restrict or object to its use, and to withdraw consent. You can complain to your data protection authority.</p>
        <p>{b("California.")} You can ask what personal information we hold and ask us to delete it, and we will not discriminate against you for asking. We do not sell or share personal information.</p>
        <p>Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. We usually reply within 30 days. If you are a customer of a store that uses the App, contact that store, which can pass the request to us. In practice the App holds no customer personal data.</p>
        <p>{b("Shopify&apos;s privacy webhooks.")} The App handles Shopify&apos;s mandatory requests: customers/data_request and customers/redact are acknowledged because we store no customer personal data, and shop/redact deletes everything we hold for the store.</p>
      </Section>

      <Section n={9} title="International transfers">
        <p>Our providers may process data outside the UK and EEA, including in the United States. Where that happens we rely on an adequacy decision or approved safeguards such as the UK IDTA or EU Standard Contractual Clauses.</p>
      </Section>

      <Section n={10} title="Cookies and similar technologies">
        <p>This website uses no advertising or analytics cookies. Inside Shopify Admin, the App uses only what Shopify&apos;s sign-in needs. See the <A href="/cookies">cookie policy</A>.</p>
      </Section>

      <Section n={11} title="Children's data">
        <p>The App is for businesses and is not directed at anyone under 18. We do not knowingly collect data from children.</p>
      </Section>

      <Section n={12} title="Updates to this policy">
        <p>We will post changes here and update the date above, and tell you about important changes in the App or by email. Continued use of the App after an update takes effect means you accept the revised policy.</p>
      </Section>

      <Section n={13} title="Contact">
        <p>Questions or requests: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
    </LegalPage>
  );
}
