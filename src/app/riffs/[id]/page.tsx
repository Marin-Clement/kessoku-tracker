import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiffForm } from "@/components/riffs/riff-form";
import { BpmLineChart } from "@/components/charts/bpm-line";
import { getRiff, logsForRiff } from "@/lib/queries";
import { getDict } from "@/lib/i18n/server";
import { ChevronLeft, ExternalLink, Play, Target, TrendingUp, Trophy } from "lucide-react";
import type { RiffStatus } from "@/lib/types";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getDict();
  const { id } = await params;
  const riff = getRiff(id);
  if (!riff) notFound();
  const logs = logsForRiff(riff.id);

  const statusLabel: Record<RiffStatus, string> = {
    todo: t.status.todo,
    in_progress: t.status.in_progress,
    mastered: t.status.mastered,
  };
  const statusVariant: Record<RiffStatus, Parameters<typeof Badge>[0]["variant"]> = {
    todo: "default",
    in_progress: "primary",
    mastered: "success",
  };

  const pct =
    riff.target_bpm && riff.current_bpm
      ? Math.min(100, Math.round((riff.current_bpm / riff.target_bpm) * 100))
      : 0;
  const gap = riff.target_bpm && riff.current_bpm ? riff.target_bpm - riff.current_bpm : null;

  let etaDays: number | null = null;
  if (logs.length >= 3 && riff.target_bpm && riff.current_bpm && riff.current_bpm < riff.target_bpm) {
    const first = new Date(logs[0].created_at.replace(" ", "T") + "Z").getTime();
    const last = new Date(logs[logs.length - 1].created_at.replace(" ", "T") + "Z").getTime();
    const days = Math.max(1, (last - first) / 86_400_000);
    const bpmGained = logs[logs.length - 1].current_bpm - logs[0].current_bpm;
    const perDay = bpmGained / days;
    if (perDay > 0.1) {
      etaDays = Math.ceil((riff.target_bpm - riff.current_bpm) / perDay);
    }
  }

  const tags = (riff.tags ?? "").split(",").filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-6">
      <Link
        href="/riffs"
        className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.riffs.allRiffs}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={statusVariant[riff.status]}>{statusLabel[riff.status]}</Badge>
            {riff.artist && (
              <span className="text-[var(--color-muted)] text-sm">{riff.artist}</span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{riff.title}</h1>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-muted-strong)] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {riff.resource_url && (
            <a href={riff.resource_url} target="_blank" rel="noopener noreferrer">
              <Button variant="accent" size="lg">
                <ExternalLink className="h-4 w-4" />
                {t.riffs.detail.letsPlay}
              </Button>
            </a>
          )}
          <Link href="/session">
            <Button variant="primary" size="lg">
              <Play className="h-4 w-4" />
              {t.nav.session}
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>{t.common.current}</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
          </CardHeader>
          <CardValue>
            {riff.current_bpm ?? "—"}
            <span className="text-base text-[var(--color-muted)] ml-1">bpm</span>
          </CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.common.target}</CardTitle>
            <Target className="h-4 w-4 text-[var(--color-primary)]" />
          </CardHeader>
          <CardValue>
            {riff.target_bpm ?? "—"}
            <span className="text-base text-[var(--color-muted)] ml-1">bpm</span>
          </CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.riffs.detail.pr}</CardTitle>
            <Trophy className="h-4 w-4 text-[var(--color-warning)]" />
          </CardHeader>
          <CardValue>
            {riff.max_bpm ?? riff.current_bpm ?? "—"}
            <span className="text-base text-[var(--color-muted)] ml-1">bpm</span>
          </CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.common.progress}</CardTitle>
          </CardHeader>
          <CardValue>
            {pct}
            <span className="text-base text-[var(--color-muted)]">%</span>
          </CardValue>
          <Progress value={pct} className="mt-3" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.common.eta}</CardTitle>
          </CardHeader>
          <CardValue>
            {etaDays === null ? (
              <span className="text-[var(--color-muted)]">—</span>
            ) : (
              <>
                {etaDays}
                <span className="text-base text-[var(--color-muted)] ml-1">
                  {etaDays === 1 ? t.common.day : t.common.days}
                </span>
              </>
            )}
          </CardValue>
          {gap !== null && gap > 0 && (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {fmt(t.riffs.detail.gapToGo, { gap })}
            </p>
          )}
        </Card>
      </div>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.riffs.detail.progression}</CardTitle>
            <span className="text-xs text-[var(--color-muted)]">
              {fmt(logs.length === 1 ? t.riffs.detail.logsOne : t.riffs.detail.logsMany, {
                n: logs.length,
              })}
            </span>
          </CardHeader>
          <BpmLineChart logs={logs} target_bpm={riff.target_bpm} />
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] mb-4">
          {t.riffs.detail.editRiff}
        </h2>
        <RiffForm riff={riff} t={t.riffs.form} tStatus={t.status} tCommon={t.common} />
      </Card>
    </div>
  );
}
