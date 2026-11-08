import { connection } from "next/server";
import { QrDesigner } from "@/components/qr/designer";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { COMPANY } from "@/lib/company";
import { qrUsage } from "@/lib/qr/usage";

export const metadata = { title: "Create a QR code — Klyroo" };

export default async function NewQr() {
  await connection();
  const session = await requireSession();
  const usage = await qrUsage(session.accountId);
  return (
    <>
      <PageHeader title="Create a QR code" sub="Choose a type, make it yours, then download or save it." />
      <QrDesigner
        mode="app"
        host={COMPANY.domain}
        limits={{ maxDynamic: usage.ent.limits.maxDynamic, dynamicUsed: usage.dynamicUsed, customSlug: usage.ent.limits.customSlug > 0 }}
      />
    </>
  );
}
