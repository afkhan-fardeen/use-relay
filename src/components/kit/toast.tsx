"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; text: string };
const Ctx = createContext<(tone: Tone, text: string) => void>(() => undefined);

const STYLE: Record<Tone, string> = {
  success: "border-success/30 text-success",
  error: "border-danger/30 text-danger",
  info: "border-secondary/25 text-secondary",
};

/** Small, self-dismissing messages in the corner. Use for "Saved" and "Copied", not for errors people must act on. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((tone: Tone, text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, tone, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === "error" ? 7000 : 3800);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed z-50 bottom-4 right-4 left-4 sm:left-auto flex flex-col items-end gap-2 pointer-events-none">
        {items.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={`anim-slide-in pointer-events-auto flex items-center gap-2.5 rounded-card border bg-surface px-4 py-3 text-sm shadow-[0_12px_32px_rgba(10,37,64,0.14)] ${STYLE[t.tone]}`}>
            <Icon name={t.tone === "success" ? "check" : t.tone === "error" ? "alert" : "info"} size={16} className="shrink-0" />
            <span className="text-ink">{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
