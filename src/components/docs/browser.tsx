"use client";

import { useState } from "react";
import { DocLink } from "@/components/docs/ui";
import { Icon } from "@/components/icons";

export type DocEntry = { slug: string; group: string; title: string; summary: string; text: string };

/** The docs index with a search box. Matches titles, summaries and the full text of every guide. */
export function DocsBrowser({ docs, groups }: { docs: Omit<DocEntry, "text">[]; groups: string[] }) {
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<DocEntry[] | null>(null);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  // The full text is fetched the first time someone starts searching.
  const load = () => { if (!index) fetch("/docs/search-index.json").then((r) => r.json()).then(setIndex).catch(() => undefined); };
  const source: DocEntry[] = index ?? docs.map((d) => ({ ...d, text: "" }));
  const results = !terms.length ? null : source
    .map((d) => {
      const head = `${d.title} ${d.summary}`.toLowerCase();
      const hits = terms.filter((t) => head.includes(t) || d.text.includes(t)).length;
      const titleHits = terms.filter((t) => head.includes(t)).length;
      return { d, score: hits === terms.length ? titleHits * 3 + hits : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.d);

  return (
    <>
      <div className="mt-8 relative max-w-xl">
        <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onFocus={load}
          onChange={(e) => { load(); setQ(e.target.value); }}
          aria-label="Search the documentation"
          placeholder="Search guides, for example “read_orders” or “refund”"
          className="w-full h-12 rounded-ctl border border-line-strong/70 bg-surface pl-11 pr-4 text-ink placeholder:text-muted/70"
        />
      </div>
      {results ? (
        <section aria-live="polite" className="mt-8">
          <p className="mb-4 text-sm text-muted">{results.length} {results.length === 1 ? "result" : "results"} for “{q.trim()}”</p>
          <div className="grid gap-3">
            {results.map((d) => <DocLink key={d.slug} href={`/docs/${d.slug}`} title={d.title} sub={`${d.group} · ${d.summary}`} />)}
            {results.length === 0 && <p className="rounded-card border border-dashed border-line-strong/70 p-6 text-sm text-muted">Nothing matched. Try fewer words, or <a className="text-primary underline" href="/support">ask us</a>.</p>}
          </div>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g} className="mt-12">
            <h2 className="text-[22px] font-normal mb-4">{g}</h2>
            <div className="grid gap-3">
              {docs.filter((d) => d.group === g).map((d) => <DocLink key={d.slug} href={`/docs/${d.slug}`} title={d.title} sub={d.summary} />)}
            </div>
          </section>
        ))
      )}
    </>
  );
}
