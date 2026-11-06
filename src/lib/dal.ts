import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Session = { userId: string; email: string; accountId: string; role: "owner" | "member" };

/** Verified session or null. Always asks Supabase (does not trust the cookie alone). */
export async function getSession(): Promise<Session | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: m } = await supabase
    .from("members")
    .select("account_id, role")
    .eq("user_id", data.user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!m) return null;
  return { userId: data.user.id, email: data.user.email ?? "", accountId: m.account_id, role: m.role as Session["role"] };
}

/** For pages and layouts: sends signed-out visitors to /login. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}
