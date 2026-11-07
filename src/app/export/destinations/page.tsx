import { Button, Card, Chip, PageHeader } from "@/components/ui";

export default function DestinationsPage() {
  return (
    <>
      <PageHeader title="Destinations" sub="Where finished files get sent, such as your 3PL, Drive or inbox." actions={<Chip tone="info">Coming soon</Chip>} />
      <Card featured className="!p-8 max-w-2xl">
        <h2 className="text-[22px] leading-[1.2] font-light">Delivery is coming with schedules</h2>
        <p className="mt-3 text-sm text-muted leading-[22px]">
          Planned destinations: email, Google Drive, Dropbox and SFTP. For now, every export is available to download from History for 7 days.
        </p>
        <div className="mt-6"><Button variant="secondary" href="/export/history">Open History</Button></div>
      </Card>
    </>
  );
}
