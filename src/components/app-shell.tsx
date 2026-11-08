import { connection } from "next/server";
import { MobileBar, Sidebar } from "@/components/sidebar";
import type { AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
  // One app today: switch it on for the account the first time they arrive.
  if (area !== "account" && !(appRows ?? []).some((r) => r.app === area)) {
    await supabaseAdmin().from("account_apps").upsert({ account_id: session.accountId, app: area }, { onConflict: "account_id,app" });
  }
  const store = stores?.[0];
  const nav = { area, email: session.email, name: session.name, storeName: store ? store.shop_domain.replace(".myshopify.com", "") : null };

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar {...nav} />
      <div className="flex-1 min-w-0">
        <MobileBar {...nav} />
        <main className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10 max-w-[1280px]">{children}</main>
      </div>
    </div>
  );
}
