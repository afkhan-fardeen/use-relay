import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

/** What to show when a list has nothing in it yet: say why, and offer the next step. */
export function EmptyState({ icon = "list", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="anim-fade-up rounded-card border border-dashed border-line-strong/70 px-6 py-14 text-center">
      <span className="mx-auto grid place-items-center size-12 rounded-full bg-primary/10 text-primary"><Icon name={icon} size={22} /></span>
      <h2 className="mt-5 text-[20px] leading-[1.25] font-normal">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-[22px]">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
