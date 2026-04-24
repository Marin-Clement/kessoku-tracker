import * as React from "react";
import { cn } from "@/lib/utils";

export function Empty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-[var(--color-border-strong)] p-10",
        className,
      )}
    >
      {icon && (
        <div className="text-[var(--color-primary)] opacity-80">{icon}</div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--color-muted)] max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
