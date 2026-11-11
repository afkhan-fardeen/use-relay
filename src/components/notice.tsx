import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

const TONES = {
  error: { cls: "text-danger bg-danger/[0.05] border-danger/25", icon: "alert" as IconName, role: "alert" as const },
  warning: { cls: "text-warning bg-warning/[0.06] border-warning/30", icon: "alert" as IconName, role: "status" as const },
  success: { cls: "text-success bg-success/[0.06] border-success/25", icon: "check" as IconName, role: "status" as const },
  info: { cls: "text-ink bg-surface border-line-strong", icon: "info" as IconName, role: "status" as const },
};

/** One consistent way to say something went wrong, worked, or needs attention. Never relies on colour alone. */
export function Notice({ tone, children, className = "" }: { tone: keyof typeof TONES; children: ReactNode; className?: string }) {
  const t = TONES[tone];
  return (
    <p role={t.role} className={`anim-pop-in flex items-start gap-2.5 rounded-ctl border px-3.5 py-2.5 text-sm leading-5 ${t.cls} ${className}`}>
      <Icon name={t.icon} size={16} className="mt-0.5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
