"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Play, Plus, Square, Volume2, VolumeX, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n/dict";

interface Props {
  bpm: number;
  onBpmChange: (n: number) => void;
  step: number;
  t: Dict["session"];
}

const MIN_BPM = 30;
const MAX_BPM = 300;
const SUBDIVISIONS = [1, 2, 3, 4] as const;
const TIME_SIGS = [3, 4, 5, 6] as const;

export function Metronome({ bpm, onBpmChange, step, t }: Props) {
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState<(typeof TIME_SIGS)[number]>(4);
  const [subdivision, setSubdivision] = useState<(typeof SUBDIVISIONS)[number]>(1);
  const [beat, setBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const noteCountRef = useRef(0);
  const bpmRef = useRef(bpm);
  const mutedRef = useRef(muted);
  const subRef = useRef(subdivision);
  const sigRef = useRef(beatsPerBar);

  // Tap tempo
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    subRef.current = subdivision;
  }, [subdivision]);
  useEffect(() => {
    sigRef.current = beatsPerBar;
  }, [beatsPerBar]);

  function scheduleClick(time: number, kind: "accent" | "beat" | "sub") {
    if (!audioCtxRef.current || mutedRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const freq = kind === "accent" ? 1800 : kind === "beat" ? 1100 : 800;
    const peak = kind === "accent" ? 0.4 : kind === "beat" ? 0.25 : 0.12;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  function tick() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const i = noteCountRef.current;
      const sub = subRef.current;
      const sig = sigRef.current;
      const isBeat = i % sub === 0;
      const beatIndex = Math.floor(i / sub) % sig;
      const isAccent = isBeat && beatIndex === 0;
      const kind: "accent" | "beat" | "sub" = isAccent ? "accent" : isBeat ? "beat" : "sub";
      scheduleClick(nextNoteTimeRef.current, kind);
      const fireInMs = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
      if (isBeat) {
        window.setTimeout(() => setBeat(beatIndex), fireInMs);
      }
      nextNoteTimeRef.current += 60 / (bpmRef.current * sub);
      noteCountRef.current++;
    }
    timerRef.current = window.setTimeout(tick, 25);
  }

  function start() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    audioCtxRef.current.resume();
    noteCountRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    setRunning(true);
    tick();
  }

  function stop() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setBeat(0);
  }

  function onTap() {
    const now = performance.now();
    const taps = tapsRef.current;
    // Drop taps older than 2.5s
    const fresh = taps.filter((t) => now - t < 2500);
    fresh.push(now);
    tapsRef.current = fresh;
    if (fresh.length < 2) return;
    const intervals = [];
    for (let i = 1; i < fresh.length; i++) intervals.push(fresh[i] - fresh[i - 1]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const newBpm = Math.round(60000 / avg);
    if (newBpm >= MIN_BPM && newBpm <= MAX_BPM) onBpmChange(newBpm);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const adjust = (delta: number) =>
    onBpmChange(Math.max(MIN_BPM, Math.min(MAX_BPM, bpm + delta)));

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/70 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
            {t.metronome}
          </div>
          <div className="text-4xl font-bold font-mono tracking-tight">
            {bpm}
            <span className="text-base text-[var(--color-muted)] ml-1">BPM</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: beatsPerBar }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full transition-all",
                running && beat === i
                  ? i === 0
                    ? "bg-[var(--color-primary)] scale-150"
                    : "bg-[var(--color-accent)] scale-125"
                  : "bg-[var(--color-border-strong)]",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => adjust(-step)}
          aria-label={`BPM -${step}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-[var(--color-border)] rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={() => adjust(step)}
          aria-label={`BPM +${step}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Subdivision + time signature */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
            {t.subdivision}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SUBDIVISIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSubdivision(s)}
                className={cn(
                  "rounded-lg border py-1.5 text-xs font-mono font-semibold transition-colors",
                  subdivision === s
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
                )}
              >
                {s === 1 ? "♩" : s === 2 ? "♫" : s === 3 ? "³" : "⁴"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
            {t.timeSignature}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {TIME_SIGS.map((s) => (
              <button
                key={s}
                onClick={() => setBeatsPerBar(s)}
                className={cn(
                  "rounded-lg border py-1.5 text-xs font-mono font-semibold transition-colors",
                  beatsPerBar === s
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
                )}
              >
                {s}/4
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={running ? "danger" : "primary"}
          size="lg"
          onClick={running ? stop : start}
          className="flex-1"
        >
          {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? t.stopMetronome : t.startMetronome}
        </Button>
        <Button variant="secondary" size="lg" onClick={onTap} title={t.tapTempoHint}>
          <Hand className="h-4 w-4" />
          {t.tapTempo}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setMuted((m) => !m)}
          aria-label={t.mute}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
