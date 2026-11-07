import Link from "next/link";

/** The Klyroo mark: a violet tile with a white K. Also used for the favicon (src/app/icon.svg). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill="#533AFD" />
      <path d="M11 8.5v15M11 16.5 21.5 8.5M14.6 14.2l6.9 9.3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/", tool = null, iconOnly = false }: { href?: string; tool?: string | null; iconOnly?: boolean }) {
  return (
    <Link href={href} aria-label="Klyroo home" className="inline-flex items-center gap-2.5 text-[17px] text-ink">
      <LogoMark />
      {!iconOnly && (
        <span>
          Klyroo {tool && <span className="text-muted">{tool}</span>}
        </span>
      )}
    </Link>
  );
}
