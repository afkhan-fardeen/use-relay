"use client";

import { useEffect, useRef } from "react";

/** A hairline at the top of the page that fills as you scroll. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => { raf = 0; const d = document.documentElement; const max = d.scrollHeight - d.clientHeight; if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? d.scrollTop / max : 0})`; };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5"><div ref={ref} className="h-full origin-left bg-primary" style={{ transform: "scaleX(0)" }} /></div>;
}
