"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { changeSubscriptionPlan, createPortalLink, priceIds } from "@/lib/billing/paddle";
import { PAID_PLANS, type PaidPlan } from "@/lib/billing/plans";
import { supabaseServer } from "@/lib/supabase/server";

export type BillingState = { error?: string; message?: string } | undefined;

async function mySubscription() {
  const session = await getSession();
  if (!session) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("subscriptions").select("paddle_customer_id, paddle_subscription_id, status").maybeSingle();
  return { session, sub: data };
}

/** Sends the owner to Paddle's customer portal (payment method, invoices, cancel). */
export async function openPortal(): Promise<BillingState> {
  const ctx = await mySubscription();
  if (!ctx) return { error: "Your session ended. Log in again." };
  if (ctx.session.role !== "owner") return { error: "Only the account owner can manage billing." };
  if (!ctx.sub?.paddle_customer_id) return { error: "No subscription to manage yet." };
  const url = await createPortalLink(ctx.sub.paddle_customer_id, ctx.sub.paddle_subscription_id);
  if (!url) return { error: "We couldn't open the billing portal. Try again." };
  redirect(url);
}

/** Move an existing subscriber to another plan. The webhook updates our records when Paddle confirms. */
export async function changePlan(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const ctx = await mySubscription();
  if (!ctx) return { error: "Your session ended. Log in again." };
  if (ctx.session.role !== "owner") return { error: "Only the account owner can change the plan." };
  const plan = String(formData.get("plan") ?? "") as PaidPlan;
  if (!PAID_PLANS.includes(plan)) return { error: "Unknown plan." };
  const price = priceIds()[plan];
  if (!price) return { error: "That plan isn't available yet." };
  if (!ctx.sub?.paddle_subscription_id || ctx.sub.status === "canceled") return { error: "You don't have an active subscription to change." };

  const r = await changeSubscriptionPlan(ctx.sub.paddle_subscription_id, price);
  if (!r.ok) return { error: r.error };
  return { message: "Plan change requested. It will show here in a moment." };
}
