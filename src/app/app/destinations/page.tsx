import { Button, Card, Chip, Eyebrow, Field, PageHeader, inputCls } from "@/components/ui";
import { destinations } from "@/lib/export";

export default function DestinationsPage() {
  return (
    <>
      <PageHeader title="Destinations" sub="Where finished files are sent. Credentials are encrypted and tested before saving." />
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-3">
          {destinations.map((d) => (
            <Card key={d.id} className="!p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span aria-hidden className="grid place-items-center size-10 rounded-ctl bg-secondary/[0.08] text-secondary text-xs font-normal">{d.type.slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="font-normal">{d.name} <span className="text-muted font-normal">· {d.type}</span></p>
                  <p className="text-xs text-muted mt-0.5">{d.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Chip>Verified</Chip>
                <Button variant="secondary" size="sm">Test</Button>
              </div>
            </Card>
          ))}
        </div>
        <Card featured className="!p-6">
          <Eyebrow>Add a destination</Eyebrow>
          <form className="mt-5 space-y-4">
            <Field label="Type">
              <select className={inputCls} defaultValue="SFTP">
                <option>SFTP</option><option>Google Drive</option><option>Dropbox</option><option>Email</option>
              </select>
            </Field>
            <Field label="Name"><input className={inputCls} placeholder="e.g. Warehouse SFTP" /></Field>
            <Field label="Host"><input className={inputCls} placeholder="sftp.example.com" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username"><input className={inputCls} autoComplete="off" /></Field>
              <Field label="Password"><input type="password" className={inputCls} autoComplete="new-password" /></Field>
            </div>
            <Field label="Folder"><input className={inputCls} placeholder="/inbound/orders" /></Field>
            <Button type="button" className="w-full">Test and save</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
