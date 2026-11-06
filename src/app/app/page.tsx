import Link from "next/link";
import { StatusChip } from "@/components/status";
import { Button, Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { history, num, schedules, templates } from "@/lib/export";

export default function Home() {
  const upcoming = schedules.filter((s) => !s.paused).slice(0, 3);
  return (
    <>
      <PageHeader
        title="What do you want to export?"
        sub="Start from a template, or build your own. Each one opens ready to run."
        actions={<Button variant="secondary" size="sm" href="/app/exports/new">Build from scratch</Button>}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/app/exports/new?template=${t.id}`}
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

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-10">
        <Card padded={false} className="overflow-hidden">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <Eyebrow>Recent exports</Eyebrow>
            <Link href="/app/history" className="text-sm font-normal hover:text-primary">View all →</Link>
          </div>
          <ul>
            {history.slice(0, 4).map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line last:border-0">
                <div>
                  <p className="font-normal text-sm">{h.name}</p>
                  <p className="text-xs text-muted mt-0.5">{h.when} · {h.status === "failed" ? "Not delivered" : `${num(h.rows)} rows`}</p>
                </div>
                <StatusChip status={h.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card padded={false} className="overflow-hidden h-fit">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <Eyebrow>Next scheduled</Eyebrow>
            <Link href="/app/schedules" className="text-sm font-normal hover:text-primary">Manage →</Link>
          </div>
          <ul>
            {upcoming.map((s) => (
              <li key={s.id} className="px-6 py-4 border-b border-line last:border-0">
                <p className="font-normal text-sm">{s.name}</p>
                <p className="text-xs text-muted mt-0.5">{s.frequency}</p>
                <p className="mt-2 text-xs text-secondary font-normal">{s.next}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
