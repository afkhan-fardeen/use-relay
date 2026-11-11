import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Privacy policy — Klyroo Data Exporter", description: "What data Klyroo Data Exporter handles, how long it is kept, who we share it with, and your rights." };

export default function Privacy() {
  const op = operatorName();
  return (
    <LegalPage title="Privacy policy" intro="This policy explains what data Klyroo Data Exporter (“the app”) handles when a merchant installs it on a Shopify store, why, how long we keep it, and the rights you have.">
      <Section n={1} title="Who is responsible">
        <p>
          The app is provided by {op}{COMPANY.registeredAddress ? `, ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? `, ${COMPANY.country}` : ""} (“Klyroo”, “we”).
          For the data of your store that you export with the app, you are the controller and we are your processor: we handle it only to build the files you ask for.
          Privacy contact: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.
        </p>
      </Section>

      <Section n={2} title="What the app handles and why">
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-4 py-3 font-normal">Data</th>
                <th className="px-4 py-3 font-normal">Why</th>
                <th className="px-4 py-3 font-normal">Kept</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                ["Your store address (the .myshopify.com domain) and the access token Shopify gives the app", "Identify your store and read the data you ask to export", "Until you uninstall the app (the token is deleted at once); the rest is deleted after Shopify's shop erasure request"],
                ["The permissions you approved and your current plan", "Apply the right limits and features", "Until the shop erasure request"],
                ["Product, variant, inventory, location and metafield data of your store", "Build the Excel or CSV file you request. It is read from Shopify while the export runs and is not kept except inside the file", "Not stored by us beyond the export file"],
                ["Export files and the job history (what was exported, when, its status and size)", "Let you download and review your exports", "Files: 7 days, then deleted automatically. Job history: until the shop erasure request"],
                ["Names of the people who open the app, as supplied by Shopify, if any", "Shopify's sign-in; we do not store personal profiles", "Not stored"],
                ["Messages you send us for support", "Answer your questions", "Until the question is resolved, then up to 24 months"],
                ["Technical logs (IP address, requests, errors)", "Keep the service secure and fix problems", "A short period set by our hosting provider"],
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
        <p>
          <strong className="font-normal">The app does not collect or store personal data about your customers.</strong> It exports products, inventory, locations and collections only. We do not sell personal data, and we do not use exported data for advertising or to build profiles.
        </p>
      </Section>

      <Section n={3} title="Shopify's privacy webhooks">
        <p>The app implements Shopify&apos;s three mandatory privacy webhooks, and verifies that each request really came from Shopify:</p>
        <UL items={[
          <><strong className="font-normal">customers/data_request</strong> and <strong className="font-normal">customers/redact</strong>: because the app stores no customer personal data, there is nothing to return or erase; the request is acknowledged.</>,
          <><strong className="font-normal">shop/redact</strong> (sent 48 hours after you uninstall): we delete everything we hold for the store: access tokens, plan record, job history and any remaining export files.</>,
        ]} />
      </Section>

      <Section n={4} title="Who we share it with">
        <p>The app runs on these providers, who process data for us:</p>
        <UL items={[
          <><strong className="font-normal">Shopify</strong>, the source of the data you ask us to export, and the provider of sign-in and billing.</>,
          <><strong className="font-normal">Spaceship</strong>, the server host (United States) that runs the app and keeps export files for up to 7 days.</>,
          <><strong className="font-normal">Turso</strong>, the database provider that stores the store record, plan, job history and Shopify&apos;s session data.</>,
          <><strong className="font-normal">Resend</strong>, which delivers email we send you about support requests.</>,
          "Professional advisers, and public authorities where we are legally required to.",
        ]} />
      </Section>

      <Section n={5} title="International transfers">
        <p>
          Our providers may process data outside the UK and European Economic Area, including in the United States. Where that happens we rely on an adequacy decision or approved safeguards such as the UK International Data Transfer Agreement or the EU Standard Contractual Clauses.
        </p>
      </Section>

      <Section n={6} title="How we protect it">
        <UL items={[
          "Data travels over HTTPS. The app only asks for read access to products, inventory and locations.",
          "Every request from Shopify is verified, and every merchant action is authenticated with a Shopify session token. One store can never see another store's data or files.",
          "Export files are private. They are downloaded through signed links that expire after 30 minutes, and are deleted after 7 days.",
        ]} />
        <p>No system is perfectly secure. If a breach affects you we will tell you and the authorities as the law requires. Read more on our <A href="/security">security page</A>.</p>
      </Section>

      <Section n={7} title="Cookies">
        <p>The app, which runs inside the Shopify Admin, uses only what Shopify&apos;s sign-in needs. This website uses no advertising or tracking cookies.</p>
      </Section>

      <Section n={8} title="Your rights">
        <p>
          Depending on where you live, you can ask us to access, correct, delete or export the personal data we hold about you, to restrict or object to how we use it, and to withdraw consent where we rely on it.
          Email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> and we will reply within one month. If you are unhappy with our response you can complain to your data protection authority, such as the UK Information Commissioner&apos;s Office (<A href="https://ico.org.uk">ico.org.uk</A>).
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>The app is for businesses and is not directed at anyone under 18.</p>
      </Section>

      <Section n={10} title="Changes">
        <p>We will post changes to this policy here and tell you about important ones in the app or by email.</p>
      </Section>
    </LegalPage>
  );
}
