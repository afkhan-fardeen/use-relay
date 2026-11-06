import { StatusChip } from "@/components/status";
import { Button, Card, Chip, Eyebrow, Field, PageHeader, inputCls } from "@/components/ui";
import { resources, stores } from "@/lib/export";

const scopes = Array.from(new Set(resources.map((r) => r.scope)));

export default function StoresPage() {
  return (
    <>
      <PageHeader title="Stores" sub="Connect a store with credentials from a Shopify app you create. We only ask for read access." />

      <div className="grid lg:grid-cols-[1fr_460px] gap-6 items-start">
        <div className="space-y-4">
          {stores.map((s) => (
            <Card key={s.id} className="!p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-normal">{s.domain}</p>
                  <p className="text-xs text-muted mt-0.5">Last checked {s.checked}</p>
                </div>
                <StatusChip status={s.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.scopes.map((x) => <Chip key={x} tone="outline">{x}</Chip>)}
              </div>
              {s.error && <p className="mt-4 text-sm text-danger">{s.error}</p>}
              <div className="mt-5 flex gap-3">
                <Button variant="secondary" size="sm">{s.status === "connected" ? "Test connection" : "Reconnect"}</Button>
                <Button variant="tertiary" size="sm" className="text-sm text-muted">Disconnect</Button>
              </div>
            </Card>
          ))}
        </div>

        <Card featured className="!p-6">
          <Eyebrow>Connect a store</Eyebrow>
          <ol className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs font-normal">1</span>
              <span>In Shopify, open <span className="font-normal">Dev Dashboard</span> and create an app for this store.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs font-normal">2</span>
              <span>Give it <span className="font-normal">read-only</span> access to only what you plan to export:
                <span className="mt-2 flex flex-wrap gap-1.5">{scopes.map((x) => <Chip key={x} tone="info">{x}</Chip>)}</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs font-normal">3</span>
              <span>Install it on your store, then paste the credentials here.</span>
            </li>
          </ol>
          <form className="mt-6 space-y-4">
            <Field label="Store domain"><input className={inputCls} placeholder="your-store.myshopify.com" /></Field>
            <Field label="Client ID"><input className={inputCls} autoComplete="off" /></Field>
            <Field label="Client secret" hint="Encrypted at rest. You can revoke it in Shopify at any time.">
              <input type="password" className={inputCls} autoComplete="new-password" />
            </Field>
            <Button type="button" className="w-full">Test and connect</Button>
          </form>
          <p className="mt-4 text-xs text-muted">Userelay Export never writes to your store.</p>
        </Card>
      </div>
    </>
  );
}
