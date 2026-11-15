import { A, LegalPage, Section, UL } from "@/components/legal";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "KlyrooBot — Klyroo", description: "How Klyroo's web reader identifies itself, what it reads, and how to block it." };

export default function Bot() {
  return (
    <LegalPage title="KlyrooBot" intro="KlyrooBot is the program Klyroo Context uses to read a store's public pages when its owner asks us to.">
      <Section title="What it does">
        <p>When someone enters a store address in Klyroo Context, KlyrooBot reads a small number of public pages from that site: the home page, policy pages, About and FAQ pages, a few collections, and the public product list. It uses that text to build the brand documents the person asked for.</p>
      </Section>
      <Section title="How it behaves">
        <UL items={[
          "It identifies itself with the user agent KlyrooBot/1.0 and a link to this page.",
          "It reads robots.txt first and does not fetch anything the file disallows for KlyrooBot or for all crawlers.",
          "It reads at most about 15 pages and one product list per request, one at a time, with a pause between requests.",
          "It reads public pages only. It does not log in, fill in forms, run scripts or use a headless browser.",
          "It only visits public web addresses, over ports 80 and 443.",
        ]} />
      </Section>
      <Section title="Block or limit it">
        <p>Add this to your robots.txt to stop KlyrooBot completely:</p>
        <pre className="overflow-x-auto rounded-card border border-line bg-surface p-4 text-sm">{`User-agent: KlyrooBot\nDisallow: /`}</pre>
        <p>You can also disallow single paths. If KlyrooBot reads something it should not, or you want content removed from a guide, email <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A> with the web address and we will act within 2 business days.</p>
      </Section>
    </LegalPage>
  );
}
