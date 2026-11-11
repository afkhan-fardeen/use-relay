import type { CSSProperties } from "react";

/** Reveals a line word by word (pure CSS, so it needs no JavaScript and works in server components). */
export function SplitText({ text, className = "", start = 0 }: { text: string; className?: string; start?: number }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <span className="word-in inline-block" style={{ "--i": i + start } as CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}
