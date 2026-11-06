import { StatusChip } from "@/components/status";
import { Button, Card, PageHeader } from "@/components/ui";
import { history, num } from "@/lib/export";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" sub="Every export, with its result. Files are kept for 90 days on Pro." />
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="text-left text-muted text-[13px] font-normal border-b border-line">
                <th className="px-6 py-4">Export</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4 text-right">Rows</th>
                <th className="px-3 py-4 text-right">Size</th>
                <th className="px-3 py-4 text-right">Duration</th>
                <th className="px-3 py-4">Trigger</th>
                <th className="px-3 py-4">Delivered to</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-6 py-4">
                    <p className="font-normal">{h.name}</p>
                    <p className="text-xs text-muted mt-0.5">{h.resource} · {h.when}</p>
                    {h.error && <p className="mt-2 text-xs text-danger max-w-xs">{h.error}</p>}
                  </td>
                  <td className="px-3 py-4"><StatusChip status={h.status} /></td>
                  <td className="px-3 py-4 text-right tabular">{h.rows ? num(h.rows) : "–"}</td>
                  <td className="px-3 py-4 text-right tabular">{h.size}</td>
                  <td className="px-3 py-4 text-right tabular">{h.duration}</td>
                  <td className="px-3 py-4 text-muted">{h.trigger}</td>
                  <td className="px-3 py-4 text-muted">{h.dest}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {h.status === "succeeded" && <Button variant="secondary" size="sm">Download</Button>}
                    {h.status === "failed" && <Button size="sm">Retry</Button>}
                    {h.status === "running" && <span className="text-xs text-secondary font-normal">In progress</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
