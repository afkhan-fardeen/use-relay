import { AppPicker } from "@/components/app-picker";
import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { isAppSlug, type AppSlug } from "@/lib/apps";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Apps — Klyroo" };

export default async function AppsPage() {
  await connection(); // request-time only: reads the signed-in user
  const supabase = await supabaseServer();
  const { data } = await supabase.from("account_apps").select("app");
  const enabled = (data ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  return (
    <>
      <PageHeader title="Apps" sub="Switch Klyroo apps on or off for your account. Turning one off only hides it; nothing is deleted." />
      <div className="max-w-3xl"><AppPicker initial={enabled} submitLabel="Save apps" /></div>
    </>
  );
}
