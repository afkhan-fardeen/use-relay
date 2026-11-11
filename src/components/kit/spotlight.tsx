"use client";

import { useRef, type ReactNode } from "react";

/** A soft light that follows the pointer across a surface, as a quiet hover effect. */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return <div ref={ref} onPointerMove={move} className={`spotlight relative ${className}`}>{children}</div>;
}
