import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Terms of service — Klyroo", description: "The terms that apply when you use Klyroo Context." };

export default function Terms() {
  return (
    <LegalPage title="Terms of service" intro="These terms apply when you use Klyroo Context (“the Service”) and this website.">
      <Section n={1} title="Acceptance of terms">
        <p>“Klyroo”, “we”, “us” and “our” mean the provider of the Service. By using the Service you agree to these terms and to our <A href="/privacy">privacy policy</A>. If you do not agree, do not use the Service.</p>
      </Section>

      <Section n={2} title="Service overview">
        <p>The Service reads the public pages and public product data of a website you give us, builds brand documents from them with the help of AI models, and makes those documents available to you through private Markdown links and a remote MCP server that AI tools can connect to. It is an online software service.</p>
      </Section>

      <Section n={3} title="Eligibility and your obligations">
        <UL items={[
          "You must be at least 18 and able to enter into a binding agreement. If you use the Service for a business, you confirm you have authority to bind it.",
          "You may use the Service only for a website you own or are authorised to represent. Free previews are for you to see what the Service does with your own site; do not use them to collect content from other people's sites.",
          "To keep a workspace beyond a preview, or to turn on automatic refreshes, we may ask you to prove you control the website, for example with a file, tag or DNS record.",
          "You are responsible for the documents you approve and publish, for what AI tools you connect them to, and for how you share your private links and tokens.",
        ]} />
      </Section>

      <Section n={4} title="Account access and security">
        <p>Keep your sign-in details, links and tokens private. Anyone who has a link or token can read the documents it opens. You can revoke tokens at any time, and you must tell us promptly if you think one has been exposed. You are responsible for who in your organisation has access.</p>
      </Section>

      <Section n={5} title="Plans, fees and billing">
        <UL items={[
          "Plans and prices are shown on our pricing page, in US dollars. Prices exclude taxes, which are added where required.",
          "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Paddle's checkout terms apply to your purchase.",
          "Paid plans renew automatically each month, or each year if you choose annual billing, until you cancel. You can cancel at any time and the cancellation takes effect at the end of the period you have paid for.",
          "We may change prices for future periods. We will tell you in advance, and a change applies from your next renewal.",
          "Refunds are described on our billing and refunds page.",
        ]} />
        <p>More on <A href="/refunds">billing and refunds</A>.</p>
      </Section>

      <Section n={6} title="Acceptable use">
        <p>You agree not to:</p>
        <UL items={[
          "use the Service for anything unlawful, or to collect content you are not entitled to use;",
          "enter web addresses of sites you do not own or have permission to use, or try to use the Service to copy another business's catalog or content;",
          "attempt to make the Service reach private or internal networks, or to break, probe, overload or bypass its limits;",
          "use the documents to mislead people, or to make claims about products that are false or unlawful;",
          "resell or provide the Service to others except as a legitimate agency working for your own clients, on a plan that allows it;",
          "send automated or abusive traffic to our systems.",
        ]} />
      </Section>

      <Section n={7} title="Your content, generated documents and AI">
        <p>You own your content and the documents you approve, as between you and us. We process them only to provide the Service, as described in our <A href="/privacy">privacy policy</A> and <A href="/dpa">data processing terms</A>. We do not use your content to train AI models.</p>
        <p>The text we read from a website belongs to whoever published it. You confirm that you have the right to give it to us for this purpose.</p>
        <p>Documents are produced by software and AI models and can contain mistakes. The product catalog is built from the product data your site publishes, but even that can be out of date between refreshes. Review documents before you rely on them, and check what AI tools say to your customers. We do not guarantee that an AI tool will follow your documents or rules.</p>
      </Section>

      <Section n={8} title="Availability, support and changes">
        <p>We work to keep the Service available but do not promise uninterrupted or error-free service. We may carry out maintenance, and the Service depends on third parties such as AI model providers and the sites it reads. The Service is in early access and features may change. If we withdraw a paid feature you are paying for, we will give you a reasonable way to cancel. Support is by email at <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>, and we aim to reply within 2 business days.</p>
      </Section>

      <Section n={9} title="Intellectual property">
        <p>We own the Service software, brand and website. We grant you a limited, non-exclusive, non-transferable right to use the Service under these terms. You keep all rights in your own content.</p>
      </Section>

      <Section n={10} title="Third-party services">
        <p>The Service relies on providers listed in our <A href="/privacy">privacy policy</A>. We are not responsible for third-party services, and your use of AI tools, Shopify or other platforms is governed by their own terms. Klyroo is independent and is not affiliated with or endorsed by Shopify, Anthropic, OpenAI, Cursor or other companies whose names appear on this site.</p>
      </Section>

      <Section n={11} title="Disclaimers">
        <p>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT DOCUMENTS OR AI OUTPUT WILL BE ACCURATE, COMPLETE OR FREE OF ERRORS.</p>
      </Section>

      <Section n={12} title="Limitation of liability">
        <p>To the extent the law allows, we are not liable for indirect, incidental or consequential damages, or for lost profits, revenue or data. Our total liability under these terms is limited to the greater of USD 100 or the fees you paid for the Service in the 3 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>
      </Section>

      <Section n={13} title="Indemnification">
        <p>You agree to defend and hold us harmless from claims arising from your breach of these terms, your use of the Service on a site you were not entitled to use, or your unlawful use of the Service or of the documents.</p>
      </Section>

      <Section n={14} title="Suspension and changes to these terms">
        <p>We may suspend access if you break these terms, if we reasonably believe your account or a token has been compromised, or if the law requires. You can stop at any time by cancelling and closing your account. We may update these terms; we will post the new version here and tell you about material changes by email or in the Service. If you keep using the Service after they take effect, you accept them.</p>
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
