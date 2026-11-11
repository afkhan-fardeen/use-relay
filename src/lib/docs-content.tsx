import type { ReactNode } from "react";
import { A, H2, P, Steps, Table, Tip, UL, Warn } from "@/components/docs/ui";
import { COMPANY } from "@/lib/company";
import { PLANS, TEMPLATES } from "@/lib/product";

export type DocGroup = "Start here" | "Using the app" | "Plans and data";
export type DocPage = { slug: string; group: DocGroup; title: string; summary: string; body: () => ReactNode };

const mail = <A href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</A>;
const strong = (t: string) => <strong className="font-normal">{t}</strong>;

export const DOCS: DocPage[] = [
  {
    slug: "getting-started",
    group: "Start here",
    title: "Get started with Klyroo Data Exporter",
    summary: "Install the app and download your first export in a few minutes.",
    body: () => (
      <>
        <P>Klyroo Data Exporter lives inside your Shopify Admin and turns your store data into Excel and CSV files. It only <em>reads</em> your store. It never changes anything.</P>
        <H2>Your first export</H2>
        <Steps items={[
          { title: "Install the app", body: <P>Add Klyroo Data Exporter from the Shopify App Store and approve the read-only permissions (products, inventory and locations).</P> },
          { title: "Open New export", body: <P>In the app&apos;s sidebar choose {strong("New export")}. Pick a template, or start from scratch.</P> },
          { title: "Check the preview", body: <P>The preview shows real rows from your store. Adjust filters and columns until it looks right.</P> },
          { title: "Run it and download", body: <P>Press {strong("Run export")}. You land on {strong("Export history")}, where the file appears as soon as it is ready. Large exports run in the background, so you can close the tab and come back.</P> },
        ]} />
        <Tip>Files are kept for 7 days and then deleted. Download what you need, or run the export again.</Tip>
        <H2>Need help?</H2>
        <P>Email {mail} or see the <A href="/support">support page</A>.</P>
      </>
    ),
  },
  {
    slug: "building-exports",
    group: "Using the app",
    title: "Building an export",
    summary: "Choose what to export, filter it, pick columns and format.",
    body: () => (
      <>
        <H2>What you can export</H2>
        <UL>
          <li>{strong("Products")}: one row per variant, with price, SKU, barcode, status, vendor, images and SEO.</li>
          <li>{strong("Inventory")}: stock per SKU and location (available, on hand, committed and more).</li>
          <li>{strong("Collections")}: collections and the rules or products inside them.</li>
        </UL>
        <H2>Templates</H2>
        <P>Templates are ready-made column sets for common jobs. Pick one, then change anything you like.</P>
        <Table head={["Template", "Good for"]} rows={TEMPLATES.map((t) => [t.name, t.blurb])} />
        <H2>Filters</H2>
        <P>Narrow an export by status, vendor or collection. Smaller exports finish faster and stay inside your plan&apos;s row limit.</P>
        <H2>Columns and metafields</H2>
        <P>Choose which columns to include and drag them into order. On paid plans you can add your store&apos;s metafields, using its own definitions. Product-level metafields start on Starter, variant-level on Growth.</P>
        <H2>Excel or CSV</H2>
        <UL>
          <li>{strong("Excel (.xlsx)")} has a styled header row, and keeps SKUs, barcodes and IDs as text so leading zeros survive.</li>
          <li>{strong("CSV")} opens anywhere. It includes a byte-order mark so Excel reads accents correctly, and neutralises cells that start with = + - or @ so they cannot run as formulas.</li>
        </UL>
      </>
    ),
  },
  {
    slug: "history-and-files",
    group: "Using the app",
    title: "Export history and files",
    summary: "Find, download and re-run your exports.",
    body: () => (
      <>
        <P>{strong("Export history")} lists every export with its status, row count and size.</P>
        <UL>
          <li>{strong("Queued / Running")}: the export is being built. The page updates by itself.</li>
          <li>{strong("Ready")}: press Download. Links are private and expire after 30 minutes, so just reopen the page for a fresh one.</li>
          <li>{strong("Failed")}: the row shows the reason. Fix it and press {strong("Run again")}.</li>
          <li>{strong("Expired")}: the file was deleted after 7 days. Run it again to get a new one.</li>
        </UL>
        <Tip>{strong("Run again")} repeats an export with the same settings, which is handy for weekly reports.</Tip>
      </>
    ),
  },
  {
    slug: "plans-and-limits",
    group: "Plans and data",
    title: "Plans and limits",
    summary: "What each plan includes, and how billing works.",
    body: () => (
      <>
        <P>Plans differ by the number of rows per export and a few advanced features. Prices are in US dollars, billed by Shopify every 30 days.</P>
        <Table head={["Plan", "Price", "Includes"]} rows={PLANS.map((p) => [p.name, p.price === 0 ? "Free" : `$${p.price}/month`, p.features.join(", ")])} />
        <H2>Changing plan</H2>
        <P>Open {strong("Plans")} in the app and choose a plan. Shopify shows its own approval page. To downgrade or cancel, use the same page.</P>
        <H2>Development stores</H2>
        <P>On Shopify development stores the app is free with the Growth plan&apos;s limits, so agencies can test everything.</P>
        <H2>What counts as a row?</H2>
        <P>One row in the file. Products export one row per variant, so a product with three variants counts as three rows.</P>
        <Warn>If an export is bigger than your plan allows, it stops with a message. Narrow it with filters or upgrade.</Warn>
      </>
    ),
  },
  {
    slug: "troubleshooting",
    group: "Plans and data",
    title: "Troubleshooting",
    summary: "Common problems and how to fix them.",
    body: () => (
      <>
        <H2>My export failed</H2>
        <P>The reason is shown in {strong("Export history")}. The usual causes are a row limit above your plan, or Shopify being busy. Press {strong("Run again")}, or narrow the export with filters.</P>
        <H2>The download link stopped working</H2>
        <P>Links last 30 minutes. Reload Export history for a new one. Files are deleted after 7 days.</P>
        <H2>Leading zeros disappeared in Excel</H2>
        <P>Use the Excel (.xlsx) format, which keeps SKUs and barcodes as text. If you open a CSV, import it as text columns instead of double-clicking it.</P>
        <H2>I can&apos;t see a metafield</H2>
        <P>Only metafields with a definition in your store appear. Product-level metafields need Starter or higher, and variant-level need Growth.</P>
        <H2>Something else</H2>
        <P>Email {mail} with your store address and what you expected. Please never send passwords.</P>
      </>
    ),
  },
  {
    slug: "privacy-and-data",
    group: "Plans and data",
    title: "Your data and permissions",
    summary: "What the app can see, store and delete.",
    body: () => (
      <>
        <UL>
          <li>The app asks only for read access to products, inventory and locations. It cannot change your store.</li>
          <li>It does not read customers or orders, and stores no customer personal data.</li>
          <li>Export files are private, and are deleted automatically after 7 days.</li>
          <li>When you uninstall, the access token is removed at once and the rest is erased after Shopify&apos;s shop erasure request.</li>
        </UL>
        <P>Details are in the <A href="/privacy">privacy policy</A> and on the <A href="/security">security page</A>.</P>
      </>
    ),
  },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
export const DOC_GROUP_NAMES = ["Start here", "Using the app", "Plans and data"] as const;
export const DOC_GROUPS = DOC_GROUP_NAMES.map((g) => ({ title: g, items: DOCS.filter((d) => d.group === g).map((d) => ({ slug: d.slug, title: d.title, summary: d.summary })) }));
