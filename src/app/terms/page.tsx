import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Terms of service — Klyroo", description: "The terms that apply when you install and use Klyroo apps." };

export default function Terms() {
  return (
    <LegalPage title="Terms of service" intro="These terms apply when you install or use Klyroo Data Exporter (“the App”) on a Shopify store.">
      <Section n={1} title="Acceptance of terms">
        <p>“Klyroo”, “we”, “us” and “our” mean the provider of the App. By installing or using the App you agree to these terms and to our <A href="/privacy">privacy policy</A>. If you do not agree, do not install the App, or uninstall it.</p>
      </Section>

      <Section n={2} title="Service overview">
        <p>The App lets you export data from your Shopify store, such as products, variants, inventory, locations, collections and metafields, to Excel (.xlsx) and CSV files. It is an online software service used inside your Shopify Admin.</p>
      </Section>

      <Section n={3} title="Eligibility and merchant obligations">
        <UL items={[
          "You must be at least 18 and able to enter into a binding agreement. If you install the App for a business, you confirm you have authority to bind it.",
          "You may install the App only on a store you own or are authorised to manage, and only to export that store&apos;s own data.",
          "You are responsible for complying with Shopify&apos;s terms and for how you store and share the files you download. Exports can contain information about your products and stock that you should keep confidential.",
        ]} />
      </Section>

      <Section n={4} title="Account access and security">
        <p>You sign in to the App through Shopify, and your access is tied to your Shopify account and store. The App asks for read-only access to products, inventory and locations, and never changes your store. You are responsible for who in your organisation has access to your Shopify account. You can remove our access at any time by uninstalling the App.</p>
      </Section>

      <Section n={5} title="Plans, fees and billing">
        <UL items={[
          "Plans and prices are shown in the App and on our pricing page. Paid plans are billed through Shopify&apos;s subscription system, every 30 days, in US dollars. The Free plan costs nothing and the App is free on Shopify development stores.",
          "You approve each plan on Shopify&apos;s approval page. Subscriptions renew automatically unless you downgrade or uninstall before the renewal date.",
          "We may change prices for future periods. We will tell you in advance, and a change applies only after you approve it in Shopify.",
          "Except where the law or Shopify&apos;s policy requires otherwise, fees are non-refundable. See our billing and refunds page for how we handle problems.",
        ]} />
        <p>More on <A href="/refunds">billing and refunds</A>.</p>
      </Section>

      <Section n={6} title="Acceptable use">
        <p>You agree not to:</p>
        <UL items={[
          "use the App for anything unlawful or to collect data you are not entitled to;",
          "attempt to break, probe, overload or bypass the limits of the service;",
          "resell or provide the App to others except as a legitimate agency working for your own clients;",
          "use the App to bypass the terms or limits of Shopify or any other platform;",
          "send automated or abusive traffic to our systems.",
        ]} />
      </Section>

      <Section n={7} title="Data and privacy">
        <p>You own your data and the files you export. We process it only to provide the App, as described in our <A href="/privacy">privacy policy</A> and <A href="/dpa">data processing terms</A>. Export files are private and are deleted automatically after 7 days. Plans limit how many rows an export can contain; an export larger than your plan allows stops with a message.</p>
      </Section>

      <Section n={8} title="Availability, support and changes">
        <p>We work to keep the App available but do not promise uninterrupted or error-free service. We may carry out maintenance, and the service depends on third parties such as Shopify. We may change, limit or remove features as the App develops; if we withdraw a paid feature you are paying for, we will give you a reasonable way to cancel. Support is by email at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>, and we aim to reply within 2 business days.</p>
      </Section>

      <Section n={9} title="Intellectual property">
        <p>We own the App software, brand and website. We grant you a limited, non-exclusive, non-transferable right to use the App under these terms. You keep all rights in your own data and exports.</p>
      </Section>

      <Section n={10} title="Third-party services">
        <p>The App relies on Shopify and on infrastructure providers listed in our <A href="/privacy">privacy policy</A>. We are not responsible for third-party services, and your use of Shopify is governed by Shopify&apos;s terms. Klyroo is independent and not affiliated with or endorsed by Shopify.</p>
      </Section>

      <Section n={11} title="Disclaimers">
        <p>THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT EXPORTS WILL BE FREE OF ERRORS. CHECK EXPORTED DATA BEFORE RELYING ON IT.</p>
      </Section>

      <Section n={12} title="Limitation of liability">
        <p>To the extent the law allows, we are not liable for indirect, incidental or consequential damages, or for lost profits, revenue or data. Our total liability under these terms is limited to the greater of USD 100 or the fees you paid for the App in the 3 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>
      </Section>

      <Section n={13} title="Indemnification">
        <p>You agree to defend and hold us harmless from claims arising from your breach of these terms or your unlawful use of the App or of the data you export.</p>
      </Section>

      <Section n={14} title="Suspension and changes to these terms">
        <p>We may suspend access if you break these terms, if we reasonably believe your account has been compromised, or if the law requires. You can stop at any time by uninstalling. We may update these terms; we will post the new version here and tell you about material changes in the App or by email. If you keep using the App after they take effect, you accept them.</p>
      </Section>

      <Section n={15} title="Governing law and disputes">
        <p>These terms are governed by the laws of the country where Klyroo is based. Please contact us first so we can try to resolve any dispute informally. Nothing here removes rights you have under the consumer or data protection law of your own country.</p>
      </Section>

      <Section n={16} title="Contact">
        <p><A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A></p>
      </Section>
    </LegalPage>
  );
}
