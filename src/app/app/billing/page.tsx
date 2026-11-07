import { Card, Chip, PageHeader } from "@/components/ui";
import { connection } from "next/server";
import { requireSession } from "@/lib/dal";
import { getEntitlements } from "@/lib/billing/entitlements";
import { billingConfigured, paddleEnv, priceIds, signAccount } from "@/lib/billing/paddle";
import { supabaseServer } from "@/lib/supabase/server";
import { PlanCards } from "./plan-cards";

export default async function BillingPage() {
  await connection(); // request-time only: reads the signed-in user
  const session = await requireSession();

  if (!billingConfigured()) {
    return (
      <>
        <PageHeader title="Billing" sub="Plans and payments." actions={<Chip tone="info">Beta</Chip>} />
        <Card featured className="!p-8 max-w-2xl">
          <h2 className="text-[22px] leading-[1.2] font-light">Free during the beta</h2>
          <p className="mt-3 text-sm text-muted leading-[22px]">
            Billing isn&apos;t switched on yet, so there&apos;s nothing to pay. While we test, each account can run up to 30 exports an hour and keep files for 7 days.
            We&apos;ll announce pricing before anything changes.
          </p>
        </Card>
      </>
    );
  }

  const supabase = await supabaseServer();
  const [{ data: sub }, ent] = await Promise.all([
    supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").maybeSingle(),
    getEntitlements(session.accountId),
  ]);

  return (
    <>
      <PageHeader title="Billing" sub="Choose a plan. Payments are handled securely by Paddle." />
      <PlanCards
        env={paddleEnv()}
        token={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!}
        priceIds={priceIds()}
        accountId={session.accountId}
        accountSig={signAccount(session.accountId)}
        email={session.email}
        isOwner={session.role === "owner"}
        currentPlan={ent.plan === "beta" ? "free" : ent.plan}
        sub={sub ? { status: sub.status, periodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end } : null}
      />
    </>
  );
}
