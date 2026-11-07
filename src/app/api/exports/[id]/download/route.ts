import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

// Signed-in members only. Looks the file up as the user (so RLS decides access), then
// redirects to a 60-second signed link. The file itself is never public.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const supabase = await supabaseServer();
  const { data: file } = await supabase
    .from("export_files")
    .select("id, storage_key, deleted_at, expires_at")
    .eq("id", id)
    .maybeSingle();
  if (!file || file.deleted_at || new Date(file.expires_at) < new Date()) {
    return new NextResponse("This file has expired or doesn't exist.", { status: 404 });
  }

  const db = supabaseAdmin();
  const filename = file.storage_key.split("/").pop() ?? "export.csv";
  const signed = await db.storage.from("exports").createSignedUrl(file.storage_key, 60, { download: filename });
  if (signed.error || !signed.data) return new NextResponse("Couldn't prepare the download. Try again.", { status: 502 });

  await db.from("audit_log").insert({ account_id: session.accountId, actor_id: session.userId, action: "export.download", target: file.id });
  const res = NextResponse.redirect(signed.data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
