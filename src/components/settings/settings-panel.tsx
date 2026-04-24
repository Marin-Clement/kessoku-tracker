"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { resetAllAction, updateAppSettingsAction } from "@/lib/actions";
import { Download, Trash2, Upload, Database, Save, CalendarCheck2, Timer, Gauge } from "lucide-react";
import type { Dict } from "@/lib/i18n/dict";
import type { AppSettings } from "@/lib/queries";

interface Props {
  t: Dict["settings"];
  settings: AppSettings;
}

export function SettingsPanel({ t, settings }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Import failed");
      setStatus(t.imported);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onReset = () => {
    if (!confirm(t.resetConfirm1)) return;
    if (!confirm(t.resetConfirm2)) return;
    startTransition(async () => {
      await resetAllAction();
      setStatus(t.erased);
      router.refresh();
    });
  };

  const savePrefs = async (formData: FormData) => {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        await updateAppSettingsAction(formData);
        setStatus(t.saved);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Preferences form */}
      <Card className="p-5 space-y-5">
        <form action={savePrefs} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck2 className="h-5 w-5 text-[var(--color-success)]" />
              <div>
                <h3 className="font-semibold">{t.weeklyGoal}</h3>
                <p className="text-xs text-[var(--color-muted)]">{t.weeklyGoalDesc}</p>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="weekly_goal_minutes">min / week</Label>
                <Input
                  id="weekly_goal_minutes"
                  name="weekly_goal_minutes"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10080}
                  defaultValue={settings.weekly_goal_minutes}
                  placeholder="0 = off"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-5 w-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-semibold">{t.sessionPhases}</h3>
                <p className="text-xs text-[var(--color-muted)]">{t.sessionPhasesDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="phase_warmup_minutes">Warmup</Label>
                <Input
                  id="phase_warmup_minutes"
                  name="phase_warmup_minutes"
                  type="number"
                  min={0}
                  max={240}
                  defaultValue={settings.phase_warmup_minutes}
                />
              </div>
              <div>
                <Label htmlFor="phase_technique_minutes">Tech</Label>
                <Input
                  id="phase_technique_minutes"
                  name="phase_technique_minutes"
                  type="number"
                  min={0}
                  max={240}
                  defaultValue={settings.phase_technique_minutes}
                />
              </div>
              <div>
                <Label htmlFor="phase_songs_minutes">Songs</Label>
                <Input
                  id="phase_songs_minutes"
                  name="phase_songs_minutes"
                  type="number"
                  min={0}
                  max={240}
                  defaultValue={settings.phase_songs_minutes}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <h3 className="font-semibold">{t.bpmStep}</h3>
                <p className="text-xs text-[var(--color-muted)]">{t.bpmStepDesc}</p>
              </div>
            </div>
            <Select name="bpm_step" defaultValue={String(settings.bpm_step)}>
              <option value="1">± 1</option>
              <option value="2">± 2</option>
              <option value="5">± 5</option>
              <option value="10">± 10</option>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? "..." : t.saved}
            </Button>
          </div>
        </form>
      </Card>

      {/* Data section */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-[var(--color-success)] mt-1" />
            <div>
              <h3 className="font-semibold">{t.export}</h3>
              <p className="text-sm text-[var(--color-muted)]">{t.exportDesc}</p>
            </div>
          </div>
          <a href="/api/export" download>
            <Button variant="secondary">{t.download}</Button>
          </a>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 text-[var(--color-accent)] mt-1" />
            <div>
              <h3 className="font-semibold">{t.import}</h3>
              <p className="text-sm text-[var(--color-muted)]">{t.importDesc}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            {t.choose}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
        </div>
      </Card>

      <Card className="p-5 border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)]/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-[var(--color-danger)] mt-1" />
            <div>
              <h3 className="font-semibold text-[var(--color-danger)]">{t.reset}</h3>
              <p className="text-sm text-[var(--color-muted-strong)]">{t.resetDesc}</p>
            </div>
          </div>
          <Button variant="danger" onClick={onReset} disabled={pending}>
            {t.resetBtn}
          </Button>
        </div>
      </Card>

      {status && (
        <div className="rounded-xl border border-[var(--color-success)]/50 bg-[#0a3a29] p-3 text-sm text-[var(--color-success)] flex items-center gap-2">
          <Database className="h-4 w-4" />
          {status}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}
