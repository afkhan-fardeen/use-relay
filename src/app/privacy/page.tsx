import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Privacy policy — Klyroo", description: "What data Klyroo Context handles, why, how long we keep it, who we share it with, and your rights." };

const b = (t: string) => <strong className="font-normal">{t}</strong>;

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-card border border-line">
    <table className="w-full text-sm">
      <thead><tr className="text-left text-muted border-b border-line">{head.map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]} className="border-b border-line last:border-0">{r.map((c, i) => <td key={i} className={`px-4 py-3 ${i ? "text-muted" : ""}`}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" intro="Klyroo makes Klyroo Context. This policy explains what data the service and this website handle, why, and what choices you have.">
      <Section n={1} title="Overview and scope">
        <p>
          This policy covers Klyroo Context (“the Service”) and useklyroo.com. “We”, “us” and “our” mean Klyroo. We collect only what we need to run the Service.
          For the store content you ask us to read and the documents we build from it, you are the controller and we process it on your behalf. See <A href="/dpa">Data processing and subprocessors</A>.
        </p>
        <p>We do not sell personal data, and we do not use your content to train AI models.</p>
      </Section>

      <Section n={2} title="Information we collect">
        <p>{b("Account data.")} Your email address and sign-in details, your workspace names, your plan, and the team members you invite. (Accounts open when the Service leaves early access.)</p>
        <p>{b("Store content.")} The web address you enter, and the public pages and product data we read from that site: text, product titles, descriptions, variants, prices and stock status. Public pages can include names or contact details that a business has published. We do not log in to your store and we do not read customers or orders.</p>
        <p>{b("Generated documents.")} The brand documents we build, and any edits, rules or banned claims you add.</p>
        <p>{b("Access tokens.")} We store a one-way hash of each token. We cannot read a token after it is shown to you.</p>
        <p>{b("Usage data.")} Which documents and tools are requested through your links and how often, so we can apply plan limits and spot abuse.</p>
        <p>{b("Support messages.")} The emails you send us, and what they contain.</p>
        <p>{b("Technical data.")} Server logs such as IP address, requests and errors, used to keep the Service secure and fix problems.</p>
        <p>{b("Payment data.")} Paddle takes payment as our Merchant of Record. We receive your plan, billing status and country, not your card details.</p>
      </Section>

      <Section n={3} title="How we use information">
        <UL items={[
          "To run the Service: read the site you point us at, build and refresh your documents, and answer requests made through your links.",
          "To send content to our AI model provider so it can write the documents you asked for.",
          "To apply plan limits, rate limits and abuse protection.",
          "To bill you, through Paddle.",
          "To answer support requests.",
          "To secure and improve the Service, for example by fixing errors.",
          "To meet legal obligations.",
        ]} />
      </Section>

      <Section n={4} title="Legal bases">
        <p>Where the GDPR or UK GDPR applies: we process data to perform our contract with you (providing the Service), for our legitimate interests (security, preventing abuse, improving the Service), to comply with law, and with your consent where we ask for it.</p>
      </Section>

      <Section n={5} title="Data retention">
        <Table head={["Data", "Kept"]} rows={[
          ["Free preview and its documents", "Deleted automatically 24 hours after the preview is created"],
          ["Workspace content and documents", "While your account is active, then deleted within 30 days of cancellation or on your request"],
          ["Account data", "While your account is active, then deleted within 30 days of closing it, except what the law requires us to keep"],
          ["Token hashes", "Until you revoke the token or close the workspace"],
          ["Usage records", "Up to 90 days"],
          ["Billing records", "As long as tax and accounting law requires (held by Paddle and by us)"],
          ["Support emails", "Until resolved, then up to 24 months"],
          ["Server logs", "A short period set by our hosting provider"],
        ]} />
      </Section>

      <Section n={6} title="Sharing and service providers">
        <p>We share data only with providers that help us run the Service.</p>
        <Table head={["Provider", "Purpose", "Data"]} rows={[
          ["Paddle", "Payments, tax and invoices as Merchant of Record", "Billing details you give at checkout"],
          ["Supabase", "Database and sign-in", "Account data, workspaces, documents, token hashes"],
          ["Spaceship", "Server hosting (United States)", "Everything the Service processes while it runs"],
          ["Vercel", "Website and dashboard hosting", "Requests to useklyroo.com"],
          ["AI model provider", "Writes your brand documents", "The public text and product data we read from your site"],
          ["Our email provider", "Email, including support replies", "Your email address and messages"],
        ]} />
        <p>The name of our AI model provider is listed on the <A href="/dpa">subprocessors table</A> before the Service opens to customers, and we will tell you before we change it. We may also disclose data to professional advisers, and to authorities where the law requires. We do not sell data.</p>
      </Section>

      <Section n={7} title="Security">
        <UL items={[
          "Data travels over HTTPS.",
          "Access tokens are stored only as hashes, can be revoked, and previews expire automatically.",
          "Each workspace is isolated from the others, and every request is checked against the workspace it belongs to.",
          "Our web reader only visits public web addresses and is built to refuse private or internal ones.",
        ]} />
        <p>No system is perfectly secure. If a breach affects you we will tell you and the authorities as the law requires. See our <A href="/security">security page</A>.</p>
      </Section>

      <Section n={8} title="Your rights and choices">
        <p>{b("EEA, UK and Switzerland.")} You can ask to access, correct, delete or export your personal data, to restrict or object to its use, and to withdraw consent. You can complain to your data protection authority.</p>
        <p>{b("California.")} You can ask what personal information we hold and ask us to delete it, and we will not discriminate against you for asking. We do not sell or share personal information.</p>
        <p>Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. We usually reply within 30 days.</p>
        <p>{b("If your information is on a site someone else asked us to read.")} Public pages can mention people. If you want something removed from a guide, or want KlyrooBot to stop reading your site, email us or see the <A href="/bot">KlyrooBot page</A>.</p>
      </Section>

      <Section n={9} title="International transfers">
        <p>Our providers may process data outside the UK and EEA, including in the United States. Where that happens we rely on an adequacy decision or approved safeguards such as the UK IDTA or EU Standard Contractual Clauses.</p>
      </Section>

      <Section n={10} title="Cookies and similar technologies">
        <p>This website uses no advertising or analytics cookies. When you sign in, we use cookies that keep you signed in. Paddle may set cookies on its checkout. See the <A href="/cookies">cookie policy</A>.</p>
      </Section>

      <Section n={11} title="Children's data">
        <p>The Service is for businesses and is not directed at anyone under 18. We do not knowingly collect data from children.</p>
      </Section>

      <Section n={12} title="Updates to this policy">
        <p>We will post changes here and update the date above, and tell you about important changes by email or in the Service. Continued use after an update takes effect means you accept the revised policy.</p>
      </Section>

      <Section n={13} title="Contact">
        <p>Questions or requests: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
    </LegalPage>
  );
}
