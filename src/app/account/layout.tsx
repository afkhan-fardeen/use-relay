import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ShellSkeleton } from "@/components/kit/skeleton";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell area="account">{children}</AppShell>
    </Suspense>
  );
}
