import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { Builder } from "./builder";

export const metadata = { title: "New export — Klyroo Export" };

export default async function NewExportPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("stores")
    .select("id, shop_domain, granted_scopes")
    .eq("status", "connected")
    .order("created_at");
  const stores = (data ?? []).map((s) => ({ id: s.id, domain: s.shop_domain, scopes: (s.granted_scopes ?? []) as string[] }));

  return (
    <Suspense fallback={<p className="text-muted">Loading builder…</p>}>
      <Builder stores={stores} />
    </Suspense>
  );
}
