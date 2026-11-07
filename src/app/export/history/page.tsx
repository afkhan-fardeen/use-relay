import Link from "next/link";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusChip } from "@/components/status";
import { Button, Card, PageHeader } from "@/components/ui";
import { getResource, num, type ResourceId } from "@/lib/export";
import { supabaseServer } from "@/lib/supabase/server";

const ACTIVE = ["queued", "starting", "shopify_running", "downloading", "building", "publishing", "delivering"];

function bytes(n: number | null) {
  if (!n) return "–";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function HistoryPage() {
  await connection(); // request-time only: reads the signed-in user
  const supabase = await supabaseServer();
  const { data: jobs } = await supabase
    .from("export_jobs")
    .select("id, resource, status, rows_written, bytes_written, error_code, error_detail, created_at, config, stores(shop_domain), export_files(id, deleted_at, expires_at)")
    .order("created_at", { ascending: false })
    .limit(50);
  const list = jobs ?? [];
  const running = list.some((j) => ACTIVE.includes(j.status));

  return (
    <>
      <AutoRefresh active={running} />
      <PageHeader
        title="History"
        sub="Every export and its result. Files are kept for 7 days."
        actions={<Button size="sm" href="/export/new">New export</Button>}
      />
      {list.length === 0 ? (
        <Card className="!p-8 max-w-xl">
          <h2 className="text-[19px] font-light">No exports yet</h2>
          <p className="mt-2 text-sm text-muted">Pick a template on the home page to run your first export.</p>
          <div className="mt-5"><Button variant="secondary" size="sm" href="/export">Browse templates</Button></div>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left text-muted text-[13px] font-normal border-b border-line">
                  <th className="px-6 py-4 font-normal">Export</th>
                  <th className="px-3 py-4 font-normal">Status</th>
                  <th className="px-3 py-4 text-right font-normal">Rows</th>
                  <th className="px-3 py-4 text-right font-normal">Size</th>
                  <th className="px-6 py-4 text-right font-normal">File</th>
                </tr>
              </thead>
              <tbody>
                {list.map((j) => {
                  const cfg = j.config as { name?: string } | null;
                  const store = j.stores as unknown as { shop_domain: string } | null;
                  const file = (j.export_files as { id: string; deleted_at: string | null; expires_at: string }[] | null)?.find((f) => !f.deleted_at && new Date(f.expires_at) > new Date());
                  const expired = j.status === "succeeded" && !file;
                  return (
                    <tr key={j.id} className="border-b border-line last:border-0 align-top">
                      <td className="px-6 py-4">
                        <p>{cfg?.name || getResource(j.resource as ResourceId)?.label}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {getResource(j.resource as ResourceId)?.label} · {store?.shop_domain?.replace(".myshopify.com", "") ?? "store"} · {ago(j.created_at)}
                        </p>
                        {j.status === "failed" && j.error_detail && <p className="mt-2 text-xs text-danger max-w-sm">{j.error_detail}</p>}
                        {j.status === "queued" && j.error_detail && <p className="mt-2 text-xs text-muted max-w-sm">Retrying: {j.error_detail}</p>}
                        {j.status === "succeeded" && j.error_detail && <p className="mt-2 text-xs text-muted max-w-sm">{j.error_detail}</p>}
                      </td>
                      <td className="px-3 py-4"><StatusChip status={j.status} /></td>
                      <td className="px-3 py-4 text-right tabular">{j.status === "succeeded" ? num(Number(j.rows_written)) : "–"}</td>
                      <td className="px-3 py-4 text-right tabular">{j.status === "succeeded" ? bytes(Number(j.bytes_written)) : "–"}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {file && <a href={`/api/exports/${file.id}/download`} className="inline-flex items-center h-9 px-4 rounded-ctl border border-line-strong text-primary text-sm hover:bg-wash">Download</a>}
                        {expired && <span className="text-xs text-muted">Expired</span>}
                        {j.status === "failed" && <Link href="/export/new" className="text-sm text-primary hover:text-primary-hover">Try again</Link>}
                        {ACTIVE.includes(j.status) && <span className="text-xs text-secondary">In progress</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
