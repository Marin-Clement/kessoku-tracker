"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  data: { day: string; total_minutes: number }[];
}

function intensity(m: number) {
  if (m === 0) return 0;
  if (m < 15) return 1;
  if (m < 30) return 2;
  if (m < 60) return 3;
  return 4;
}

const tone = [
  "bg-[var(--color-border)]/40",
  "bg-[var(--color-primary)]/20",
  "bg-[var(--color-primary)]/40",
  "bg-[var(--color-primary)]/70",
  "bg-[var(--color-primary)]",
];

export function PracticeHeatmap({ data }: Props) {
  // Group into weeks of 7 from the earliest day shown
  const weeks: (typeof data)[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-2">
      {weeks.map((w, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {w.map((d) => (
            <div
              key={d.day}
              title={`${format(new Date(d.day + "T00:00:00"), "PP")} — ${d.total_minutes} min`}
              className={cn(
                "h-4 w-4 rounded-[5px] transition-transform hover:scale-125",
                tone[intensity(d.total_minutes)],
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
