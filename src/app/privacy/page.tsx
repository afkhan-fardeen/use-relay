import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Privacy policy — Klyroo", description: "What personal data Klyroo collects, why, and how it is protected." };

export default function Privacy() {
  const op = operatorName();
  return (
    <LegalPage title="Privacy policy" intro="This policy explains what personal data we collect when you use Klyroo, why we collect it, who we share it with, and the rights you have.">
      <Section n={1} title="Who is responsible">
        <p>
          The controller of your account and billing data is {op}{COMPANY.registeredAddress ? `, ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? `, ${COMPANY.country}` : ""} (“Klyroo”, “we”).
          For data about your store&apos;s customers that you export with Klyroo Export, you are the controller and we are your processor: we handle it only on your instructions.
          Privacy contact: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.
        </p>
      </Section>

      <Section n={2} title="What we collect and why">
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-4 py-3 font-normal">Data</th>
                <th className="px-4 py-3 font-normal">Why</th>
                <th className="px-4 py-3 font-normal">Legal basis</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                ["Account details: name, company, email, password (stored only as a secure hash)", "Create and secure your account, provide the service, contact you about it", "Contract"],
                ["Shopify connection: store address, app credentials (encrypted), granted permissions", "Connect to your store and run exports you request", "Contract"],
                ["Store data you choose to export: products, orders, customers, inventory, collections", "Build the files you ask for. We act as your processor", "Your instructions (processor)"],
                ["Klyroo QR codes you save, and for dynamic links the scan data: time, country, device type, referring site and a daily-changing anonymous visitor code (no IP address is stored and no cookies are used)", "Redirect scans and show you your analytics", "Contract; legitimate interests"],
                ["Export files and job history (what was exported, when, status)", "Let you download and review exports", "Contract"],
                ["Billing details: plan, status, Paddle customer and subscription IDs (we never see your card number)", "Manage your subscription and limits", "Contract; legal obligation"],
                ["Support emails and what you tell us", "Answer your questions", "Legitimate interests"],
                ["Technical data: IP address, device and error logs", "Keep the service secure and fix problems", "Legitimate interests"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{a}</td>
                  <td className="px-4 py-3 text-muted">{b}</td>
                  <td className="px-4 py-3 text-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>We do not sell personal data and we do not use exported store data for advertising or to build profiles.</p>
      </Section>

      <Section n={3} title="Who we share it with">
        <p>We use these service providers, who process data for us under agreements that protect it:</p>
        <UL items={[
          <><strong className="font-normal">Supabase</strong> for our database, sign-in and private file storage (data is held in Japan, in the AWS Asia Pacific (Tokyo) region).</>,
          <><strong className="font-normal">Render</strong> for application hosting (Singapore).</>,
          <><strong className="font-normal">Paddle</strong>, our Merchant of Record, which sells our plans, collects payment and handles tax, invoices and refunds. Paddle acts as an independent controller of your payment data under its own <A href="https://www.paddle.com/legal/privacy">privacy notice</A>.</>,
          <><strong className="font-normal">Shopify</strong>, the source of the data you ask us to export.</>,
          "Email providers we use to send account emails. These do not receive your exported store data.",
          "Professional advisers, and public authorities where we are legally required to.",
        ]} />
      </Section>

      <Section n={4} title="International transfers">
        <p>
          Our providers may process data outside the UK and European Economic Area, including in Japan and Singapore. Where that happens we rely on an adequacy decision or approved safeguards such as the UK International Data Transfer Agreement or the EU Standard Contractual Clauses.
        </p>
      </Section>

      <Section n={5} title="How long we keep it">
        <UL items={[
          "Export files are deleted automatically 7 days after they are created.",
          "Your Shopify credentials are deleted when you disconnect a store.",
          "Account, job history and subscription records are kept while your account is open. When you ask us to delete your account we delete or anonymise them, except billing records we must keep by law.",
          "Operational logs are kept for a limited period set by our hosting providers.",
        ]} />
      </Section>

      <Section n={6} title="How we protect it">
        <UL items={[
          "Shopify credentials are encrypted at rest and we only request read access.",
          "Data is encrypted in transit (HTTPS). Export files are private and are only downloadable through short-lived links by signed-in members of your account.",
          "Access to each account's data is restricted by database access rules, and our systems use the minimum permissions they need.",
        ]} />
        <p>No system is perfectly secure. If a breach affects you we will tell you and the authorities as the law requires.</p>
      </Section>

      <Section n={7} title="Cookies">
        <p>
          We use only strictly necessary cookies, to keep you signed in and secure. Our checkout, provided by Paddle, may set its own cookies to process your payment. We do not use advertising or analytics cookies on the Klyroo app.
        </p>
      </Section>

      <Section n={8} title="Your rights">
        <p>
          Depending on where you live, you can ask us to access, correct, delete or export your personal data, to restrict or object to how we use it, and to withdraw consent where we rely on it.
          Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> and we will reply within one month. If you are unhappy with our response you can complain to your data protection authority, such as the UK Information Commissioner&apos;s Office (<A href="https://ico.org.uk">ico.org.uk</A>).
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>Klyroo is for businesses and is not directed at anyone under 18.</p>
      </Section>

      <Section n={10} title="Changes">
        <p>We will post changes to this policy here and tell you about important ones by email or in the app.</p>
      </Section>
    </LegalPage>
  );
}
