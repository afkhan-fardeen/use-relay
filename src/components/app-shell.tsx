import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MobileBar, Sidebar } from "@/components/sidebar";
import { Chip } from "@/components/ui";
import { appInfo, isAppSlug, type AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

export type ShellArea = AppSlug | "account";

/** The signed-in frame for one app (or the account area). Streams in behind a Suspense boundary. */
export async function AppShell({ area, children }: { area: ShellArea; children: React.ReactNode }) {
  await connection(); // request-time only: this reads the signed-in user
  const session = await requireSession();
  const supabase = await supabaseServer();
  const [{ data: appRows }, { data: stores }] = await Promise.all([
    supabase.from("account_apps").select("app"),
    area === "export"
      ? supabase.from("stores").select("shop_domain, status").neq("status", "disconnected").order("created_at").limit(1)
      : Promise.resolve({ data: null }),
  ]);
  const apps = (appRows ?? []).map((r) => r.app).filter(isAppSlug) as AppSlug[];
  if (area !== "account") {
    if (apps.length === 0) redirect("/onboarding"); // new accounts choose an app first
    if (!apps.includes(area)) redirect("/account/apps"); // this app isn't switched on for the account
  }
  const store = stores?.[0];
  const status = area !== "account" ? appInfo(area).status : "live";

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar area={area} email={session.email} name={session.name} apps={apps} storeName={store ? store.shop_domain.replace(".myshopify.com", "") : null} />
      <div className="flex-1 min-w-0">
        <MobileBar area={area} apps={apps} />
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10 h-16 border-b border-line">
          <div className="flex items-center gap-3 text-sm">
            <Chip tone="info">{status === "preview" ? "Preview" : "Beta"}</Chip>
            <span className="text-muted hidden sm:inline">
              {area === "qr" ? "Free while QR is in preview." : "Free while we test. Klyroo only reads your store data."}
            </span>
          </div>
        </header>
        <main className="px-6 lg:px-10 py-10 max-w-[1280px]">{children}</main>
      </div>
    </div>
  );
}
