import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ShellSkeleton } from "@/components/kit/skeleton";

export const metadata = { icons: { icon: "/brand/klyroo-export-favicon.svg" } };

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell area="export">{children}</AppShell>
    </Suspense>
  );
}
