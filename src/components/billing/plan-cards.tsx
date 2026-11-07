"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button, Card, Chip } from "@/components/ui";
import type { AppSlug } from "@/lib/apps";
import { PLANS } from "@/lib/billing/plans";
import { changePlan, openPortal } from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Paddle?: any;
  }
}

type Props = {
  app: AppSlug;
  env: "sandbox" | "production";
  token: string;
  priceIds: Record<string, string>;
  accountId: string;
  accountSig: string;
  email: string;
  isOwner: boolean;
  currentPlan: string;
  sub: { status: string; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

export function PlanCards(p: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState(false); // checkout just completed; waiting for the webhook
  const [changeState, changeAction, changing] = useActionState(changePlan, undefined);
  const [portalState, portalAction, opening] = useActionState(openPortal, undefined);
  const hasActiveSub = !!p.sub && ["active", "trialing", "past_due"].includes(p.sub.status);

  function init() {
    const Paddle = window.Paddle;
    if (!Paddle) return;
    if (p.env === "sandbox") Paddle.Environment.set("sandbox");
    Paddle.Initialize({
      token: p.token,
      eventCallback: (e: any) => {
        if (e?.name === "checkout.completed") setPaid(true);
      },
    });
    setReady(true);
    const items = Object.values(p.priceIds).map((priceId) => ({ priceId, quantity: 1 }));
    if (items.length) {
      Paddle.PricePreview({ items })
        .then((r: any) => {
          const out: Record<string, string> = {};
          for (const li of r?.data?.details?.lineItems ?? []) {
            const cycle = li.price?.billingCycle;
            out[li.price.id] = `${li.formattedTotals?.total ?? ""}${cycle ? ` / ${cycle.interval}` : ""}`;
          }
          setPrices(out);
        })
        .catch(() => undefined);
    }
  }

  // After a payment, re-read our records until the webhook has activated the plan (up to ~60s).
  useEffect(() => {
    if (!paid) return;
    const t = setInterval(() => router.refresh(), 3000);
    const stop = setTimeout(() => clearInterval(t), 60_000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [paid, router]);

  function checkout(plan: string) {
    const priceId = p.priceIds[plan];
    if (!priceId || !window.Paddle) return;
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: p.email },
      customData: { account_id: p.accountId, sig: p.accountSig, app: p.app },
      settings: { displayMode: "overlay", theme: "light", variant: "one-page" },
    });
  }

  return (
    <>
      <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onLoad={init} />

      {paid && p.currentPlan === "free" && (
        <Card featured className="!p-5 mb-6">
          <p className="text-sm" role="status">Payment received. Activating your plan…</p>
        </Card>
      )}
      {p.sub?.status === "past_due" && (
        <Card className="!p-5 mb-6 !border-danger/40">
          <p role="alert" className="text-sm text-danger">Your last payment didn&apos;t go through. Update your payment method to keep your plan.</p>
        </Card>
      )}
      {p.sub?.cancelAtPeriodEnd && p.sub.periodEnd && (
        <Card className="!p-5 mb-6">
          <p className="text-sm">Your plan ends on {new Date(p.sub.periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. You keep it until then.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS[p.app].map((plan) => {
          const current = plan.key === p.currentPlan;
          const priceId = plan.key === "free" ? undefined : p.priceIds[plan.key];
          const unavailable = plan.key !== "free" && !priceId;
          return (
            <Card key={plan.key} featured={current || plan.recommended} className={`!p-6 flex flex-col ${current ? "!border-primary/50" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] leading-[26px] font-light">{plan.name}</h2>
                {current ? <Chip>Current</Chip> : plan.recommended ? <Chip tone="info">Recommended</Chip> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              <p className="mt-5 text-[28px] leading-[1.1] font-light tabular min-h-[31px]">
                {plan.key === "free" ? "Free" : priceId ? prices[priceId] || "…" : "–"}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex gap-2">
                    <span aria-hidden className={f.soon ? "text-muted" : "text-primary"}>{f.soon ? "○" : "✓"}</span>
                    <span className={f.soon ? "text-muted" : ""}>{f.text}{f.soon && <span className="ml-2 text-[11px] text-secondary">Soon</span>}</span>
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
                <Button size="sm" className="mt-6" disabled={!ready} onClick={() => checkout(plan.key)}>
                  {ready ? `Choose ${plan.name}` : "Loading…"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {(changeState?.error || changeState?.message || portalState?.error) && (
        <p role={changeState?.error || portalState?.error ? "alert" : "status"} className={`mt-5 text-sm ${changeState?.error || portalState?.error ? "text-danger" : "text-primary"}`}>
          {changeState?.error ?? portalState?.error ?? changeState?.message}
        </p>
      )}

      {p.isOwner && hasActiveSub && (
        <form action={portalAction} className="mt-8">
          <input type="hidden" name="app" value={p.app} />
          <Button type="submit" variant="secondary" size="sm" disabled={opening}>{opening ? "Opening…" : "Manage payment method, invoices or cancel"}</Button>
        </form>
      )}
      <p className="mt-8 text-xs text-muted max-w-xl">
        Payments are processed by Paddle, our merchant of record. Taxes are calculated at checkout.
      </p>
    </>
  );
}
