import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Empty } from "@/components/ui/empty";
import { PracticeBarChart } from "@/components/charts/practice-bar";
import { PracticeHeatmap } from "@/components/charts/heatmap";
import {
  computeStreak,
  dailyPracticeLastNDays,
  getActiveSession,
  getAppSettings,
  listRiffs,
  staleActiveRiffs,
  tendinitisAlert,
  todaySession,
  totalsAllTime,
} from "@/lib/queries";
import { fmt, formatDuration } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import {
  AlertTriangle,
  Flame,
  Play,
  Target,
  Clock,
  Music2,
  ArrowRight,
  Sparkles,
  CalendarCheck2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { t } = await getDict();
  const streak = computeStreak();
  const last7 = dailyPracticeLastNDays(7);
  const last90 = dailyPracticeLastNDays(91);
  const alert = tendinitisAlert();
  const totals = totalsAllTime();
  const active = getActiveSession();
  const today = todaySession();
  const riffs = listRiffs();
  const settings = getAppSettings();
  const stale = staleActiveRiffs(4, 5);
  const inProgress = riffs.filter((r) => r.status === "in_progress").slice(0, 4);

  const weeklyMinutes = last7.reduce((a, d) => a + d.total_minutes, 0);
  const goal = settings.weekly_goal_minutes;
  const goalPct = goal > 0 ? Math.min(100, Math.round((weeklyMinutes / goal) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-mono tracking-wider text-[var(--color-muted)] uppercase">
            {t.dashboard.kicker}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t.dashboard.title} <span className="gradient-text">{t.dashboard.titleAccent}</span>
          </h1>
          <p className="text-[var(--color-muted-strong)] mt-2 max-w-xl">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/session">
            <Button size="lg" variant="primary">
              <Play className="h-4 w-4" />
              {active ? t.dashboard.resumeSession : t.dashboard.startSession}
            </Button>
          </Link>
        </div>
      </header>

      {alert.risk && (
        <div className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-5 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-[var(--color-danger)] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[var(--color-danger)] text-lg uppercase tracking-wide">
              {t.dashboard.tendinitisTitle}
            </h3>
            <p className="text-[var(--color-muted-strong)] mt-1 text-sm">
              {fmt(t.dashboard.tendinitisDesc, { days: alert.days })}
            </p>
          </div>
        </div>
      )}

      {active && (
        <div className="rounded-2xl border border-[var(--color-primary)]/50 bg-gradient-to-br from-[var(--color-primary-soft)] to-transparent p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-primary)]">
                {t.dashboard.sessionBanner}
              </div>
              <div className="font-semibold">{t.dashboard.sessionBannerDesc}</div>
            </div>
          </div>
          <Link href="/session">
            <Button variant="primary" size="md">
              {t.dashboard.resume} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.streak}</CardTitle>
            <Flame className="h-4 w-4 text-[var(--color-primary)]" />
          </CardHeader>
          <CardValue>
            {streak}
            <span className="text-base font-medium text-[var(--color-muted)] ml-2">
              {streak === 1 ? t.common.day : t.common.days}
            </span>
          </CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.thisWeek}</CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-accent)]" />
          </CardHeader>
          <CardValue>{formatDuration(weeklyMinutes)}</CardValue>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t.dashboard.weekTotal}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.todayCard}</CardTitle>
            <Play className="h-4 w-4 text-[var(--color-success)]" />
          </CardHeader>
          <CardValue>
            {today ? (
              formatDuration(today.duration_minutes)
            ) : (
              <span className="text-[var(--color-muted)]">—</span>
            )}
          </CardValue>
          {today && (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              W {today.warmup_minutes}m · T {today.technique_minutes}m · S {today.songs_minutes}m
            </p>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.allTime}</CardTitle>
            <Target className="h-4 w-4 text-[var(--color-warning)]" />
          </CardHeader>
          <CardValue>{formatDuration(totals.total_minutes)}</CardValue>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {totals.session_count}{" "}
            {totals.session_count === 1 ? t.dashboard.oneSession : t.dashboard.manySessions}
          </p>
        </Card>
      </div>

      {/* Weekly goal */}
      {goal > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.weeklyGoal}</CardTitle>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-[var(--color-success)]" />
              <span className="font-mono text-sm">
                <span className="text-[var(--color-primary)]">{weeklyMinutes}</span>
                <span className="text-[var(--color-muted)]"> / {goal} min</span>
              </span>
            </div>
          </CardHeader>
          <Progress
            value={goalPct}
            tone={goalPct >= 100 ? "success" : "primary"}
            className="h-3"
          />
          <p className="text-xs text-[var(--color-muted)] mt-2">
            {goalPct >= 100
              ? t.dashboard.weeklyGoalHit
              : fmt(t.dashboard.weeklyGoalToGo, { m: Math.max(0, goal - weeklyMinutes) })}
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.weeklyGoal}</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-[var(--color-muted)]" />
          </CardHeader>
          <p className="text-sm text-[var(--color-muted-strong)]">
            {t.dashboard.weeklyGoalNone}{" "}
            <Link
              href="/settings"
              className="text-[var(--color-primary)] underline underline-offset-2"
            >
              {t.dashboard.weeklyGoalConfigure}
            </Link>
          </p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t.dashboard.last7}</CardTitle>
            <Badge variant="primary">{formatDuration(weeklyMinutes)}</Badge>
          </CardHeader>
          <PracticeBarChart data={last7} />
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t.dashboard.inProgress}</CardTitle>
            <Link
              href="/riffs"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              {t.dashboard.allRiffs}
            </Link>
          </CardHeader>
          {inProgress.length === 0 ? (
            <Empty
              icon={<Music2 className="h-8 w-8" />}
              title={t.dashboard.noActiveRiffs}
              description={t.dashboard.noActiveRiffsDesc}
              action={
                <Link href="/riffs/new">
                  <Button size="sm" variant="primary">
                    {t.dashboard.addRiff}
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {inProgress.map((r) => {
                const pct =
                  r.target_bpm && r.current_bpm
                    ? Math.min(100, Math.round((r.current_bpm / r.target_bpm) * 100))
                    : 0;
                return (
                  <Link
                    key={r.id}
                    href={`/riffs/${r.id}`}
                    className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 p-3 hover:border-[var(--color-primary)]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.title}</div>
                        {r.artist && (
                          <div className="text-xs text-[var(--color-muted)] truncate">
                            {r.artist}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm">
                          <span className="text-[var(--color-primary)]">
                            {r.current_bpm ?? "—"}
                          </span>
                          <span className="text-[var(--color-muted)]">
                            {" "}
                            / {r.target_bpm ?? "—"}
                          </span>
                        </div>
                        <div className="text-[10px] uppercase text-[var(--color-muted)]">
                          bpm
                        </div>
                      </div>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Practice suggestions */}
      {stale.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.dashboard.suggestions}</CardTitle>
              <p className="text-xs text-[var(--color-muted)] mt-1 normal-case tracking-normal">
                {t.dashboard.suggestionsDesc}
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
          </CardHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            {stale.map((r) => (
              <Link
                key={r.id}
                href={`/riffs/${r.id}`}
                className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 p-3 hover:border-[var(--color-accent)]/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate group-hover:text-[var(--color-accent)]">
                    {r.title}
                  </div>
                  {r.artist && (
                    <div className="text-xs text-[var(--color-muted)] truncate">{r.artist}</div>
                  )}
                </div>
                <Badge variant={r.days_since === null ? "warning" : "accent"}>
                  {r.days_since === null
                    ? t.dashboard.never
                    : fmt(t.dashboard.daysAgo, { n: r.days_since })}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.heatmap}</CardTitle>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            {t.dashboard.less}
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm ${
                    [
                      "bg-[var(--color-border)]/40",
                      "bg-[var(--color-primary)]/20",
                      "bg-[var(--color-primary)]/40",
                      "bg-[var(--color-primary)]/70",
                      "bg-[var(--color-primary)]",
                    ][i]
                  }`}
                />
              ))}
            </div>
            {t.dashboard.more}
          </div>
        </CardHeader>
        <PracticeHeatmap data={last90} />
      </Card>
    </div>
  );
}
