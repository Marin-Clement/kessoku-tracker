"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Metronome } from "@/components/session/metronome";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Guitar,
  Heart,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Trophy,
  X,
} from "lucide-react";
import { cancelSessionAction, endSessionAction, logBpmAction } from "@/lib/actions";
import type { Riff, Session } from "@/lib/types";
import type { Dict } from "@/lib/i18n/dict";
import { cn, formatSeconds } from "@/lib/utils";

type Phase = "warmup" | "technique" | "songs";
const PHASE_ORDER: Phase[] = ["warmup", "technique", "songs"];

interface Props {
  session: Session;
  riffs: Riff[];
  bpmStep: number;
  t: Dict;
}

interface LogEntry {
  riff_id: string;
  riff_title: string;
  bpm: number;
  is_pr: boolean;
  prev_bpm: number | null;
}

export function SessionScreen({ session, riffs, bpmStep, t }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("warmup");
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState<Record<Phase, number>>({
    warmup: 0,
    technique: 0,
    songs: 0,
  });
  const [bpm, setBpm] = useState(90);
  const [selectedRiff, setSelectedRiff] = useState<string>(riffs[0]?.id ?? "");
  const [logged, setLogged] = useState<LogEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showInsights, setShowInsights] = useState<InsightsData | null>(null);
  const [flash, setFlash] = useState(false);

  const totalSeconds = elapsed.warmup + elapsed.technique + elapsed.songs;

  const phaseConfig: Record<Phase, { label: string; icon: typeof Flame; color: string; hint: string }> = {
    warmup: {
      label: t.session.phases.warmup,
      icon: Flame,
      color: "var(--color-warning)",
      hint: t.session.phaseDesc.warmup,
    },
    technique: {
      label: t.session.phases.technique,
      icon: Activity,
      color: "var(--color-accent)",
      hint: t.session.phaseDesc.technique,
    },
    songs: {
      label: t.session.phases.songs,
      icon: Music2,
      color: "var(--color-primary)",
      hint: t.session.phaseDesc.songs,
    },
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((e) => ({ ...e, [phase]: e[phase] + 1 }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    type WakeLockSentinel = { release: () => Promise<void> };
    let lock: WakeLockSentinel | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (nav.wakeLock) {
      nav.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    }
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showEndDialog || showInsights) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key === "ArrowRight") {
        setPhase((p) => {
          const i = PHASE_ORDER.indexOf(p);
          return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : p;
        });
      } else if (e.key === "ArrowLeft") {
        setPhase((p) => {
          const i = PHASE_ORDER.indexOf(p);
          return i > 0 ? PHASE_ORDER[i - 1] : p;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showEndDialog, showInsights]);

  const activeRiff = riffs.find((r) => r.id === selectedRiff);

  const logBpm = useCallback(() => {
    if (!activeRiff || !bpm) return;
    const prev = activeRiff.current_bpm;
    startTransition(async () => {
      const res = await logBpmAction({
        session_id: session.id,
        riff_id: activeRiff.id,
        current_bpm: bpm,
      });
      setLogged((xs) => [
        ...xs,
        {
          riff_id: activeRiff.id,
          riff_title: activeRiff.title,
          bpm,
          is_pr: res.isPr,
          prev_bpm: prev,
        },
      ]);
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    });
  }, [activeRiff, bpm, session.id]);

  const cancelSession = () => {
    if (!confirm(t.session.cancelConfirm)) return;
    startTransition(async () => {
      await cancelSessionAction(session.id);
      router.push("/");
    });
  };

  const advancePhase = () => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < PHASE_ORDER.length - 1) setPhase(PHASE_ORDER[idx + 1]);
  };
  const prevPhase = () => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) setPhase(PHASE_ORDER[idx - 1]);
  };

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            {t.session.sessionInProgress}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{t.session.focusMode}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={cancelSession}>
          <X className="h-4 w-4" />
          {t.session.cancel}
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {PHASE_ORDER.map((p) => {
          const cfg = phaseConfig[p];
          const Icon = cfg.icon;
          const active = p === phase;
          return (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-card)]/60 hover:border-[var(--color-border-strong)]",
              )}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: active ? "var(--color-primary)" : cfg.color }}
              />
              <div className="mt-1.5 text-sm font-semibold">{cfg.label}</div>
              <div className="text-xs text-[var(--color-muted)] font-mono">
                {formatSeconds(elapsed[p])}
              </div>
            </button>
          );
        })}
      </div>

      <Card className="p-8 text-center relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/5 opacity-0 transition-opacity",
            running && "opacity-100",
          )}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            {phaseConfig[phase].label}
          </p>
          <p className="text-sm text-[var(--color-muted-strong)] mt-1">{phaseConfig[phase].hint}</p>
          <div
            className={cn(
              "text-7xl md:text-8xl font-bold font-mono tracking-tighter my-6",
              running && "gradient-text",
            )}
          >
            {formatSeconds(elapsed[phase])}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {t.session.total} ·{" "}
            <span className="font-mono text-[var(--color-fg)]">{formatSeconds(totalSeconds)}</span>
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              size="icon-lg"
              variant="secondary"
              onClick={prevPhase}
              aria-label="Previous phase"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant={running ? "secondary" : "primary"}
              size="xl"
              onClick={() => setRunning((r) => !r)}
              className="min-w-[180px]"
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? t.session.pause : t.session.resume}
            </Button>
            <Button
              size="icon-lg"
              variant="secondary"
              onClick={advancePhase}
              aria-label="Next phase"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Metronome bpm={bpm} onBpmChange={setBpm} step={bpmStep} t={t.session} />

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                {t.session.logBpm}
              </div>
              <div className="text-lg font-semibold mt-0.5">{t.session.logBpmSub}</div>
            </div>
            <Guitar className="h-5 w-5 text-[var(--color-accent)]" />
          </div>

          {riffs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-muted)]">
              {t.session.noRiffsYet}{" "}
              <Link href="/riffs/new" className="text-[var(--color-primary)] underline">
                {t.session.createOne}
              </Link>{" "}
              {t.session.toTrackBpm}
            </div>
          ) : (
            <>
              <Select
                value={selectedRiff}
                onChange={(e) => setSelectedRiff(e.target.value)}
                aria-label={t.session.riffLabel}
              >
                {riffs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                    {r.target_bpm ? ` — ${t.common.target.toLowerCase()} ${r.target_bpm}` : ""}
                  </option>
                ))}
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  size="icon-lg"
                  variant="secondary"
                  onClick={() => setBpm((b) => Math.max(20, b - bpmStep))}
                >
                  −
                </Button>
                <div
                  className={cn(
                    "flex-1 text-center rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] py-4 font-mono text-4xl font-bold tracking-tight transition-all",
                    flash && "border-[var(--color-success)] bg-[#0a3a29]",
                  )}
                >
                  {bpm}
                </div>
                <Button
                  size="icon-lg"
                  variant="secondary"
                  onClick={() => setBpm((b) => Math.min(400, b + bpmStep))}
                >
                  +
                </Button>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={logBpm}
                disabled={pending || !selectedRiff}
              >
                <Save className="h-4 w-4" />
                {pending ? t.common.saving : t.session.logCurrent}
              </Button>

              {logged.length > 0 && (
                <div className="pt-2 border-t border-[var(--color-border)] space-y-1.5">
                  <div className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                    {t.session.thisSession}
                  </div>
                  {logged.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm items-center">
                      <span className="truncate flex items-center gap-1.5">
                        {l.is_pr && <Trophy className="h-3.5 w-3.5 text-[var(--color-warning)]" />}
                        {l.riff_title}
                      </span>
                      <span className="font-mono text-[var(--color-success)]">
                        {l.bpm} BPM
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setRunning(false)}
          disabled={!running}
        >
          <Pause className="h-4 w-4" />
          {t.session.pause}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setRunning(false);
            setShowEndDialog(true);
          }}
        >
          <Square className="h-4 w-4" />
          {t.session.endSession}
        </Button>
      </div>

      {showEndDialog && (
        <EndSessionDialog
          session={session}
          elapsed={elapsed}
          logged={logged}
          t={t}
          onClose={() => {
            setShowEndDialog(false);
            setRunning(true);
          }}
          onSaved={(insights) => {
            setShowEndDialog(false);
            setShowInsights(insights);
          }}
        />
      )}
      {showInsights && (
        <InsightsDialog t={t} data={showInsights} onClose={() => router.push("/")} />
      )}
    </div>
  );
}

