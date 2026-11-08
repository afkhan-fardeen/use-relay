"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A confirmation or form dialog built on the native <dialog>: focus is trapped, Escape closes it,
 * and focus returns to where it came from. `open` is controlled by the parent.
 */
export function Modal({ open, onClose, title, children, tone = "default" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; tone?: "default" | "danger" }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[min(92vw,460px)] rounded-feat border border-line bg-surface p-0 text-ink shadow-[0_24px_64px_rgba(10,37,64,0.22)]"
    >
      <div className="p-6">
        <h2 id="modal-title" className={`text-[22px] leading-[1.2] font-light ${tone === "danger" ? "text-danger" : ""}`}>{title}</h2>
        <div className="mt-3 text-sm text-muted leading-[22px]">{children}</div>
      </div>
    </dialog>
  );
}
