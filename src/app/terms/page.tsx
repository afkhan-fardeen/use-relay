import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Terms of service — Klyroo Data Exporter", description: "The terms that apply when you install and use Klyroo Data Exporter." };

export default function Terms() {
  const op = operatorName();
  return (
    <LegalPage title="Terms of service" intro={`These terms are an agreement between you and ${op} (“Klyroo”, “we”, “us”). They apply when you install or use Klyroo Data Exporter (“the app”) on a Shopify store.`}>
      <Section n={1} title="Who we are">
        <p>
          The app is provided by {op.replace(/, trading as Klyroo$/, "")}{COMPANY.entity === "individual" ? ", an individual trading as Klyroo" : ""}{COMPANY.registeredAddress ? `, of ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? ` (${COMPANY.country})` : ""}.
          You can reach us at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.
        </p>
      </Section>

      <Section n={2} title="The service">
        <p>
          Klyroo Data Exporter lets you export data from your Shopify store, such as products, variants, inventory, locations, collections and metafields, to Excel (.xlsx) and CSV files.
          It is an online software service used inside your Shopify Admin. We sell no physical goods and no manual services.
        </p>
      </Section>

      <Section n={3} title="Installing and using the app">
        <UL items={[
          "You must be at least 18 and able to enter into a binding agreement. If you install the app for a business, you confirm you have authority to bind it.",
          "You may install the app only on a store you own or are authorised to manage, and only to export that store's own data.",
          "The app asks for read-only access to products, inventory and locations. It never changes your store. You can remove its access at any time by uninstalling it in Shopify.",
          "You are responsible for complying with Shopify's terms, and for how you store and share the files you download. Exports can include information about your products and stock that you should keep confidential.",
        ]} />
      </Section>

      <Section n={4} title="Acceptable use">
        <p>You agree not to:</p>
        <UL items={[
          "use the app for anything unlawful, or to collect data you are not entitled to;",
          "attempt to break, probe, overload or bypass the limits of the service;",
          "resell or provide the app to others except as a legitimate agency working for your own clients;",
          "use the app to bypass the terms or limits of Shopify or of any other platform;",
          "send automated or abusive traffic to our systems.",
        ]} />
      </Section>

      <Section n={5} title="Plans and payments">
        <p>Plans and prices are shown in the app and on our <A href="/pricing">pricing page</A>. Billing is handled by Shopify.</p>
        <UL items={[
          "Paid plans are subscriptions charged by Shopify every 30 days, in US dollars, until you cancel. Taxes and any currency conversion are handled by Shopify.",
          "You approve each plan on Shopify's own approval page. You can change or cancel a plan at any time from the Plans page in the app. Cancellation takes effect as Shopify describes it at the time.",
          "The app is free on Shopify development stores.",
          "We may change prices for future periods. We will tell you in advance, and a change applies only after you approve it in Shopify.",
          "Refunds for charges made through Shopify are handled by Shopify under its own policy. If something went wrong with the app, contact us and we will help you resolve it with Shopify.",
        ]} />
      </Section>

      <Section n={6} title="Limits">
        <p>
          Each plan limits how many rows an export can contain and which features are available. An export larger than your plan allows stops with a message explaining why. We may also limit the number of exports running at once or in an hour to keep the service fast for everyone.
        </p>
      </Section>

      <Section n={7} title="Your data">
        <p>
          You own your data and the files you export. We process it only to provide the app. Our <A href="/privacy">privacy policy</A> explains what we handle and how we protect it.
          Export files are stored privately and deleted automatically after 7 days. When you uninstall, your access token is removed straight away and the rest of your data is deleted after Shopify&apos;s shop erasure request.
        </p>
      </Section>

      <Section n={8} title="Changes to the service">
        <p>
          We may change, limit or remove features as the service develops, and we only describe features that are available. If we withdraw a paid feature you are paying for, we will give you a reasonable way to cancel.
        </p>
      </Section>

      <Section n={9} title="Availability and support">
        <p>
          We work to keep the app available but do not promise uninterrupted or error-free service. We may carry out maintenance, and the service depends on third parties such as Shopify.
          Support is available through our <A href="/support">support page</A> or by email at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>. We aim to reply within 2 business days.
        </p>
      </Section>

      <Section n={10} title="Intellectual property">
        <p>
          We own the app software, brand and website. We grant you a limited, non-exclusive, non-transferable right to use the app under these terms. You keep all rights in your own data and exports.
        </p>
      </Section>

      <Section n={11} title="Suspension and termination">
        <p>
          You can stop using the app at any time by uninstalling it. We may suspend or end your access if you break these terms, put the service or other users at risk, or if required by law. Where reasonable, we will tell you why and give you a chance to fix the problem first.
        </p>
      </Section>

      <Section n={12} title="Liability">
        <p>
          Nothing in these terms limits liability that cannot be limited by law, including for fraud, death or personal injury caused by negligence.
          Subject to that, we are not liable for indirect or consequential loss, loss of profit, revenue or data, and our total liability to you for any claim is limited to the amount you paid us for the app in the 12 months before the claim.
          The app is provided “as is” and we give no warranty that exports will be free of errors. You should check exported data before relying on it.
        </p>
      </Section>

      <Section n={13} title="Changes to these terms">
        <p>We may update these terms. We will post the new version here and, for material changes, tell you in the app or by email before they apply. If you keep using the app after the change takes effect, you accept the new terms.</p>
      </Section>

      <Section n={14} title="Governing law">
        <p>
          These terms are governed by the laws of {COMPANY.governingLaw || "the country where we are based"}, and the courts there have jurisdiction, except where the law of your country gives you the right to bring a claim locally.
        </p>
      </Section>

      <Section n={15} title="Contact">
        <p>Questions about these terms: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
    </LegalPage>
  );
}
