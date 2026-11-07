import Link from "next/link";
import { notFound } from "next/navigation";
import { DOCS, docBySlug } from "@/lib/docs-content";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = docBySlug(slug.join("/"));
  return doc ? { title: `${doc.title} — Klyroo docs`, description: doc.summary } : {};
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = docBySlug(slug.join("/"));
  if (!doc) notFound();
  const i = DOCS.indexOf(doc);
  const prev = DOCS[i - 1];
  const next = DOCS[i + 1];
  return (
    <article>
      <p className="text-sm text-primary">{doc.group}</p>
      <h1 className="mt-2 text-[36px] sm:text-[40px] leading-[1.1] font-light tracking-[-0.02em]">{doc.title}</h1>
      <p className="mt-4 text-[18px] leading-[28px] text-muted">{doc.summary}</p>
      <div className="mt-8">{doc.body()}</div>
      <nav aria-label="More guides" className="mt-16 pt-6 border-t border-line grid sm:grid-cols-2 gap-4 text-sm">
        {prev ? <Link href={`/docs/${prev.slug}`} className="rounded-card border border-line p-4 hover:border-primary/50"><span className="text-muted">Previous</span><span className="block mt-1">{prev.title}</span></Link> : <span />}
        {next ? <Link href={`/docs/${next.slug}`} className="rounded-card border border-line p-4 hover:border-primary/50 sm:text-right"><span className="text-muted">Next</span><span className="block mt-1">{next.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}
