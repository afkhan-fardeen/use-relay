import { connection } from "next/server";
import { AppBilling } from "@/components/billing/billing-page";

export default async function ExportBilling() {
  await connection();
  return <AppBilling app="export" />;
}
