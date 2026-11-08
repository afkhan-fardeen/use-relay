import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";
import { CopyButton, DeleteButton, DownloadButtons, EditDetails } from "@/components/qr/code-actions";
import { Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { kindInfo, isQrKind } from "@/lib/qr/payload";
import { DEFAULT_STYLE, qrSvg, type QrStyle } from "@/lib/qr/render";
import { shortUrl } from "@/lib/qr/site";
import { qrUsage } from "@/lib/qr/usage";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

type Stats = {
  total: number;
  window: number;
  unique: number;
  by_day: { day: string; n: number }[];
  devices: { name: string; n: number }[];
  countries: { name: string; n: number }[];
  referrers: { name: string; n: number }[];
};

const DAYS = 30;
const num = (n: number) => n.toLocaleString("en-GB");
const DEVICE: Record<string, string> = { ios: "iPhone / iPad", android: "Android", desktop: "Computer", other: "Other" };

function lastDays(by: Stats["by_day"]): { day: string; n: number }[] {
  const map = new Map(by.map((d) => [d.day, d.n]));
  const out: { day: string; n: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day: d, n: map.get(d) ?? 0 });
  }
  return out;
}

function Breakdown({ title, rows, label }: { title: string; rows: { name: string; n: number }[]; label?: (n: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Card className="!p-5">
      <Eyebrow>{title}</Eyebrow>
      {rows.length === 0 ? <p className="mt-3 text-sm text-muted">No data yet.</p> : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.name} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{label ? label(r.name) : r.name}</span><span className="tabular text-muted">{num(r.n)}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.n / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function QrDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await requireSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await supabaseServer();
  const { data: code } = await supabase.from("qr_codes").select("id, name, kind, mode, fields, content, slug, style, active, created_at").eq("id", id).maybeSingle();
  if (!code) notFound();

  const dynamic = code.mode === "dynamic";
  const style = { ...DEFAULT_STYLE, ...(code.style as Partial<QrStyle>) } as QrStyle;
  const encoded = dynamic ? shortUrl(code.slug!) : code.content;
  let svg = "";
  try { svg = qrSvg(encoded, style); } catch { /* too long to draw */ }

  let stats: Stats | null = null;
  const usage = dynamic ? await qrUsage(session.accountId) : null;
  if (dynamic) {
    const { data } = await supabaseAdmin().rpc("qr_stats", { p_code: code.id, p_days: DAYS });
    stats = data as Stats;
  }
  const days = stats ? lastDays(stats.by_day) : [];
  const peak = Math.max(1, ...days.map((d) => d.n));
  const info = isQrKind(code.kind) ? kindInfo(code.kind) : null;

  return (
    <>
      <Link href="/qr" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"><Icon name="chevronLeft" size={16} />All codes</Link>
      <PageHeader title={code.name} actions={<>{dynamic ? <Chip tone="info">Dynamic</Chip> : <Chip tone="outline">Static</Chip>}{!code.active && <Chip tone="warning">Switched off</Chip>}</>} />

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
        <Card featured className="!p-6">
          <div className="grid place-items-center rounded-ctl border border-line p-4" style={{ background: style.bg }}>
            {svg ? <div className="w-full max-w-[260px] aspect-square" role="img" aria-label={`QR code for ${code.name}`} dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-muted">This code is too large to draw.</p>}
          </div>
          {svg && <div className="mt-5"><DownloadButtons svg={svg} name={code.name} /></div>}
          <p className="mt-4 text-xs text-muted">Created {new Date(code.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card className="!p-6">
            <Eyebrow>{dynamic ? "Short link" : info?.label ?? "Details"}</Eyebrow>
            {dynamic ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href={shortUrl(code.slug!)} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-hover break-all inline-flex items-center gap-1.5">{shortUrl(code.slug!)}<Icon name="external" size={14} /></a>
                <CopyButton text={shortUrl(code.slug!)} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted break-all">{code.kind === "wifi" || code.kind === "vcard" ? `${info?.label}: ${(code.fields as Record<string, string>).ssid ?? (code.fields as Record<string, string>).firstName ?? ""}` : code.content.slice(0, 200)}</p>
            )}
            <div className="mt-6 pt-6 border-t border-line">
              <EditDetails id={code.id} name={code.name} destination={dynamic ? code.content : ""} dynamic={dynamic} active={code.active} />
            </div>
          </Card>

          {dynamic && stats && usage && (
            <section aria-labelledby="stats-h">
              <h2 id="stats-h" className="text-[22px] leading-[1.2] font-light mb-4">Scans, last {DAYS} days</h2>
              {usage.overScans && <Notice tone="warning" className="mb-4">You&apos;ve passed this month&apos;s scan limit ({num(usage.scansUsed)} of {num(usage.ent.limits.scansPerMonth)}). Your codes keep working. <Link href="/qr/billing" className="underline">Upgrade</Link> to stay within your plan.</Notice>}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="!p-5"><Eyebrow>Scans</Eyebrow><p className="mt-2 text-[32px] leading-[1.1] font-light tabular">{num(stats.window)}</p></Card>
                <Card className="!p-5"><Eyebrow>Unique visitors</Eyebrow><p className="mt-2 text-[32px] leading-[1.1] font-light tabular">{num(stats.unique)}</p><p className="mt-1 text-xs text-muted">Counted per day</p></Card>
                <Card className="!p-5"><Eyebrow>All time</Eyebrow><p className="mt-2 text-[32px] leading-[1.1] font-light tabular">{num(stats.total)}</p></Card>
              </div>
              <Card className="!p-5 mt-4">
                <Eyebrow>Scans per day</Eyebrow>
                <div className="mt-4 flex items-end gap-[3px] h-32" role="img" aria-label={`Scans per day over the last ${DAYS} days, peak ${peak}`}>
                  {days.map((d) => (
                    <div key={d.day} title={`${d.day}: ${d.n}`} className="flex-1 rounded-sm bg-primary/80 min-h-[2px]" style={{ height: `${Math.max(2, (d.n / peak) * 100)}%`, opacity: d.n ? 1 : 0.25 }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted"><span>{days[0]?.day}</span><span>{days.at(-1)?.day}</span></div>
              </Card>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <Breakdown title="Devices" rows={stats.devices} label={(n) => DEVICE[n] ?? n} />
                <Breakdown title="Countries" rows={stats.countries} />
                <Breakdown title="Came from" rows={stats.referrers} />
              </div>
              <p className="mt-4 text-xs text-muted">We don&apos;t store IP addresses or use cookies. A visitor is a code that changes every day. Scans by automated link checkers aren&apos;t counted.</p>
            </section>
          )}

          {!dynamic && <Notice tone="info">Static codes hold their content inside the picture, so they can&apos;t be changed or counted. For that, create a dynamic link.</Notice>}

          <div className="pt-2"><DeleteButton id={code.id} dynamic={dynamic} /></div>
        </div>
      </div>
    </>
  );
}
