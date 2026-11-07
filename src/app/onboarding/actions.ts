"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { APPS, isAppSlug, type AppSlug } from "@/lib/apps";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AppsState = { error?: string } | undefined;

/** Save which apps this account uses, then open the first one. Owner only. */
export async function saveApps(_prev: AppsState, formData: FormData): Promise<AppsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (session.role !== "owner") return { error: "Only the account owner can change apps." };

  const chosen = [...new Set(formData.getAll("app").map(String))].filter(isAppSlug) as AppSlug[];
  if (chosen.length === 0) return { error: "Choose at least one app to continue." };

  const db = supabaseAdmin();
  // Turning an app off only hides it. Nothing is deleted.
  const del = await db.from("account_apps").delete().eq("account_id", session.accountId).not("app", "in", `(${chosen.join(",")})`);
  if (del.error) return { error: "We couldn't save that. Try again." };
  const ins = await db.from("account_apps").upsert(chosen.map((app) => ({ account_id: session.accountId, app })), { onConflict: "account_id,app" });
  if (ins.error) return { error: "We couldn't save that. Try again." };

  const first = APPS.find((a) => chosen.includes(a.slug))!;
  redirect(first.slug === "export" ? "/app/stores" : first.href);
}
