import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";
import { Button, Card, Chip, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { qrSvg, DEFAULT_STYLE, type QrStyle } from "@/lib/qr/render";
import { shortUrl } from "@/lib/qr/site";
import { qrUsage } from "@/lib/qr/usage";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "My QR codes — Klyroo" };

const num = (n: number) => n.toLocaleString("en-GB");

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular">{num(used)} of {max >= 1_000_000 ? "unlimited" : num(max)}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-primary"}`} style={{ width: `${max >= 1_000_000 ? 4 : pct}%` }} />
      </div>
    </div>
  );
}

export default async function QrLibrary() {
  await connection();
  const session = await requireSession();
  const supabase = await supabaseServer();
  const [{ data: codes }, usage] = await Promise.all([
    supabase.from("qr_codes").select("id, name, kind, mode, content, slug, style, active, created_at").order("created_at", { ascending: false }).limit(200),
    qrUsage(session.accountId),
  ]);
  const list = codes ?? [];
  const lim = usage.ent.limits;

  return (
    <>
      <PageHeader title="My QR codes" sub="Everything you've made, in one place." actions={<Button size="sm" href="/qr/new"><Icon name="plus" size={16} />New code</Button>} />

      {lim.maxDynamic > 0 && (
        <Card className="!p-5 mb-6 grid sm:grid-cols-2 gap-6 max-w-3xl">
          <Meter label="Dynamic links" used={usage.dynamicUsed} max={lim.maxDynamic} />
          <Meter label="Scans this month" used={usage.scansUsed} max={lim.scansPerMonth} />
        </Card>
      )}
      {usage.overScans && (
        <Notice tone="warning" className="mb-6 max-w-3xl">
          You&apos;ve passed this month&apos;s scan limit. Your codes keep working. <Link href="/qr/billing" className="underline">Upgrade your plan</Link> to stay within your limit.
        </Notice>
      )}

      {list.length === 0 ? (
        <Card featured className="!p-10 text-center max-w-xl">
          <h2 className="text-[22px] leading-[1.2] font-light">Make your first QR code</h2>
          <p className="mt-2 text-sm text-muted">Pick a type, choose your colours, and download it as PNG or SVG. It takes a minute.</p>
          <div className="mt-6 flex justify-center"><Button href="/qr/new">Create a QR code</Button></div>
        </Card>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((c) => {
            const style = { ...DEFAULT_STYLE, ...(c.style as Partial<QrStyle>) } as QrStyle;
            let svg = "";
            try { svg = qrSvg(c.mode === "dynamic" ? shortUrl(c.slug!) : c.content, style); } catch { /* too long to draw */ }
            return (
              <li key={c.id}>
                <Link href={`/qr/${c.id}`} className="group block rounded-card border border-line bg-surface p-5 hover:border-primary/50 transition-colors">
                  <div className="grid place-items-center rounded-ctl p-3" style={{ background: style.bg }}>
                    {svg ? <div className="size-[140px]" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-[140px]" />}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <p className="truncate">{c.name}</p>
                    <div className="flex gap-1.5 shrink-0">
                      {c.mode === "dynamic" ? <Chip tone="info">Dynamic</Chip> : <Chip tone="outline">Static</Chip>}
                      {!c.active && <Chip tone="warning">Off</Chip>}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted truncate">{c.mode === "dynamic" ? `${shortUrl(c.slug!).replace(/^https?:\/\//, "")} → ${c.content.replace(/^https?:\/\//, "")}` : c.kind === "url" ? c.content.replace(/^https?:\/\//, "") : c.kind}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
