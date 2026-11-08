import Link from "next/link";
import { connection } from "next/server";
import { Button, Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { APPS, isAppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";
import { ChangePassword, DeleteAccount } from "./security";

export const metadata = { title: "Account — Klyroo" };

export default async function AccountHome() {
  await connection();
  const session = await requireSession();
  const supabase = await supabaseServer();
  const [{ data: acc }, { data: apps }] = await Promise.all([
    supabase.from("accounts").select("name").eq("id", session.accountId).maybeSingle(),
    supabase.from("account_apps").select("app"),
  ]);
  const enabled = (apps ?? []).map((r) => r.app).filter(isAppSlug);

  return (
    <>
      <PageHeader title="Account" sub="Your Klyroo account. Apps are separate products that share this login." />
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="!p-6">
          <Eyebrow>You</Eyebrow>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Name</dt><dd>{session.name || "Not set"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Email</dt><dd className="truncate">{session.email}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Account</dt><dd>{acc?.name ?? "–"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Role</dt><dd className="capitalize">{session.role}</dd></div>
          </dl>
        </Card>
        <Card className="!p-6">
          <Eyebrow>Your apps</Eyebrow>
          <ul className="mt-4 space-y-4">
            {APPS.map((a) => {
              const on = enabled.includes(a.slug);
              return (
                <li key={a.slug} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{a.fullName}</p>
                    <p className="text-xs text-muted mt-0.5">{on ? "Switched on" : "Not added"}</p>
                  </div>
                  {on ? (
                    <div className="flex items-center gap-4 text-sm">
                      <Link href={a.href} className="text-primary hover:text-primary-hover">Open</Link>
                      <Link href={`${a.href}/billing`} className="text-muted hover:text-primary">Billing</Link>
                    </div>
                  ) : <Chip tone="outline">Add in Apps</Chip>}
                </li>
              );
            })}
          </ul>
          <div className="mt-6"><Button variant="secondary" size="sm" href="/account/apps">Add or remove apps</Button></div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 max-w-4xl">
        <ChangePassword />
        <DeleteAccount isOwner={session.role === "owner"} />
      </div>
    </>
  );
}
