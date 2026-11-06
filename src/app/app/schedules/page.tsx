import { StatusChip } from "@/components/status";
import { Button, Card, Chip, PageHeader } from "@/components/ui";
import { schedules } from "@/lib/export";

export default function SchedulesPage() {
  return (
    <>
      <PageHeader
        title="Schedules"
        sub="Run saved exports automatically and send the file where it’s needed."
        actions={<Button size="sm" href="/app/exports/new">New schedule</Button>}
      />
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-muted text-[13px] font-normal border-b border-line">
                <th className="px-6 py-4">Export</th>
                <th className="px-3 py-4">Runs</th>
                <th className="px-3 py-4">Delivers to</th>
                <th className="px-3 py-4">Next run</th>
                <th className="px-3 py-4">Last run</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-6 py-4">
                    <p className="font-normal">{s.name}</p>
                    {s.incremental && <div className="mt-1.5"><Chip tone="info">Only changes</Chip></div>}
                  </td>
                  <td className="px-3 py-4">
                    <p>{s.frequency}</p>
                    <p className="text-xs text-muted mt-0.5">{s.tz}</p>
                  </td>
                  <td className="px-3 py-4 text-muted">{s.dest}</td>
                  <td className="px-3 py-4">{s.paused ? <Chip tone="outline">Paused</Chip> : <span className="text-secondary font-normal">{s.next}</span>}</td>
                  <td className="px-3 py-4"><StatusChip status={s.last} /></td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button variant="secondary" size="sm">{s.paused ? "Resume" : "Pause"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted max-w-2xl">
        “Only changes” exports just the records created or updated since the last successful run. Failed runs email you with a one-click retry.
      </p>
    </>
  );
}
