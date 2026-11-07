import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { MobileBar, Sidebar } from "@/components/sidebar";
import { Chip } from "@/components/ui";
import { isAppSlug, type AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

// Reads the signed-in user, so it streams in behind a Suspense boundary.
async function Shell({ children }: { children: React.ReactNode }) {
  await connection(); // request-time only: this reads the signed-in user
  const session = await requireSession();
  const supabase = await supabaseServer();
  const [{ data: appRows }, { data: stores }] = await Promise.all([
    supabase.from("account_apps").select("app"),
    supabase.from("stores").select("shop_domain, status").neq("status", "disconnected").order("created_at").limit(1),
  ]);
  const apps = (appRows ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  if (apps.length === 0) redirect("/onboarding"); // new accounts choose their apps first
  const store = stores?.[0];

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar email={session.email} name={session.name} apps={apps} storeName={store ? store.shop_domain.replace(".myshopify.com", "") : null} />
      <div className="flex-1 min-w-0">
        <MobileBar apps={apps} />
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10 h-16 border-b border-line">
          <div className="flex items-center gap-3 text-sm">
            <Chip tone="info">Beta</Chip>
            <span className="text-muted hidden sm:inline">Free while we test. Klyroo only reads your store data.</span>
          </div>
        </header>
        <main className="px-6 lg:px-10 py-10 max-w-[1280px]">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center text-muted">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
