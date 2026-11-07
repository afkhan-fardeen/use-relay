import { StatusChip } from "@/components/status";
import { connection } from "next/server";
import { Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { resources } from "@/lib/export";
import { supabaseServer } from "@/lib/supabase/server";
import { ConnectForm, StoreActions } from "./store-forms";

const needed = Array.from(new Set(resources.map((r) => r.scope))).concat("read_locations");

function when(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function StoresPage() {
  await connection(); // request-time only: reads the signed-in user
  const supabase = await supabaseServer();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, shop_domain, status, granted_scopes, currency_code, last_checked_at, last_error")
    .order("created_at");

  return (
    <>
      <PageHeader title="Stores" sub="Connect a store with credentials from a Shopify app you create. We only ask for read access." />

      <div className="grid lg:grid-cols-[1fr_460px] gap-6 items-start">
        <div className="space-y-4">
          {(stores ?? []).length === 0 && (
            <Card className="!p-6">
              <p className="font-normal">No stores yet</p>
              <p className="text-sm text-muted mt-1">Follow the steps on the right to connect your first store.</p>
            </Card>
          )}
          {(stores ?? []).map((s) => (
            <Card key={s.id} className="!p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-normal">{s.shop_domain}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Last checked {when(s.last_checked_at)}{s.currency_code ? ` · ${s.currency_code}` : ""}
                  </p>
                </div>
                <StatusChip status={s.status} />
              </div>
              {s.granted_scopes.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.granted_scopes.map((x: string) => <Chip key={x} tone="outline">{x}</Chip>)}
                </div>
              )}
              {s.last_error && <p className="mt-4 text-sm text-danger">{s.last_error}</p>}
              <StoreActions storeId={s.id} connected={s.status !== "disconnected"} />
            </Card>
          ))}
        </div>

        <Card featured className="!p-6">
          <Eyebrow>Connect a store</Eyebrow>
          <ol className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs">1</span>
              <span>In the Shopify <span className="font-normal text-ink">Dev Dashboard</span>, create an app. It must be created by the account that owns the store.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs">2</span>
              <span>In Versions, add these <span className="font-normal text-ink">read-only</span> scopes and release the version:
                <span className="mt-2 flex flex-wrap gap-1.5">{needed.map((x) => <Chip key={x} tone="info">{x}</Chip>)}</span>
                <span className="mt-2 block text-xs text-muted">Optional: <span className="font-mono">read_all_orders</span> to export orders older than 60 days.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="grid place-items-center size-6 shrink-0 rounded-full border border-secondary/40 text-secondary text-xs">3</span>
              <span>Install the app on your store, then copy the Client ID and Client secret from <span className="font-normal text-ink">Settings</span>.</span>
            </li>
          </ol>
          <ConnectForm />
          <p className="mt-4 text-xs text-muted">Klyroo Export never writes to your store.</p>
        </Card>
      </div>
    </>
  );
}
