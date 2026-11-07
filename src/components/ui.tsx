import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

type BtnProps = {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "md" | "sm";
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({ variant = "primary", size = "md", href, className, children, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-normal transition-colors whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none tracking-normal";
  const sizes = size === "md" ? "h-12 px-6 rounded-ctl text-base" : "h-9 px-4 rounded-ctl text-sm";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-white text-primary border border-line-strong hover:bg-wash",
    tertiary: "text-primary hover:text-primary-hover px-0 h-auto rounded-none",
  }[variant];
  const cls = cx(base, variant === "tertiary" ? "text-base" : sizes, variants, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  featured,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        "border bg-surface",
        featured ? "rounded-feat border-line-strong/70" : "rounded-card border-line",
        padded && "p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Chip: fully rounded, lightly outlined, violet text on a quiet surface. */
export function Chip({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "outline" | "danger" | "info" | "success" | "warning" }) {
  const tones = {
    primary: "bg-surface text-primary border border-line-strong",
    success: "bg-success/[0.07] text-success border border-success/30",
    warning: "bg-warning/[0.07] text-warning border border-warning/30",
    info: "bg-secondary/[0.06] text-secondary border border-secondary/25",
    outline: "bg-surface text-muted border border-line",
    danger: "bg-surface text-danger border border-danger/40",
  }[tone];
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-normal leading-4 tracking-normal", tones)}>
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-5 font-normal text-muted tracking-normal">{children}</p>;
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
      <div>
        <h1 className="text-[32px] leading-[1.1] font-light">{title}</h1>
        {sub && <p className="text-[15px] text-muted mt-2 max-w-2xl">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-normal mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1.5">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full h-12 bg-surface border border-line-strong/70 rounded-ctl px-4 text-ink placeholder:text-muted/70 transition-colors";

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-line rounded-card p-6 bg-surface">
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-3 text-[32px] leading-[1.1] font-light tabular">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  );
}
