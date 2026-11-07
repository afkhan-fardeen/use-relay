import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { DocsNav } from "@/components/docs/nav";
import { DOC_GROUPS } from "@/lib/docs-content";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <DocsNav groups={DOC_GROUPS} />
        <main className="min-w-0 max-w-[760px] pb-16">{children}</main>
      </div>
      <MarketingFooter />
    </div>
  );
}
