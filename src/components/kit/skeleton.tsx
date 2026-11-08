/** Placeholder shapes shown while data loads, so the page doesn't jump when it arrives. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className="anim-fade-in">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-9 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-card border border-line p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <Skeleton className="mt-6 h-9 w-28" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className="anim-fade-in rounded-card border border-line overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-line last:border-0">
          <Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** The signed-in frame while the user and page load: sidebar outline plus page skeleton. */
export function ShellSkeleton() {
  return (
    <div className="flex flex-1 min-h-screen" role="status" aria-label="Loading" aria-busy="true">
      <div className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line p-4 gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="mt-6 h-4 w-28" />
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-10"><PageSkeleton /></div>
    </div>
  );
}
