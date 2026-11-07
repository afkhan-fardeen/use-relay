import { Button, Card, Chip, PageHeader } from "@/components/ui";

export default function SchedulesPage() {
  return (
    <>
      <PageHeader title="Schedules" sub="Run a saved export automatically, hourly, daily or weekly." actions={<Chip tone="info">Coming soon</Chip>} />
      <Card featured className="!p-8 max-w-2xl">
        <h2 className="text-[22px] leading-[1.2] font-light">Scheduled exports are next</h2>
        <p className="mt-3 text-sm text-muted leading-[22px]">
          You&apos;ll be able to save any export, choose how often it runs, and have each new file sent to your email or delivered to a destination.
          Until then, run exports on demand and download them from History.
        </p>
        <div className="mt-6"><Button href="/export/new">Run an export now</Button></div>
      </Card>
    </>
  );
}
