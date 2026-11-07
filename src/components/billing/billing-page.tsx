import { Card, PageHeader } from "@/components/ui";
import { appInfo, type AppSlug } from "@/lib/apps";
import { requireSession } from "@/lib/dal";
import { getEntitlements } from "@/lib/billing/entitlements";
import { billingConfigured, productIds } from "@/lib/billing/dodo";
import { supabaseServer } from "@/lib/supabase/server";
import { PlanCards } from "./plan-cards";

/** One app's billing page. Every app bills separately. */
export async function AppBilling({ app }: { app: AppSlug }) {
  const session = await requireSession();
  const info = appInfo(app);

  if (!billingConfigured(app)) {
    return (
      <>
        <PageHeader title="Billing" sub={`Plans and payments for ${info.fullName}.`} />
        <Card featured className="!p-8 max-w-2xl">
          <h2 className="text-[22px] leading-[1.2] font-light">Free for now</h2>
          <p className="mt-3 text-sm text-muted leading-[22px]">
            Paid plans for {info.fullName} aren&apos;t switched on yet, so everything is free and there&apos;s nothing to pay. We&apos;ll tell you before that changes. Each Klyroo app has its own plan, so this never affects your other apps.
          </p>
        </Card>
      </>
    );
  }

  const supabase = await supabaseServer();
  const [{ data: sub }, ent] = await Promise.all([
    supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("app", app).maybeSingle(),
    getEntitlements(session.accountId, app),
  ]);

  return (
    <>
      <PageHeader title="Billing" sub={`Choose a plan for ${info.fullName}. Payments are handled securely by Dodo Payments. Other Klyroo apps bill separately.`} />
      <PlanCards
        app={app}
        planAvailable={Object.fromEntries(Object.keys(productIds(app)).map((k) => [k, true]))}
        isOwner={session.role === "owner"}
        currentPlan={ent.plan === "beta" ? "free" : ent.plan}
        sub={sub ? { status: sub.status, periodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end } : null}
      />
    </>
  );
}
