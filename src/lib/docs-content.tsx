import type { ReactNode } from "react";
import { A, Code, H2, P, Steps, Table, Tip, UL, Warn } from "@/components/docs/ui";
import { COMPANY } from "@/lib/company";
import { DOCUMENTS, PLANS } from "@/lib/product";

export type DocGroup = "Start here" | "Connect your AI tools" | "Plans and data";
export type DocPage = { slug: string; group: DocGroup; title: string; summary: string; body: () => ReactNode };

const mail = <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>;
const strong = (t: string) => <strong className="font-normal">{t}</strong>;

export const DOCS: DocPage[] = [
  {
    slug: "getting-started",
    group: "Start here",
    title: "Get started with Klyroo Context",
    summary: "Build your first preview and see what AI tools would know about your store.",
    body: () => (
      <>
        <P>Klyroo Context reads your public website and builds a guide to your brand, products and policies. You connect your AI tools to that guide, so they answer from your facts. It never asks for your Shopify login, and it only reads pages a customer can see.</P>
        <Warn>Klyroo Context is in early access. Until the free preview opens, ask for access at {mail}.</Warn>
        <H2>Your first preview</H2>
        <Steps items={[
          { title: "Paste your store address", body: <P>Enter your store&apos;s web address on the home page, for example <Code>yourstore.com</Code>. No account or card is needed for a preview.</P> },
          { title: "Wait while we read your site", body: <P>We read your home page, policy pages, About and FAQ pages, a few collections and your public product list. It takes about a minute.</P> },
          { title: "Copy your links", body: <P>You get a private MCP link, an access token and Markdown links. Keep them private: anyone who has them can read your guide until it expires.</P> },
          { title: "Connect an AI tool", body: <P>Follow <A href="/docs/connect-mcp">Connect an MCP tool</A> or <A href="/docs/markdown-links">Use Markdown links</A>, then ask the tool a question about one of your products.</P> },
        ]} />
        <Tip>A preview link works for 24 hours and then everything is deleted. Paid plans keep your workspace and refresh it automatically.</Tip>
        <H2>The five documents</H2>
        <Table head={["Document", "What it holds"]} rows={DOCUMENTS.map((d) => [d.name, d.blurb])} />
        <H2>Need help?</H2>
        <P>Email {mail} or see the <A href="/support">support page</A>.</P>
      </>
    ),
  },
  {
    slug: "how-we-read-your-site",
    group: "Start here",
    title: "How we read your site",
    summary: "What KlyrooBot reads, how it behaves, and how to block it.",
    body: () => (
      <>
        <P>Klyroo reads your site with a program called KlyrooBot. It behaves like a polite visitor.</P>
        <UL>
          <li>It reads <Code>robots.txt</Code> first and obeys it.</li>
          <li>It reads a small number of public pages, one at a time, with a pause between requests.</li>
          <li>It reads your public product list (<Code>/products.json</Code>) for titles, variants, prices and stock status. The catalog document is built from that data, not written by an AI model.</li>
          <li>It does not log in, fill in forms or run scripts.</li>
        </UL>
        <H2>What if my site is not on Shopify?</H2>
        <P>You can still get brand, policy and FAQ documents from your public pages. The catalog needs a public product list, which Shopify stores provide.</P>
        <H2>Block KlyrooBot</H2>
        <P>Add this to your <Code>robots.txt</Code>:</P>
        <P><Code>User-agent: KlyrooBot</Code> then <Code>Disallow: /</Code></P>
        <P>More on the <A href="/bot">KlyrooBot page</A>.</P>
      </>
    ),
  },
  {
    slug: "connect-mcp",
    group: "Connect your AI tools",
    title: "Connect an MCP tool",
    summary: "Add your MCP link to Claude, Cursor or another MCP client.",
    body: () => (
      <>
        <P>MCP (Model Context Protocol) lets an AI tool call small, safe tools. Your link exposes three, all read-only:</P>
        <Table head={["Tool", "What it does"]} rows={[
          [<Code key="a">search_brand_metadata</Code>, "Finds documents by topic and returns a short summary of each."],
          [<Code key="b">read_brand_doc</Code>, "Returns one full document as Markdown."],
          [<Code key="c">lookup_sku_context</Code>, "Returns price, variants and stock for a SKU or product title."],
        ]} />
        <H2>Add it to your tool</H2>
        <Steps items={[
          { title: "Find the place to add a remote MCP server", body: <P>In most tools this is under settings, connectors or MCP servers, and it asks for a URL.</P> },
          { title: "Paste your MCP link", body: <P>It looks like <Code>https://mcp.useklyroo.com/w/your-workspace/mcp</Code>.</P> },
          { title: "Add the access token", body: <P>Send it as a bearer token: an <Code>Authorization</Code> header with the value <Code>Bearer your-token</Code>. Tools that let you add custom headers support this.</P> },
          { title: "Test it", body: <P>Ask: &ldquo;Use the brand tools to tell me the return policy and the price of our best-selling product.&rdquo;</P> },
        ]} />
        <Warn>Some tools only accept connections that sign in with OAuth and cannot send a bearer token. Sign-in based connections arrive with accounts. Until then, use <A href="/docs/markdown-links">Markdown links</A> for those tools.</Warn>
        <P>Tool menus change often, so check your tool&apos;s own documentation for where to add a remote MCP server.</P>
      </>
    ),
  },
  {
    slug: "markdown-links",
    group: "Connect your AI tools",
    title: "Use Markdown links",
    summary: "Give any tool your guide as plain Markdown.",
    body: () => (
      <>
        <P>For tools that cannot connect to MCP, such as custom GPTs, automation tools and scripts, your guide is also available as plain Markdown at private addresses:</P>
        <UL>
          <li><Code>full-context.md</Code>: all five documents in one file.</li>
          <li><Code>llms.txt</Code>: an index of the documents, with a link to each.</li>
          <li>One address per document, for example the catalog on its own.</li>
        </UL>
        <P>Each address includes your access token, or you can send the token as a bearer token instead. Anyone with the address can read the document, so treat it like a password. Tokens can be revoked, and previews expire after 24 hours.</P>
        <Tip>Paste <Code>full-context.md</Code> into a custom GPT&apos;s knowledge or fetch it from an automation to keep the tool current.</Tip>
      </>
    ),
  },
  {
    slug: "plans-and-limits",
    group: "Plans and data",
    title: "Plans and limits",
    summary: "What each plan includes.",
    body: () => (
      <>
        <P>Prices are in US dollars per month, excluding taxes. Paddle handles payment and tax as our Merchant of Record. Paid plans open when the service leaves early access.</P>
        <Table head={["Plan", "Price", "Includes"]} rows={PLANS.map((p) => [p.name, p.price === 0 ? "Free" : `$${p.price}/month`, p.features.join(". ")])} />
        <P>See <A href="/pricing">pricing</A> for the details and <A href="/refunds">billing and refunds</A> for cancellations and refunds.</P>
      </>
    ),
  },
  {
    slug: "troubleshooting",
    group: "Plans and data",
    title: "Troubleshooting",
    summary: "Fixes for the most common problems.",
    body: () => (
      <>
        <H2>&ldquo;That address cannot be used&rdquo;</H2>
        <P>Enter your public store address, such as <Code>yourstore.com</Code>. Addresses that point at private or internal networks are refused for safety.</P>
        <H2>&ldquo;robots.txt does not allow us to read it&rdquo;</H2>
        <P>Your site&apos;s <Code>robots.txt</Code> blocks KlyrooBot or all crawlers. Allow KlyrooBot, then try again.</P>
        <H2>&ldquo;We could not reach that store&rdquo;</H2>
        <P>Check the address and that the store is not password-protected. Password-protected storefronts cannot be read.</P>
        <H2>The catalog is empty</H2>
        <P>Your site may not publish a public product list. Brand and policy documents are still built from your pages.</P>
        <H2>My tool says unauthorized, or the preview expired</H2>
        <P>Check the token is sent exactly as shown, as a bearer token. Previews expire after 24 hours; build a new one.</P>
        <H2>Still stuck?</H2>
        <P>Email {mail} with your store address and what you saw.</P>
      </>
    ),
  },
  {
    slug: "privacy-and-data",
    group: "Plans and data",
    title: "Privacy and your data",
    summary: "What we read, keep and delete.",
    body: () => (
      <>
        <UL>
          <li>We read only your public pages and product list. We never ask for your Shopify login.</li>
          <li>We keep the documents and the web address, so your links keep working.</li>
          <li>Free previews, and everything in them, are deleted after 24 hours.</li>
          <li>Access tokens are stored only as hashes and can be revoked.</li>
          <li>We do not use your content to train AI models.</li>
        </UL>
        <P>Read the <A href="/privacy">privacy policy</A>, <A href="/dpa">data processing terms</A> and <A href="/security">security page</A> for the details.</P>
      </>
    ),
  },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
export const DOC_GROUP_NAMES = ["Start here", "Connect your AI tools", "Plans and data"] as const;
export const DOC_GROUPS = DOC_GROUP_NAMES.map((g) => ({ title: g, items: DOCS.filter((d) => d.group === g).map((d) => ({ slug: d.slug, title: d.title, summary: d.summary })) }));
