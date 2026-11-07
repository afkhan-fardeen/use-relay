import { Card, Chip, PageHeader } from "@/components/ui";

export default function BillingPage() {
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
