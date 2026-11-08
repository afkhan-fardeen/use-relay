"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/dal";
import { APPS, isAppSlug, startPath, type AppSlug } from "@/lib/apps";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AppsState = { error?: string; message?: string } | undefined;

/**
 * Save which apps this account uses.
 *  - intent "onboarding": the person is picking where to start. Add the choice and open that app.
 *  - intent "manage": the Apps page. Make the account's apps exactly the chosen ones.
 * Turning an app off only hides it; nothing is deleted. Each app keeps its own billing.
 */
export async function saveApps(_prev: AppsState, formData: FormData): Promise<AppsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (session.role !== "owner") return { error: "Only the account owner can change apps." };

  const intent = formData.get("intent") === "manage" ? "manage" : "onboarding";
  const chosen = [...new Set(formData.getAll("app").map(String))].filter(isAppSlug) as AppSlug[];
  if (chosen.length === 0) return { error: intent === "manage" ? "Keep at least one app switched on." : "Choose an app to continue." };

  const db = supabaseAdmin();
  if (intent === "manage") {
    const del = await db.from("account_apps").delete().eq("account_id", session.accountId).not("app", "in", `(${chosen.join(",")})`);
    if (del.error) return { error: "We couldn't save that. Try again." };
  }
  const ins = await db.from("account_apps").upsert(chosen.map((app) => ({ account_id: session.accountId, app })), { onConflict: "account_id,app" });
  if (ins.error) return { error: "We couldn't save that. Try again." };

  if (intent === "manage") {
    revalidatePath("/account/apps");
    revalidatePath("/account");
    return { message: "Saved." };
  }
  const first = APPS.find((a) => chosen.includes(a.slug))!;
  redirect(startPath(first.slug));
}
