"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { appInfo, isAppSlug, type AppSlug } from "@/lib/apps";
import { changeSubscriptionPlan, createCheckout, createPortalLink, productIds } from "@/lib/billing/dodo";
import { paidPlans } from "@/lib/billing/plans";
import { siteUrl } from "@/lib/qr/site";
import { supabaseServer } from "@/lib/supabase/server";

export type BillingState = { error?: string; message?: string } | undefined;

async function mySubscription(app: AppSlug) {
  const session = await getSession();
  if (!session) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("subscriptions")
    .select("provider_customer_id, provider_subscription_id, status")
    .eq("app", app)
    .maybeSingle();
  return { session, sub: data };
}

/** Start a checkout for a plan and send the customer to the hosted payment page. */
export async function startCheckout(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const app = String(formData.get("app") ?? "");
  if (!isAppSlug(app)) return { error: "Unknown app." };
  const plan = String(formData.get("plan") ?? "");
  if (!paidPlans(app).includes(plan)) return { error: "Unknown plan." };
  const productId = productIds(app)[plan];
  if (!productId) return { error: "That plan isn't available yet." };
  const ctx = await mySubscription(app);
  if (!ctx) return { error: "Your session ended. Log in again." };
  if (ctx.session.role !== "owner") return { error: "Only the account owner can change the plan." };
  if (ctx.sub && ["active", "trialing", "past_due"].includes(ctx.sub.status)) return { error: "You already have a plan. Use Switch plan instead." };

  const r = await createCheckout({
    productId,
    email: ctx.session.email,
    accountId: ctx.session.accountId,
    app,
    plan,
    returnUrl: `${siteUrl()}${appInfo(app).href}/billing?checkout=done`,
  });
  if (!r.ok) return { error: r.error };
  redirect(r.url);
}

/** Sends the owner to the customer portal (payment method, invoices, cancel) for one app's subscription. */
export async function openPortal(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const app = String(formData.get("app") ?? "");
  if (!isAppSlug(app)) return { error: "Unknown app." };
  const ctx = await mySubscription(app);
  if (!ctx) return { error: "Your session ended. Log in again." };
  if (ctx.session.role !== "owner") return { error: "Only the account owner can manage billing." };
  if (!ctx.sub?.provider_customer_id) return { error: "No subscription to manage yet." };
  const url = await createPortalLink(ctx.sub.provider_customer_id);
  if (!url) return { error: "We couldn't open the billing portal. Try again." };
  redirect(url);
}

/** Move an existing subscriber to another plan of the same app. The webhook updates our records when it's confirmed. */
export async function changePlan(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const app = String(formData.get("app") ?? "");
  if (!isAppSlug(app)) return { error: "Unknown app." };
  const ctx = await mySubscription(app);
  if (!ctx) return { error: "Your session ended. Log in again." };
  if (ctx.session.role !== "owner") return { error: "Only the account owner can change the plan." };
  const plan = String(formData.get("plan") ?? "");
  if (!paidPlans(app).includes(plan)) return { error: "Unknown plan." };
  const productId = productIds(app)[plan];
  if (!productId) return { error: "That plan isn't available yet." };
  if (!ctx.sub?.provider_subscription_id || ctx.sub.status === "canceled") return { error: "You don't have an active subscription to change." };

  const r = await changeSubscriptionPlan(ctx.sub.provider_subscription_id, productId);
  if (!r.ok) return { error: r.error };
  return { message: "Plan change requested. It will show here in a moment." };
}
