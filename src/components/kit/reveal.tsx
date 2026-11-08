"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Fades content up as it scrolls into view. Without JavaScript, or with reduced motion, it is simply visible. */
export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }: { as?: ElementType; delay?: number; className?: string; children: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.classList.add("js");
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("is-visible"); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined} {...rest}>
      {children}
    </Tag>
  );
}
