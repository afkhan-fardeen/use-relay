import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AppPicker } from "@/components/app-picker";
import { Logo } from "@/components/sidebar";
import { isAppSlug, type AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Choose your apps — Klyroo" };

async function Picker() {
  await connection();
  const session = await requireSession();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("account_apps").select("app");
  const enabled = (data ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  if (enabled.length > 0) redirect("/app"); // already set up
  const first = session.name.split(" ")[0];
  return (
    <>
      <h1 className="text-[32px] leading-[1.1] font-light">{first ? `Welcome, ${first}.` : "Welcome."}</h1>
      <p className="mt-2 text-[15px] text-muted max-w-xl">Which Klyroo apps do you want to use? Pick one or both. You can add more later.</p>
      <div className="mt-10">
        <AppPicker initial={["export"]} submitLabel="Continue" />
      </div>
    </>
  );
}

export default function Onboarding() {
  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-12"><Logo tool={null} /></div>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Picker />
        </Suspense>
      </div>
    </main>
  );
}
