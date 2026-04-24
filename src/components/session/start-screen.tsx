"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startSessionAction } from "@/lib/actions";
import { Flame, Activity, Music2, Play, Clock } from "lucide-react";
import type { Dict } from "@/lib/i18n/dict";

interface Props {
  hasRiffs: boolean;
  t: Dict["session"];
  phases: { warmup: number; technique: number; songs: number };
}

export function StartScreen({ hasRiffs, t, phases }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      await startSessionAction();
      router.refresh();
    });

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-8">
      <header>
        <p className="text-sm font-mono tracking-wider text-[var(--color-muted)] uppercase">
          {t.startKicker}
        </p>
        <h1 className="text-4xl font-bold tracking-tight mt-1">
          {t.startTitle} <span className="gradient-text">{t.startTitleAccent}</span>
        </h1>
        <p className="text-[var(--color-muted-strong)] mt-2 max-w-xl">{t.startSubtitle}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-3">
        <PhaseCard
          icon={<Flame className="h-5 w-5 text-[var(--color-warning)]" />}
          title={t.phases.warmup}
          minutes={phases.warmup}
          body={t.phaseCopy.warmup}
        />
        <PhaseCard
          icon={<Activity className="h-5 w-5 text-[var(--color-accent)]" />}
          title={t.phases.technique}
          minutes={phases.technique}
          body={t.phaseCopy.technique}
        />
        <PhaseCard
          icon={<Music2 className="h-5 w-5 text-[var(--color-primary)]" />}
          title={t.phases.songs}
          minutes={phases.songs}
          body={t.phaseCopy.songs}
        />
      </div>

      {!hasRiffs && (
        <Card className="p-4 text-sm text-[var(--color-muted-strong)] border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/60">
          {t.needRiffs}{" "}
          <Link href="/riffs/new" className="text-[var(--color-accent)] underline">
            {t.needRiffsLink}
          </Link>{" "}
          {t.needRiffsAfter}
        </Card>
      )}

      <Button
        variant="primary"
        size="xl"
        className="w-full min-w-full"
        onClick={start}
        disabled={pending}
      >
        <Play className="h-5 w-5" />
        {pending ? t.starting : t.startButton}
      </Button>

      <p className="text-center text-xs text-[var(--color-muted)] flex items-center justify-center gap-1">
        <Clock className="h-3 w-3" />
        {t.phaseNote}
      </p>
    </div>
  );
}

function PhaseCard({
  icon,
  title,
  minutes,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  minutes: number;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-4">
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-xs font-mono text-[var(--color-muted)]">~{minutes}m</span>
      </div>
      <div className="font-semibold mt-2">{title}</div>
      <p className="text-xs text-[var(--color-muted)] mt-1">{body}</p>
    </div>
  );
}
