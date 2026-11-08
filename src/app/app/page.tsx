import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { APPS, isAppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

// Launcher: sends a signed-in person to their app (or to choose one). Kept at /app so old links and sign-in still land somewhere sensible.
async function Go(): Promise<React.ReactNode> {
  await connection();
  await requireSession();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("account_apps").select("app");
  const enabled = (data ?? []).map((r) => r.app).filter(isAppSlug);
  const first = APPS.find((a) => enabled.includes(a.slug));
  redirect(first ? first.href : "/onboarding");
}

export default function Launcher() {
  return (
    <Suspense fallback={null}>
      <Go />
    </Suspense>
  );
}
