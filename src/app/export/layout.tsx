import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center text-muted">Loading…</div>}>
      <AppShell area="export">{children}</AppShell>
    </Suspense>
  );
}
