import { LegalPage, Section, UL } from "@/components/legal";

export const metadata = { title: "Changelog — Klyroo", description: "What is new in Klyroo Data Exporter." };

export default function Changelog() {
  return (
    <LegalPage title="Changelog" intro="What changes in our apps, newest first.">
      <Section title="Klyroo Data Exporter 1.0 · November 2026">
        <UL items={[
          "Export products (one row per variant), inventory by location and collections.",
          "Excel (.xlsx) and CSV files, with SKUs and barcodes kept as text.",
          "Live preview, ready-made templates, filters by status, vendor and collection.",
          "Product and variant metafields on paid plans.",
          "Background exports with history, signed downloads and 7-day file retention.",
          "Free, Starter, Growth and Plus plans, billed by Shopify.",
        ]} />
      </Section>
    </LegalPage>
  );
}
