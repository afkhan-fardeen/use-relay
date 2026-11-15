import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Data processing and subprocessors — Klyroo", description: "How Klyroo processes content on your behalf, and who helps us do it." };

export default function Dpa() {
  return (
    <LegalPage title="Data processing and subprocessors" intro="For customers who need to know how Klyroo handles data on their behalf, for example under GDPR.">
      <Section n={1} title="Roles">
        <p>For the website content, product data and documents in your workspace, you are the controller and Klyroo is your processor. This page, together with our <A href="/terms">terms</A> and <A href="/privacy">privacy policy</A>, forms our data processing terms. For a signed copy, email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
      <Section n={2} title="What we process">
        <UL items={[
          "The public pages and product data we read from the website you give us, and the documents we generate from them.",
          "Rules and edits you add, such as banned claims.",
          "Your account details, plan and team members, and one-way hashes of your access tokens.",
          "We do not log in to your store, and we do not process customer or order personal data. Public pages can include names or contact details that the site owner has published.",
        ]} />
      </Section>
      <Section n={3} title="Our commitments">
        <UL items={[
          "We process data only on your instructions, which are the workspaces and refreshes you set up, and to run the Service.",
          "Everyone with access is bound by confidentiality.",
          "Data is encrypted in transit and every request is checked against the workspace it belongs to. Tokens are stored only as hashes and can be revoked.",
          "We do not use your content to train AI models, and we require our AI model provider not to use it for training either.",
          "When you cancel or ask us to, we delete your workspace content within 30 days. Free previews are deleted after 24 hours.",
          "We tell you without undue delay if we learn of a breach affecting your data.",
          "We help you answer data subject requests and will make information needed to show compliance available on request.",
        ]} />
      </Section>
      <Section n={4} title="Subprocessors">
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted border-b border-line"><th className="px-4 py-3 font-normal">Provider</th><th className="px-4 py-3 font-normal">Purpose</th><th className="px-4 py-3 font-normal">Location</th></tr></thead>
            <tbody>
              {[
                ["Spaceship", "Server hosting for the reader, API and MCP service", "United States"],
                ["Supabase", "Database and sign-in", "To be confirmed before launch"],
                ["Vercel", "Website and dashboard hosting", "Global edge network"],
                ["Paddle", "Payments, as Merchant of Record (an independent controller of billing data)", "United Kingdom and EEA"],
                ["AI model provider", "Writes documents from the public content we read", "To be named before launch"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-b border-line last:border-0"><td className="px-4 py-3">{a}</td><td className="px-4 py-3 text-muted">{b}</td><td className="px-4 py-3 text-muted">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Rows marked “to be confirmed” or “to be named” are filled in before the Service opens to customers. We will update this list before adding a subprocessor that handles your data, and tell you in advance.</p>
      </Section>
      <Section n={5} title="International transfers">
        <p>Where data leaves the UK or EEA we rely on an adequacy decision or approved safeguards such as the UK IDTA or EU Standard Contractual Clauses.</p>
      </Section>
    </LegalPage>
  );
}
