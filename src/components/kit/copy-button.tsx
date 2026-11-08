"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

/** Copies text to the clipboard and confirms it right on the button. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "Copied" : `${label} ${text}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked */ }
      }}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-ctl border border-line text-xs text-muted hover:text-ink hover:bg-wash transition-colors"
    >
      <Icon name={done ? "check" : "copy"} size={14} className={done ? "text-success" : ""} />
      {done ? "Copied" : label}
    </button>
  );
}
