import { Suspense } from "react";
import { MobileBar, Sidebar } from "@/components/sidebar";
import { Button, Chip } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { supabaseServer } from "@/lib/supabase/server";

// Reads the signed-in user, so it streams in behind a Suspense boundary.
async function Shell({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const supabase = await supabaseServer();
  const { data: stores } = await supabase
    .from("stores")
    .select("shop_domain, status")
    .neq("status", "disconnected")
    .order("created_at")
    .limit(1);
  const store = stores?.[0];

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar email={session.email} storeName={store ? store.shop_domain.replace(".myshopify.com", "") : null} />
      <div className="flex-1 min-w-0">
        <MobileBar />
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10 h-16 border-b border-line">
          <div className="flex items-center gap-3 text-sm">
            <Chip tone="info">Preview</Chip>
            <span className="text-muted hidden sm:inline">Exports below use sample data until the first real export is built.</span>
          </div>
          <Button size="sm" href="/app/exports/new">New export</Button>
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
