import Link from "next/link";
import { connection } from "next/server";
import { Card, Eyebrow, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";
import { ChangePassword, DeleteAccount } from "./security";

export const metadata = { title: "Account — Klyroo" };

export default async function AccountHome() {
  await connection();
  const session = await requireSession();
  const supabase = await supabaseServer();
  const { data: acc } = await supabase.from("accounts").select("name").eq("id", session.accountId).maybeSingle();

  return (
    <>
      <PageHeader title="Account" sub="Your Klyroo account." />
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
          <Eyebrow>Your app</Eyebrow>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Klyroo Export</p>
              <p className="text-xs text-muted mt-0.5">Shopify data to spreadsheets</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/export" className="text-primary hover:text-primary-hover">Open</Link>
              <Link href="/export/billing" className="text-muted hover:text-primary">Billing</Link>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 max-w-4xl">
        <ChangePassword />
        <DeleteAccount isOwner={session.role === "owner"} />
      </div>
    </>
  );
}
