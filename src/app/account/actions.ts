"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { cancelSubscriptionNow } from "@/lib/billing/dodo";
import { allow } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type AccountState = { error?: string; message?: string } | undefined;

/** Change password: the current password must be right, and the new one must differ and be long enough. */
export async function changePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (!allow(`pw:${session.userId}`, 10, 3_600_000)) return { error: "Too many attempts. Try again later." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 10) return { error: "Use a new password of at least 10 characters." };
  if (next.length > 200) return { error: "That password is too long." };
  if (next !== confirm) return { error: "The two new passwords don't match." };
  if (next === current) return { error: "Choose a password different from your current one." };

  const supabase = await supabaseServer();
  const check = await supabase.auth.signInWithPassword({ email: session.email, password: current });
  if (check.error) return { error: "Your current password is incorrect." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "We couldn't change the password. Try again." };
  return { message: "Password changed." };
}

/**
 * Delete the whole account and everything in it. Owner only, and only after typing the email and the password.
 * Active subscriptions are cancelled first, so nobody is charged after their data is gone. If a subscription
 * can't be cancelled, nothing is deleted.
 */
export async function deleteAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Log in again." };
  if (session.role !== "owner") return { error: "Only the account owner can delete the account." };
  if (!allow(`del:${session.userId}`, 5, 3_600_000)) return { error: "Too many attempts. Try again later." };
  if (String(formData.get("email") ?? "").trim().toLowerCase() !== session.email.toLowerCase()) return { error: "Type your account email exactly to confirm." };

  const supabase = await supabaseServer();
  const check = await supabase.auth.signInWithPassword({ email: session.email, password: String(formData.get("password") ?? "") });
  if (check.error) return { error: "Your password is incorrect." };

  const db = supabaseAdmin();
  const accountId = session.accountId;

  // 1. Stop billing.
  const { data: subs } = await db.from("subscriptions").select("provider_subscription_id, status").eq("account_id", accountId);
  for (const s of subs ?? []) {
    if (!s.provider_subscription_id || s.status === "canceled") continue;
    const r = await cancelSubscriptionNow(s.provider_subscription_id);
    if (!r.ok) return { error: "We couldn't cancel your subscription, so nothing was deleted. Try again, or email support." };
  }

  // 2. Remove stored export files, then the account (everything else cascades), then the sign-in users.
  const { data: files } = await db.from("export_files").select("storage_key").eq("account_id", accountId);
  const keys = (files ?? []).map((f) => f.storage_key).filter(Boolean);
  if (keys.length) await db.storage.from("exports").remove(keys);
  const { data: members } = await db.from("members").select("user_id").eq("account_id", accountId);
  const del = await db.from("accounts").delete().eq("id", accountId);
  if (del.error) return { error: "We couldn't delete the account. Try again, or email support." };
  for (const m of members ?? []) await db.auth.admin.deleteUser(m.user_id);

  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
