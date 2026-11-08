import type { ReactNode } from "react";

/** A small hint on hover or keyboard focus. CSS only, so it costs no JavaScript. */
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max max-w-[240px] -translate-x-1/2 rounded-ctl bg-ink px-2.5 py-1.5 text-xs leading-4 text-white opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}
