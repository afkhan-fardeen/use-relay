import { connection } from "next/server";
import { AppPicker } from "@/components/app-picker";
import { PageHeader } from "@/components/ui";
import { isAppSlug, type AppSlug } from "@/lib/apps";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Apps — Klyroo" };

export default async function AccountApps() {
  await connection();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("account_apps").select("app");
  const enabled = (data ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  return (
    <>
      <PageHeader title="Apps" sub="Switch Klyroo apps on or off. Turning one off only hides it; nothing is deleted. Every app has its own plan and billing." />
      <div className="max-w-3xl"><AppPicker initial={enabled} mode="multi" intent="manage" submitLabel="Save apps" /></div>
    </>
  );
}
