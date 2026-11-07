// What an account is allowed to do right now. One place, used by every limit check.

import { supabaseAdmin } from "../supabase/admin.ts";
import { billingConfigured } from "./paddle.ts";
import { BETA_LIMITS, planInfo, type Limits, type PlanKey } from "./plans.ts";

export type Entitlements = { plan: PlanKey | "beta"; limits: Limits; billingOn: boolean };

type Sub = { plan: string; status: string; current_period_end: string | null } | null;

/** Pure decision: which plan applies for this subscription row at this moment. */
export function planFor(sub: Sub, now = Date.now()): PlanKey {
  if (!sub) return "free";
  const paidStatus = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due"; // past_due: Paddle is still retrying payment
  const paidThrough = sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end).getTime() > now;
  if (paidStatus || paidThrough) return (["starter", "pro", "agency"].includes(sub.plan) ? sub.plan : "free") as PlanKey;
  return "free";
}

export async function getEntitlements(accountId: string, now = Date.now()): Promise<Entitlements> {
  if (!billingConfigured()) return { plan: "beta", limits: BETA_LIMITS, billingOn: false };
  const { data } = await supabaseAdmin().from("subscriptions").select("plan, status, current_period_end").eq("account_id", accountId).maybeSingle();
  const plan = planFor(data ?? null, now);
  return { plan, limits: planInfo(plan).limits, billingOn: true };
}
