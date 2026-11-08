import { getEntitlements, type Entitlements } from "../billing/entitlements.ts";
import { supabaseAdmin } from "../supabase/admin.ts";

export type QrUsage = { ent: Entitlements; dynamicUsed: number; scansUsed: number; overScans: boolean };

/** How much of the plan an account is using. Going over the scan limit never stops a code working. */
export async function qrUsage(accountId: string): Promise<QrUsage> {
  const db = supabaseAdmin();
  const [ent, dyn, scans] = await Promise.all([
    getEntitlements(accountId, "qr"),
    db.from("qr_codes").select("id", { count: "exact", head: true }).eq("account_id", accountId).eq("mode", "dynamic").eq("active", true),
    db.rpc("qr_month_scans", { p_account: accountId }),
  ]);
  const scansUsed = Number(scans.data ?? 0);
  return { ent, dynamicUsed: dyn.count ?? 0, scansUsed, overScans: ent.limits.scansPerMonth > 0 && scansUsed > ent.limits.scansPerMonth };
}
