"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/lib/actions";
import type { Locale } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";

export function LangSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const toggle = (next: Locale) => {
    if (next === locale || pending) return;
    start(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
      <Languages className="h-3.5 w-3.5 text-[var(--color-muted)] ml-1 mr-0.5" />
      {(["en", "fr"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => toggle(l)}
          disabled={pending}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors",
            locale === l
              ? "bg-[var(--color-primary)] text-[#0a0910]"
              : "text-[var(--color-muted)] hover:text-[var(--color-fg)]",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
