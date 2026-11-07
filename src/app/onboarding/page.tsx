import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppPicker } from "@/components/app-picker";
import { Logo } from "@/components/logo";
import { isAppSlug, type AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Choose your app — Klyroo" };

async function Picker() {
  await connection();
  const session = await requireSession();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("account_apps").select("app");
  const enabled = (data ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  if (enabled.length > 0) redirect("/app"); // already set up
  const first = session.name.split(" ")[0];
  const { data: u } = await supabase.auth.getUser();
  const preferred = u.user?.user_metadata?.preferred_app;
  return (
    <>
      <h1 className="text-[32px] leading-[1.1] font-light">{first ? `Welcome, ${first}.` : "Welcome."}</h1>
      <p className="mt-2 text-[15px] text-muted max-w-xl">Which Klyroo app do you want to start with? Each one works on its own, with its own plan. You can add the other later.</p>
      <div className="mt-10">
        <AppPicker initial={[isAppSlug(preferred) ? preferred : "export"]} mode="single" intent="onboarding" submitLabel="Continue" />
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
