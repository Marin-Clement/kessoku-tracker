import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0..100
  className?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "danger";
}

export function Progress({ value, className, tone = "primary" }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  const tones: Record<NonNullable<ProgressProps["tone"]>, string> = {
    primary: "from-[var(--color-primary)] to-[var(--color-accent)]",
    accent: "from-[var(--color-accent)] to-[#6943db]",
    success: "from-[var(--color-success)] to-[#19a884]",
    warning: "from-[var(--color-warning)] to-[#ff7f3f]",
    danger: "from-[var(--color-danger)] to-[#ff86a8]",
  };
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
