import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/kit/skeleton";
import { Card, Chip, Eyebrow, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = { title: "Admin — Klyroo", robots: { index: false } };

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">
      <Suspense fallback={<PageSkeleton cards={4} />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const when = (t: string | null) => (t ? new Date(t).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "–");

async function Dashboard() {
  await connection();
  await requireAdmin();
  const db = supabaseAdmin();
  const day = ago(1);
  const week = ago(7);
  const count = async (table: string) => (await db.from(table).select("id", { count: "exact", head: true })).count ?? 0;
  const [accounts, codes, subs, failed, errors, jobs24, scans7, recent, users] = await Promise.all([
    count("accounts"),
    count("qr_codes"),
    db.from("subscriptions").select("app, plan, status, current_period_end, cancel_at_period_end, account_id, accounts(name)").order("updated_at", { ascending: false }).limit(50),
    db.from("export_jobs").select("id, resource, error_code, error_detail, created_at, accounts(name)").eq("status", "failed").gte("created_at", week).order("created_at", { ascending: false }).limit(15),
    db.from("billing_events").select("event_id, event_type, detail, received_at").eq("status", "error").order("received_at", { ascending: false }).limit(10),
    db.from("export_jobs").select("id", { count: "exact", head: true }).gte("created_at", day),
    db.from("qr_scans").select("id", { count: "exact", head: true }).gte("at", week),
    db.from("accounts").select("id, name, created_at").order("created_at", { ascending: false }).limit(15),
    db.auth.admin.listUsers({ page: 1, perPage: 1 }),
  ]);
  const active = (subs.data ?? []).filter((s) => ["active", "trialing", "past_due"].includes(s.status));
  const mrr = { export: { starter: 19, growth: 49, scale: 99 }, qr: { pro: 20, business: 45 } } as Record<string, Record<string, number>>;
  const monthly = active.reduce((sum, s) => sum + (mrr[s.app]?.[s.plan] ?? 0), 0);

  return (
    <>
      <h1 className="text-[32px] font-light">Klyroo admin</h1>
      <p className="mt-1 text-sm text-muted">Read-only overview. Refunds are issued in the Dodo dashboard; accounts and rows in Supabase.</p>
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Accounts" value={String(accounts)} note={`${users.data && "total" in users.data ? users.data.total : "–"} users`} />
        <Stat label="Paid subscriptions" value={String(active.length)} note={`about £${monthly} / month`} />
        <Stat label="Exports, last 24h" value={String(jobs24.count ?? 0)} />
        <Stat label="QR codes" value={String(codes)} />
        <Stat label="QR scans, last 7 days" value={String(scans7.count ?? 0)} />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Card className="!p-6">
          <Eyebrow>Subscriptions</Eyebrow>
          <ul className="mt-4 divide-y divide-line text-sm">
            {(subs.data ?? []).map((s) => (
              <li key={`${s.account_id}-${s.app}`} className="py-2.5 flex items-center justify-between gap-3">
                <span className="truncate">{(s.accounts as unknown as { name: string } | null)?.name ?? s.account_id}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-muted">{s.app} {s.plan}</span>
                  <Chip tone={s.status === "active" ? "success" : s.status === "past_due" ? "warning" : "outline"}>{s.cancel_at_period_end ? "ending" : s.status}</Chip>
                </span>
              </li>
            ))}
            {!subs.data?.length && <li className="py-3 text-muted">No subscriptions yet.</li>}
          </ul>
        </Card>
        <Card className="!p-6">
          <Eyebrow>Newest accounts</Eyebrow>
          <ul className="mt-4 divide-y divide-line text-sm">
            {(recent.data ?? []).map((a) => (
              <li key={a.id} className="py-2.5 flex justify-between gap-3"><span className="truncate">{a.name}</span><span className="text-muted shrink-0">{when(a.created_at)}</span></li>
            ))}
          </ul>
        </Card>
        <Card className="!p-6">
          <Eyebrow>Failed exports, last 7 days</Eyebrow>
          <ul className="mt-4 divide-y divide-line text-sm">
            {(failed.data ?? []).map((j) => (
              <li key={j.id} className="py-2.5">
                <div className="flex justify-between gap-3"><span>{(j.accounts as unknown as { name: string } | null)?.name} · {j.resource}</span><span className="text-muted shrink-0">{when(j.created_at)}</span></div>
                <p className="text-xs text-muted mt-0.5">{j.error_code}: {String(j.error_detail ?? "").slice(0, 140)}</p>
              </li>
            ))}
            {!failed.data?.length && <li className="py-3 text-muted">None. Good.</li>}
          </ul>
        </Card>
        <Card className="!p-6">
          <Eyebrow>Billing webhook errors</Eyebrow>
          <ul className="mt-4 divide-y divide-line text-sm">
            {(errors.data ?? []).map((e) => (
              <li key={e.event_id} className="py-2.5">
                <div className="flex justify-between gap-3"><span>{e.event_type}</span><span className="text-muted shrink-0">{when(e.received_at)}</span></div>
                <p className="text-xs text-muted mt-0.5">{e.detail}</p>
              </li>
            ))}
            {!errors.data?.length && <li className="py-3 text-muted">None. Good.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
