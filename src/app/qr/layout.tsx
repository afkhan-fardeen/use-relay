import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export const metadata = { icons: { icon: "/brand/klyroo-qr-favicon.svg" } };

export default function QrLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center text-muted">Loading…</div>}>
      <AppShell area="qr">{children}</AppShell>
    </Suspense>
  );
}
