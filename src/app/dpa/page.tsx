import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Data processing and subprocessors — Klyroo", description: "How Klyroo processes store data on your behalf, and who helps us do it." };

export default function Dpa() {
  return (
    <LegalPage title="Data processing and subprocessors" intro="For merchants who need to know how Klyroo handles data on their behalf, for example under GDPR.">
      <Section n={1} title="Roles">
        <p>For the store data you export with Klyroo Data Exporter, you are the controller and Klyroo is your processor. This page, together with our <A href="/terms">terms</A> and <A href="/privacy">privacy policy</A>, forms our data processing terms. For a signed copy, email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
      <Section n={2} title="What we process">
        <UL items={[
          "Product, variant, inventory, location, collection and metafield data that you ask us to export. It is read while the export runs and kept only inside the export file.",
          "Your store address, plan, and the Shopify access token needed to run exports.",
          "We do not process customer or order personal data.",
        ]} />
      </Section>
      <Section n={3} title="Our commitments">
        <UL items={[
          "We process data only on your instructions, which are the exports you request, and to run the service.",
          "Everyone with access is bound by confidentiality.",
          "Data is encrypted in transit and access is checked per store. Export files are private, expire links after 30 minutes and are deleted after 7 days.",
          "On uninstall the access token is removed at once, and the rest is deleted after Shopify's shop erasure request.",
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
                ["Spaceship", "Server hosting, export files", "United States"],
                ["Turso", "Database (store record, plan, job history)", "See Turso region"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-b border-line last:border-0"><td className="px-4 py-3">{a}</td><td className="px-4 py-3 text-muted">{b}</td><td className="px-4 py-3 text-muted">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>We will update this list before adding a subprocessor that handles your data.</p>
      </Section>
      <Section n={5} title="International transfers">
        <p>Where data leaves the UK or EEA we rely on an adequacy decision or approved safeguards such as the UK IDTA or EU Standard Contractual Clauses.</p>
      </Section>
    </LegalPage>
  );
}
