import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "accent" | "warning" | "danger" | "success";

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    default:
      "bg-[var(--color-bg-elevated)] text-[var(--color-muted-strong)] border-[var(--color-border)]",
    primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]/30",
    accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30",
    warning: "bg-[#3a2e0a] text-[var(--color-warning)] border-[var(--color-warning)]/30",
    danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30",
    success: "bg-[#0a3a29] text-[var(--color-success)] border-[var(--color-success)]/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
