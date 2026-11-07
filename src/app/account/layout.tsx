import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center text-muted">Loading…</div>}>
      <AppShell area="account">{children}</AppShell>
    </Suspense>
  );
}
