import { Button, Card, Chip, Eyebrow, PageHeader } from "@/components/ui";

const invoices = [
  { id: "INV-1042", date: "Nov 1, 2026", amount: "$39.00" },
  { id: "INV-0987", date: "Oct 1, 2026", amount: "$39.00" },
  { id: "INV-0931", date: "Sep 1, 2026", amount: "$39.00" },
];

const plans = [
  { name: "Free", price: "$0", note: "1 store · 3 manual exports a month · up to 1,000 rows", current: false },
  { name: "Starter", price: "$19", note: "1 store · 50k rows per export · 3 schedules · email and download", current: false },
  { name: "Pro", price: "$39", note: "3 stores · 1M rows · 25 schedules · Drive, Dropbox, SFTP · 90-day history", current: true },
  { name: "Agency", price: "$99", note: "25 stores · high volume · team seats · shared templates", current: false },
];

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" sub="Prices are placeholders until pricing is decided." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p) => (
          <Card key={p.name} featured={p.current} className={`!p-6 flex flex-col ${p.current ? "!border-primary/50" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] leading-[26px] font-light">{p.name}</h2>
              {p.current && <Chip>Current</Chip>}
            </div>
            <p className="mt-4 text-[37px] leading-[44px] font-normal tabular">{p.price}<span className="text-base font-normal text-muted"> /mo</span></p>
            <p className="mt-2 text-sm text-muted flex-1">{p.note}</p>
            <Button variant={p.current ? "secondary" : "primary"} size="sm" className="mt-6" disabled={p.current}>
              {p.current ? "Your plan" : `Switch to ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="!p-6">
          <Eyebrow>Usage this month</Eyebrow>
          <dl className="mt-5 space-y-5 text-sm">
            {[
              ["Stores", "2 of 3", 66],
              ["Schedules", "14 of 25", 56],
              ["Rows exported", "1.2M", 0],
            ].map(([l, v, w]) => (
              <div key={l as string}>
                <div className="flex justify-between"><dt className="text-muted">{l}</dt><dd className="font-normal tabular">{v}</dd></div>
                {(w as number) > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: `${w}%` }} /></div>
                )}
              </div>
            ))}
          </dl>
        </Card>
        <Card padded={false} className="overflow-hidden">
          <div className="px-6 py-5 border-b border-line"><Eyebrow>Invoices</Eyebrow></div>
          <ul>
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-6 py-4 border-b border-line last:border-0 text-sm">
                <span><span className="font-normal">{i.id}</span> <span className="text-muted ml-2">{i.date}</span></span>
                <span className="tabular">{i.amount}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
