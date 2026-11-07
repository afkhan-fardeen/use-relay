// What an account is allowed to do right now, per app. One place, used by every limit check.

import type { AppSlug } from "../apps.ts";
import { supabaseAdmin } from "../supabase/admin.ts";
import { billingConfigured } from "./dodo.ts";
import { BETA_LIMITS, paidPlans, planInfo, type Limits } from "./plans.ts";

export type Entitlements = { app: AppSlug; plan: string; limits: Limits; billingOn: boolean };

type Sub = { plan: string; status: string; current_period_end: string | null } | null;

/** Pure decision: which plan applies for this subscription row at this moment. */
export function planFor(app: AppSlug, sub: Sub, now = Date.now()): string {
  if (!sub) return "free";
  const paidStatus = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due"; // past_due: the provider is still retrying payment
  const paidThrough = sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end).getTime() > now;
  if (paidStatus || paidThrough) return paidPlans(app).includes(sub.plan) ? sub.plan : "free";
  return "free";
}

export async function getEntitlements(accountId: string, app: AppSlug = "export", now = Date.now()): Promise<Entitlements> {
  if (!billingConfigured(app)) return { app, plan: "beta", limits: BETA_LIMITS[app], billingOn: false };
  const { data } = await supabaseAdmin()
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("account_id", accountId)
    .eq("app", app)
    .maybeSingle();
  const plan = planFor(app, data ?? null, now);
  return { app, plan, limits: planInfo(app, plan).limits, billingOn: true };
}
