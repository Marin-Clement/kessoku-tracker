import Link from "next/link";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Empty } from "@/components/ui/empty";
import { PracticeBarChart } from "@/components/charts/practice-bar";
import { PracticeHeatmap } from "@/components/charts/heatmap";
import { PainChart } from "@/components/charts/pain-chart";
import {
  computeStreak,
  dailyPracticeLastNDays,
  listRiffs,
  listSessions,
  totalsAllTime,
} from "@/lib/queries";
import { formatDuration } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import { Award, BarChart3, Flame, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { t, locale } = await getDict();
  const totals = totalsAllTime();
  const streak = computeStreak();
  const last30 = dailyPracticeLastNDays(30);
  const last90 = dailyPracticeLastNDays(91);
  const sessions = listSessions(20);
  const riffs = listRiffs();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const avgPerSession =
    totals.session_count > 0 ? Math.round(totals.total_minutes / totals.session_count) : 0;
  const best = [...riffs]
    .filter((r) => r.target_bpm && r.current_bpm)
    .sort(
      (a, b) =>
        (b.current_bpm ?? 0) / (b.target_bpm ?? 1) -
        (a.current_bpm ?? 0) / (a.target_bpm ?? 1),
    )
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.stats.title}</h1>
        <p className="text-[var(--color-muted-strong)] mt-1">{t.stats.subtitle}</p>
      </header>

      {totals.session_count === 0 ? (
        <Empty
          icon={<BarChart3 className="h-10 w-10" />}
          title={t.stats.emptyTitle}
          description={t.stats.emptyDesc}
        />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.totalTime}</CardTitle>
                <Award className="h-4 w-4 text-[var(--color-primary)]" />
              </CardHeader>
              <CardValue>{formatDuration(totals.total_minutes)}</CardValue>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {totals.session_count}{" "}
                {totals.session_count === 1
                  ? t.dashboard.oneSession
                  : t.dashboard.manySessions}
              </p>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.avgSession}</CardTitle>
              </CardHeader>
              <CardValue>
                {avgPerSession}
                <span className="text-base text-[var(--color-muted)] ml-1">min</span>
              </CardValue>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.streak}</CardTitle>
                <Flame className="h-4 w-4 text-[var(--color-primary)]" />
              </CardHeader>
              <CardValue>
                {streak}
                <span className="text-base text-[var(--color-muted)] ml-1">
                  {streak === 1 ? t.common.day : t.common.days}
                </span>
              </CardValue>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.mastered}</CardTitle>
                <Target className="h-4 w-4 text-[var(--color-success)]" />
              </CardHeader>
              <CardValue>{riffs.filter((r) => r.status === "mastered").length}</CardValue>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {t.common.of} {riffs.length}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t.stats.last30}</CardTitle>
            </CardHeader>
            <PracticeBarChart data={last30} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.stats.painSignals}</CardTitle>
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                {t.stats.painHint}
              </span>
            </CardHeader>
            {last30.some((d) => d.pain_wrist !== null || d.pain_fingers !== null) ? (
              <PainChart data={last30} />
            ) : (
              <p className="text-sm text-[var(--color-muted)]">{t.stats.painEmpty}</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.stats.heatmap}</CardTitle>
            </CardHeader>
            <PracticeHeatmap data={last90} />
          </Card>

          {best.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.leaderboard}</CardTitle>
                <Badge variant="primary">{t.stats.closestToTarget}</Badge>
              </CardHeader>
              <div className="space-y-3">
                {best.map((r) => {
                  const pct = Math.min(
                    100,
                    Math.round((r.current_bpm! / r.target_bpm!) * 100),
                  );
                  return (
                    <Link
                      key={r.id}
                      href={`/riffs/${r.id}`}
                      className="block rounded-xl border border-[var(--color-border)] p-3 bg-[var(--color-bg-elevated)]/50 hover:border-[var(--color-primary)]/50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium">{r.title}</div>
                          {r.artist && (
                            <div className="text-xs text-[var(--color-muted)]">{r.artist}</div>
                          )}
                        </div>
                        <div className="font-mono text-sm text-right">
                          <span className="text-[var(--color-primary)]">{r.current_bpm}</span>
                          <span className="text-[var(--color-muted)]"> / {r.target_bpm}</span>
                          <div className="text-[10px] uppercase text-[var(--color-muted)]">
                            {pct}%
                          </div>
                        </div>
                      </div>
                      <Progress value={pct} />
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.stats.recent}</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(s.date).toLocaleDateString(dateLocale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">
                        W {s.warmup_minutes}m · T {s.technique_minutes}m · S {s.songs_minutes}m
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.pain_wrist != null && s.pain_wrist >= 4 && (
                        <Badge variant="danger">wrist {s.pain_wrist}</Badge>
                      )}
                      <Badge variant="primary">{formatDuration(s.duration_minutes)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
