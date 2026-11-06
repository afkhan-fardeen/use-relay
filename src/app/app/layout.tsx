import { MobileBar, Sidebar } from "@/components/sidebar";
import { Button, Chip } from "@/components/ui";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileBar />
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10 h-16 border-b border-line">
          <div className="flex items-center gap-3 text-sm">
            <Chip tone="info">Demo data</Chip>
            <span className="text-muted hidden sm:inline">Files below are generated sample rows until a store is connected.</span>
          </div>
          <Button size="sm" href="/app/exports/new">New export</Button>
        </header>
        <main className="px-6 lg:px-10 py-10 max-w-[1280px]">{children}</main>
      </div>
    </div>
  );
}
