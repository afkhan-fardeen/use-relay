import { DocsBrowser } from "@/components/docs/browser";
import { DOCS } from "@/lib/docs-content";

export const metadata = { title: "Documentation — Klyroo", description: "Step-by-step guides for Klyroo Export and Klyroo QR." };

export default function DocsIndex() {
  const docs = DOCS.map((d) => ({ slug: d.slug, group: d.group, title: d.title, summary: d.summary }));
  return (
    <>
      <h1 className="text-[38px] leading-[1.1] font-light tracking-[-0.02em]">Documentation</h1>
      <p className="mt-4 text-[17px] leading-[27px] text-muted">Step-by-step guides for every Klyroo app. Can&apos;t find what you need? <a className="text-primary underline" href="/support">Ask us</a>.</p>
      <DocsBrowser docs={docs} groups={["Start here", "Klyroo Export", "Klyroo QR"]} />
    </>
  );
}
