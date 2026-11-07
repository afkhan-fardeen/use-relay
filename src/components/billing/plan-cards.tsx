"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";
import { Button, Card, Chip } from "@/components/ui";
import type { AppSlug } from "@/lib/apps";
import { PLANS, PLAN_COMMON } from "@/lib/billing/plans";
import { changePlan, openPortal, startCheckout } from "./actions";

type Props = {
  app: AppSlug;
  planAvailable: Record<string, boolean>;
  isOwner: boolean;
  currentPlan: string;
  sub: { status: string; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

export function PlanCards(p: Props) {
  const router = useRouter();
  const [checkoutState, checkoutAction, starting] = useActionState(startCheckout, undefined);
  const [changeState, changeAction, changing] = useActionState(changePlan, undefined);
  const [portalState, portalAction, opening] = useActionState(openPortal, undefined);
  const hasActiveSub = !!p.sub && ["active", "trialing", "past_due"].includes(p.sub.status);

  // Back from checkout (?checkout=done): re-read our records until the webhook has activated the plan (up to ~60s).
  useEffect(() => {
    if (p.currentPlan !== "free" || new URLSearchParams(window.location.search).get("checkout") !== "done") return;
    const t = setInterval(() => router.refresh(), 3000);
    const stop = setTimeout(() => clearInterval(t), 60_000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [p.currentPlan, router]);

  return (
    <>
      {p.sub?.status === "past_due" && (
        <Notice tone="error" className="mb-6">Your last payment didn&apos;t go through. Update your payment method to keep your plan.</Notice>
      )}
      {p.sub?.cancelAtPeriodEnd && p.sub.periodEnd && (
        <Card className="!p-5 mb-6">
          <p className="text-sm">Your plan ends on {new Date(p.sub.periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. You keep it until then.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS[p.app].map((plan) => {
          const current = plan.key === p.currentPlan;
          const unavailable = plan.key !== "free" && !p.planAvailable[plan.key];
          return (
            <Card key={plan.key} featured={current || plan.recommended} className={`!p-6 flex flex-col ${current ? "!border-primary/50" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] leading-[26px] font-light">{plan.name}</h2>
                {current ? <Chip>Current</Chip> : plan.recommended ? <Chip tone="info">Recommended</Chip> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              <p className="mt-5 text-[28px] leading-[1.1] font-light tabular min-h-[31px]">
                {plan.key === "free" ? "Free" : <>{plan.priceLabel}<span className="text-sm text-muted"> / month</span></>}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              {current ? (
                <Button variant="secondary" size="sm" className="mt-6" disabled>Your plan</Button>
              ) : plan.key === "free" ? (
                <p className="mt-6 text-xs text-muted">Cancel your subscription to move to Free.</p>
              ) : !p.isOwner ? (
                <p className="mt-6 text-xs text-muted">Only the owner can change plans.</p>
              ) : unavailable ? (
                <Button size="sm" className="mt-6" disabled>Not available yet</Button>
              ) : hasActiveSub ? (
                <form action={changeAction}>
                  <input type="hidden" name="app" value={p.app} />
                  <input type="hidden" name="plan" value={plan.key} />
                  <Button type="submit" size="sm" className="mt-6 w-full" disabled={changing}>{changing ? "Switching…" : `Switch to ${plan.name}`}</Button>
                </form>
              ) : (
                <form action={checkoutAction}>
                  <input type="hidden" name="app" value={p.app} />
                  <input type="hidden" name="plan" value={plan.key} />
                  <Button type="submit" size="sm" className="mt-6 w-full" disabled={starting}>{starting ? "Opening checkout…" : `Choose ${plan.name}`}</Button>
                  <p className="mt-2 text-xs text-muted">3-day free trial</p>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      {(checkoutState?.error || changeState?.error || portalState?.error) && <Notice tone="error" className="mt-5">{checkoutState?.error ?? changeState?.error ?? portalState?.error}</Notice>}
      {changeState?.message && <Notice tone="success" className="mt-5">{changeState.message}</Notice>}

      <p className="mt-6 text-sm text-muted">{PLAN_COMMON[p.app]}</p>

      {p.isOwner && hasActiveSub && (
        <form action={portalAction} className="mt-8">
          <input type="hidden" name="app" value={p.app} />
          <Button type="submit" variant="secondary" size="sm" disabled={opening}>{opening ? "Opening…" : "Manage payment method, invoices or cancel"}</Button>
        </form>
      )}
      <p className="mt-8 text-xs text-muted max-w-xl">
        Payments are processed by Dodo Payments, our Merchant of Record. Taxes are calculated at checkout. Every paid plan starts with a 3-day free trial.
      </p>
    </>
  );
}
