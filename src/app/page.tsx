import { JsonLd } from "@/components/json-ld";
import { CountUp } from "@/components/kit/count-up";
import { Marquee } from "@/components/kit/marquee";
import { Particles } from "@/components/kit/particles";
import { PreviewBox } from "@/components/kit/preview-box";
import { Reveal } from "@/components/kit/reveal";
import { SplitText } from "@/components/kit/split-text";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, Feature, SectionHead, Steps } from "@/components/marketing-blocks";
import { CTA, DOCUMENTS, FEATURES, PREVIEW_API, PRODUCT } from "@/lib/product";
import { organizationLd, websiteLd } from "@/lib/seo";

export const metadata = {
  title: "Klyroo Context: your store's brand brain for AI tools",
  description: PRODUCT.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex-1">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div className="particles-in absolute inset-0"><Particles /></div>
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 pt-24 sm:pt-36 pb-24 sm:pb-40">
            <h1 className="max-w-[1000px] text-[44px] sm:text-[78px] leading-[1.02] tracking-[-0.045em] font-normal">
              <span className="sr-only">Your store&apos;s brand brain for AI tools.</span>
              <span aria-hidden="true"><SplitText text="Your store's brand brain" /><br /><SplitText text="for AI tools." className="text-muted" start={4} /></span>
            </h1>
            <p className="anim-fade-up delay-4 mt-8 max-w-[620px] text-[18px] leading-[28px] text-muted">
              Paste your store address. Klyroo reads your public site and builds a living guide to your brand, products and policies, so Claude, ChatGPT, Cursor and other AI tools answer from your facts, not guesses.
            </p>
            <div className="anim-fade-up delay-4 mt-10"><PreviewBox api={PREVIEW_API} fallbackHref={CTA.href} /></div>
          </div>
        </section>

        <Marquee items={["MCP", "Markdown", "llms.txt", "agents.md", "Brand voice", "Catalog", "Policies", "FAQ"]} />

        <Reveal as="section" id="how" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="How it works" title="From a web address to a working brand guide." />
          <div className="mt-12">
            <Steps items={[
              ["Paste your store address", "We read your home page, policies, About and FAQ pages, top collections and product list. Public pages only, following your robots.txt."],
              ["We build five documents", "Brand voice, catalog, policies, FAQ and an agent guide. Prices and stock come straight from your product data."],
              ["Connect your AI tools", "Add one private link to Claude, Cursor or any MCP tool, or use plain Markdown links for tools that do not speak MCP."],
            ]} />
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="What you get" title="Five documents your AI tools can trust." />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {DOCUMENTS.map((d) => (
              <li key={d.file} className="bg-surface p-6">
                <p className="text-sm text-muted">{d.file}</p>
                <h3 className="mt-6 text-[19px] leading-[1.3] font-normal">{d.name}</h3>
                <p className="mt-2 text-[15px] leading-6 text-muted">{d.blurb}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <dl className="grid gap-10 sm:grid-cols-3">
            {[
              [<CountUp key="a" to={5} />, "documents for every store"],
              [<CountUp key="b" to={15} />, "pages and products in a free preview"],
              [<CountUp key="c" to={0} />, "Shopify logins we ask for"],
            ].map(([n, l], i) => (
              <div key={i} className="border-t border-primary pt-5">
                <dt className="text-[56px] sm:text-[72px] leading-none tracking-[-0.045em]">{n}</dt>
                <dd className="mt-3 text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="Why Klyroo Context" title="Accurate by design, in your control." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => <Feature key={f.title} icon={f.icon} title={f.title}>{f.text}</Feature>)}
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-[900px] px-4 sm:px-6 py-24 border-t border-line">
          <SectionHead eyebrow="Questions" title="Before you paste your address." center />
          <div className="mt-10">
            <Faq items={[
              ["Do I need to install anything on Shopify?", "No. Klyroo reads your public storefront, the same pages a customer sees. It never asks for your Shopify login or admin access."],
              ["Is it only for Shopify stores?", "It is built for Shopify storefronts first, because it uses the public product list Shopify stores expose. Other sites can still produce brand and policy documents, without the product catalog."],
              ["Which AI tools does it work with?", "Any tool that can connect to a remote MCP server, or read a Markdown link. Support differs by tool and changes often, so the docs say how to connect each one."],
              ["Can the AI still get things wrong?", "Yes, AI tools can make mistakes. Klyroo gives them accurate source material and rules, and the catalog comes from your data rather than a model, but you should still review what AI writes for your customers."],
              ["Who can read my guide?", "Only people who have your private link or token, and you can revoke it. Previews expire after 24 hours."],
              ["Will you crawl my site hard?", "No. We read a small number of pages slowly, follow robots.txt, and identify ourselves as KlyrooBot. See the KlyrooBot page if you want to block us."],
            ]} />
          </div>
        </Reveal>

        <CtaBand title="Give your AI tools the facts." sub="Paste your store address and see what they would know." href={CTA.href} label={CTA.label} />
      </main>
      <MarketingFooter />
    </div>
  );
}
