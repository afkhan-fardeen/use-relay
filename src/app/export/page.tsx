import Link from "next/link";
import { connection } from "next/server";
import { StatusChip } from "@/components/status";
import { Button, Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { getResource, num, templates, type ResourceId } from "@/lib/export";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Home() {
  await connection(); // request-time only: reads the signed-in user
  const supabase = await supabaseServer();
  const [{ data: stores }, { data: jobs }] = await Promise.all([
    supabase.from("stores").select("id").eq("status", "connected").limit(1),
    supabase.from("export_jobs").select("id, resource, status, rows_written, created_at, config").order("created_at", { ascending: false }).limit(5),
  ]);
  const hasStore = (stores ?? []).length > 0;

  return (
    <>
      <PageHeader
        title="What do you want to export?"
        sub="Start from a template, or build your own. Each one opens ready to run."
        actions={<Button variant="secondary" size="sm" href="/export/new">Build from scratch</Button>}
      />

      {!hasStore && (
        <Card featured className="!p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-normal">Connect your Shopify store to run exports</p>
            <p className="text-sm text-muted mt-1">It takes about two minutes and we only ask for read access.</p>
          </div>
          <Button size="sm" href="/export/stores">Connect a store</Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/export/new?template=${t.id}`}
            className="group flex flex-col border border-line rounded-card p-6 bg-canvas hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <Chip tone="info">{t.category}</Chip>
              <span aria-hidden className="text-muted group-hover:text-primary transition-colors">→</span>
            </div>
            <h2 className="mt-6 text-[17px] leading-[24px] font-light">{t.name}</h2>
            <p className="mt-2 text-sm text-muted flex-1">{t.blurb}</p>
            <p className="mt-5 text-xs text-muted capitalize">{t.resource} · {t.columns.length} columns</p>
          </Link>
        ))}
      </div>

      <Card padded={false} className="overflow-hidden mt-10 max-w-3xl">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <Eyebrow>Recent exports</Eyebrow>
          <Link href="/export/history" className="text-sm hover:text-primary">View all →</Link>
        </div>
        {(jobs ?? []).length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted">Nothing yet. Your exports will show up here.</p>
        ) : (
          <ul>
            {(jobs ?? []).map((j) => {
              const cfg = j.config as { name?: string } | null;
              return (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line last:border-0">
                  <div>
                    <p className="text-sm">{cfg?.name || getResource(j.resource as ResourceId)?.label}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(j.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {j.status === "succeeded" ? ` · ${num(Number(j.rows_written))} rows` : ""}
                    </p>
                  </div>
                  <StatusChip status={j.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
