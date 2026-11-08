import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata = { title: "Terms of service — Klyroo", description: "The terms that apply when you use Klyroo Export." };

export default function Terms() {
  const op = operatorName();
  return (
    <LegalPage title="Terms of service" intro={`These terms are an agreement between you and ${op} (“Klyroo”, “we”, “us”). They apply when you create a Klyroo account or use Klyroo Export.`}>
      <Section n={1} title="Who we are">
        <p>
          Klyroo is {COMPANY.entity === "individual" ? "a trading name of " : "a brand of "}{op.replace(/, trading as Klyroo$/, "")}{COMPANY.entity === "individual" ? ", an individual" : ""}{COMPANY.registeredAddress ? `, of ${COMPANY.registeredAddress}` : ""}{COMPANY.country ? ` (${COMPANY.country})` : ""}.
          You can reach us at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.
        </p>
      </Section>

      <Section n={2} title="The service">
        <p>
          <strong className="font-normal">Klyroo Export</strong> lets you export data from your Shopify store, such as products, orders, customers, inventory and collections, to spreadsheet files.
          It is an online software service delivered instantly through your browser. We sell no physical goods and no manual services.
        </p>
      </Section>

      <Section n={3} title="Your account">
        <UL items={[
          "You must be at least 18 and able to enter into a binding agreement. If you sign up for a business, you confirm you have authority to bind it.",
          "Give us accurate information and keep your password secure. You are responsible for activity under your account.",
          "Tell us straight away at the support address if you think your account has been accessed without permission.",
        ]} />
      </Section>

      <Section n={4} title="Connecting your Shopify store">
        <UL items={[
          "Klyroo Export asks for read-only access to your store using credentials you create in your own Shopify account. We never change your store.",
          "You are responsible for the permissions you grant, for keeping your Shopify credentials safe, and for complying with Shopify's terms. You can revoke access at any time in Shopify.",
          "You may connect only a store you own or are authorised to manage, and only to export your own store's data. Klyroo Export is not a tool for collecting data from stores or people you have no right to.",
          "Exports can include personal data about your customers. For that data you are the controller and we act as your processor: we handle it only to build the files you ask for. You are responsible for having a lawful basis to use it and for how you store and share the files you download.",
          "Do not use exported customer data for spam or unsolicited mass outreach, or share it in ways your customers and the law do not allow.",
        ]} />
      </Section>

      <Section n={5} title="Acceptable use">
        <p>You agree not to:</p>
        <UL items={[
          "use Klyroo for anything unlawful, or to collect data you are not entitled to;",
          "connect a store you do not own or have permission to access;",
          "attempt to break, probe, overload or bypass the limits of the service;",
          "resell or provide the service to others except as a legitimate agency working for your own clients;",
  "send automated or abusive traffic to our systems;",
          "use Klyroo to bypass the terms or limits of Shopify or of any other platform.",
        ]} />
      </Section>

      <Section n={6} title="Plans, payments and Dodo Payments">
        <p>
          Our order process is conducted by our online reseller Dodo Payments. <strong className="font-normal">Dodo Payments is the Merchant of Record for all our orders.</strong> Dodo Payments processes your payment, calculates and collects taxes, and issues invoices and refunds. Its{" "}
          <A href="https://dodopayments.com/legal/privacy-policy">privacy policy</A> applies to the payment data it collects.
        </p>
        <UL items={[
          "Paid plans are subscriptions that renew every month until you cancel. Our prices are set in pounds sterling (GBP). Checkout may show an equivalent amount in your local currency, and taxes are calculated at checkout.",
          "Every paid plan starts with a 3-day free trial. You are not charged during the trial. Cancel before it ends and you pay nothing; otherwise the first payment is taken when it ends.",
          "You can cancel at any time from the Billing page of the app or through the customer portal. Cancellation takes effect at the end of the period you have paid for, and you keep your plan until then.",
          "If a payment fails, it is retried automatically. If it still cannot be collected, your plan may move to the Free plan.",
          "We may change prices for future periods. We will tell you in advance, and the change applies from your next renewal.",
          "Your plan applies to Klyroo Export.",
        ]} />
      </Section>

      <Section n={7} title="Refunds">
        <p>Our <A href="/refunds">refund policy</A> explains when you can get your money back. It forms part of these terms.</p>
      </Section>

      <Section n={8} title="Free plans and changes to the service">
        <p>
          Some features are free. We may change, limit or remove features as the service develops, and we only describe features on our site that are available.
          If we withdraw a paid feature you are paying for, we will give you a reasonable way to cancel and a refund for any unused period.
        </p>
      </Section>

      <Section n={9} title="Your data">
        <p>
          You own your data and the files you export. We process it only to provide the service. Our <A href="/privacy">privacy policy</A> explains what we collect and how we protect it.
          Export files are stored privately and deleted automatically after a limited time. You can delete your account and data yourself at any time from the Account page.
        </p>
      </Section>

      <Section n={10} title="Availability and support">
        <p>
          We work to keep Klyroo available but do not promise uninterrupted or error-free service. We may carry out maintenance, and the service may depend on third parties such as Shopify.
          Support is available by email at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.
        </p>
      </Section>

      <Section n={11} title="Intellectual property">
        <p>
          We own the Klyroo software, brand and website. We grant you a limited, non-exclusive, non-transferable right to use the services under these terms. You keep all rights in your own data, content and exports.
        </p>
      </Section>

      <Section n={12} title="Suspension and termination">
        <p>
          You can stop using Klyroo and close your account at any time. We may suspend or end your access if you break these terms, put the service or other users at risk, or if required by law. Where reasonable, we will tell you why and give you a chance to fix the problem first.
        </p>
      </Section>

      <Section n={13} title="Liability">
        <p>
          Nothing in these terms limits liability that cannot be limited by law, including for fraud, death or personal injury caused by negligence.
          Subject to that, we are not liable for indirect or consequential loss, loss of profit, revenue or data, and our total liability to you for any claim is limited to the amount you paid us for the service in the 12 months before the claim.
          The services are provided “as is” and we give no warranty that exports will be free of errors. You should check exported data before relying on it.
        </p>
      </Section>

      <Section n={14} title="Changes to these terms">
        <p>We may update these terms. We will post the new version here and, for material changes, tell you by email or in the app before they apply. If you keep using Klyroo after the change takes effect, you accept the new terms.</p>
      </Section>

      <Section n={15} title="Governing law">
        <p>
          These terms are governed by the laws of {COMPANY.governingLaw || "the country where we are registered"}, and the courts there have jurisdiction, except where the law of your country gives you the right to bring a claim locally.
        </p>
      </Section>

      <Section n={16} title="Contact">
        <p>Questions about these terms: <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>.</p>
      </Section>
    </LegalPage>
  );
}
