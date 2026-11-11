import Link from "next/link";

/** The Klyroo mark: two overlapping circles, in ink. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="16" r="8.5" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}

/** Wordmark: the mark plus "Klyroo" in regular-weight type. */
export function Logo({ href = "/", iconOnly = false }: { href?: string; tool?: string | null; iconOnly?: boolean; height?: number }) {
  return (
    <Link href={href} aria-label="Klyroo home" className="inline-flex items-center gap-2.5 text-ink">
      <LogoMark size={28} />
      {!iconOnly && <span className="text-[22px] leading-none tracking-[-0.045em]">Klyroo</span>}
    </Link>
  );
}
