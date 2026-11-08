import { DocLink } from "@/components/docs/ui";
import { DOCS } from "@/lib/docs-content";

export const metadata = { title: "Documentation — Klyroo", description: "Step-by-step guides for Klyroo Export." };

export default function DocsIndex() {
  const groups = ["Start here", "Klyroo Export"] as const;
  return (
    <>
      <h1 className="text-[38px] leading-[1.1] font-light tracking-[-0.02em]">Documentation</h1>
      <p className="mt-4 text-[17px] leading-[27px] text-muted">Step-by-step guides for Klyroo Export. Can&apos;t find what you need? Email support@useklyroo.com.</p>
      {groups.map((g) => (
        <section key={g} className="mt-12">
          <h2 className="text-[22px] font-light mb-4">{g}</h2>
          <div className="grid gap-3">
            {DOCS.filter((d) => d.group === g).map((d) => <DocLink key={d.slug} href={`/docs/${d.slug}`} title={d.title} sub={d.summary} />)}
          </div>
        </section>
      ))}
    </>
  );
}