// ===== End-of-session dialog =====

interface InsightsData {
  totalMinutes: number;
  warmupMinutes: number;
  techniqueMinutes: number;
  songsMinutes: number;
  gains: { riff: string; from: number | null; to: number; pr: boolean }[];
}

function EndSessionDialog({
  session,
  elapsed,
  logged,
  t,
  onClose,
  onSaved,
}: {
  session: Session;
  elapsed: Record<Phase, number>;
  logged: LogEntry[];
  t: Dict;
  onClose: () => void;
  onSaved: (insights: InsightsData) => void;
}) {
  const [painFingers, setPainFingers] = useState(2);
  const [painWrist, setPainWrist] = useState(1);
  const [mood, setMood] = useState(7);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const wMin = Math.round(elapsed.warmup / 60);
  const tMin = Math.round(elapsed.technique / 60);
  const sMin = Math.round(elapsed.songs / 60);
  const totalMin = wMin + tMin + sMin;

  const totalMinDisplay = useMemo(() => {
    if (totalMin < 60) return `${totalMin} min`;
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
  }, [totalMin]);

  const wristWarn = painWrist >= 4;

  const submit = () => {
    startTransition(async () => {
      await endSessionAction(session.id, {
        duration_minutes: totalMin,
        warmup_minutes: wMin,
        technique_minutes: tMin,
        songs_minutes: sMin,
        pain_fingers: painFingers,
        pain_wrist: painWrist,
        mood,
        notes: notes.trim() || null,
      });
      // Compute insights: best bpm per riff for this session
      const bestByRiff = new Map<string, LogEntry>();
      for (const l of logged) {
        const existing = bestByRiff.get(l.riff_id);
        if (!existing || l.bpm > existing.bpm) bestByRiff.set(l.riff_id, l);
      }
      const gains = Array.from(bestByRiff.values()).map((l) => ({
        riff: l.riff_title,
        from: l.prev_bpm,
        to: l.bpm,
        pr: l.is_pr,
      }));
      onSaved({
        totalMinutes: totalMin,
        warmupMinutes: wMin,
        techniqueMinutes: tMin,
        songsMinutes: sMin,
        gains,
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)]">
            {t.session.endDialog.kicker}
          </div>
          <h2 className="text-2xl font-bold mt-1">{t.session.endDialog.title}</h2>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatCell label={t.session.endDialog.totalField} value={totalMinDisplay} />
          <StatCell label={t.session.endDialog.warmupField} value={`${wMin}m`} />
          <StatCell label={t.session.endDialog.techField} value={`${tMin}m`} />
          <StatCell label={t.session.endDialog.songsField} value={`${sMin}m`} />
        </div>

        <PainSlider
          label={t.session.endDialog.fingerPain}
          hint={t.session.endDialog.fingerHint}
          value={painFingers}
          onChange={setPainFingers}
          Icon={Heart}
        />
        <PainSlider
          label={t.session.endDialog.wristPain}
          hint={t.session.endDialog.wristHint}
          value={painWrist}
          onChange={setPainWrist}
          danger
          Icon={Activity}
        />

        {wristWarn && (
          <div className="rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-muted-strong)]">
            {t.session.endDialog.wristWarn}
          </div>
        )}

        <div>
          <Label>
            {t.session.endDialog.mood} ({mood}/10)
          </Label>
          <input
            type="range"
            min={0}
            max={10}
            value={mood}
            onChange={(e) => setMood(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-[var(--color-border)] rounded-full appearance-none cursor-pointer accent-[var(--color-accent)]"
          />
        </div>

        <div>
          <Label htmlFor="notes">{t.session.endDialog.notes}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t.session.endDialog.notesPlaceholder}
          />
        </div>

        <div className="flex justify-between gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            <RotateCcw className="h-4 w-4" />
            {t.session.endDialog.back}
          </Button>
          <Button variant="primary" size="lg" onClick={submit} disabled={pending}>
            <Check className="h-4 w-4" />
            {pending ? t.common.saving : t.session.endDialog.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InsightsDialog({
  data,
  t,
  onClose,
}: {
  data: InsightsData;
  t: Dict;
  onClose: () => void;
}) {
  const totalDisplay =
    data.totalMinutes < 60
      ? `${data.totalMinutes} min`
      : `${Math.floor(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m`;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-card)] p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
          <h2 className="text-2xl font-bold gradient-text">{t.session.insights.title}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
              {t.session.insights.totalTime}
            </div>
            <div className="text-2xl font-bold mt-1">{totalDisplay}</div>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
              W / T / S
            </div>
            <div className="text-2xl font-bold mt-1 font-mono">
              {data.warmupMinutes}/{data.techniqueMinutes}/{data.songsMinutes}
            </div>
          </div>
        </div>

        {data.gains.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-strong)]">{t.session.insights.noGains}</p>
        ) : (
          <div className="space-y-2">
            {data.gains.map((g, i) => {
              const delta = g.from != null ? g.to - g.from : null;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3",
                    g.pr
                      ? "border-[var(--color-warning)]/60 bg-[#3a2e0a]/40"
                      : "border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {g.pr && (
                      <Trophy className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-medium truncate">{g.riff}</div>
                      {g.pr && (
                        <div className="text-[10px] uppercase tracking-wider text-[var(--color-warning)]">
                          {t.session.insights.newPr}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <div className="text-lg font-bold">{g.to} BPM</div>
                    {delta != null && delta !== 0 && (
                      <div
                        className={cn(
                          "text-xs",
                          delta > 0 ? "text-[var(--color-success)]" : "text-[var(--color-muted)]",
                        )}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="primary" size="lg" onClick={onClose} className="w-full">
          <Check className="h-4 w-4" />
          {t.session.insights.close}
        </Button>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className="font-mono text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function PainSlider({
  label,
  hint,
  value,
  onChange,
  danger,
  Icon,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  danger?: boolean;
  Icon: typeof Heart;
}) {
  const tone =
    value >= 7
      ? "text-[var(--color-danger)]"
      : value >= 4
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-success)]";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", tone)} />
          <div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-[var(--color-muted)]">{hint}</div>
          </div>
        </div>
        <Badge variant={value >= 7 ? "danger" : value >= 4 ? "warning" : "success"}>
          {value}/10
        </Badge>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--color-border)]",
          danger ? "accent-[var(--color-danger)]" : "accent-[var(--color-primary)]",
        )}
      />
      <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1 uppercase">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
