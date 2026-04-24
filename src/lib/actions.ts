"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as q from "./queries";
import type { RiffStatus, ResourceKind } from "./types";
import type { Locale } from "./i18n/dict";

const RiffSchema = z.object({
  title: z.string().min(1).max(120),
  artist: z.string().max(120).nullable().optional(),
  target_bpm: z.number().int().min(20).max(400).nullable().optional(),
  current_bpm: z.number().int().min(20).max(400).nullable().optional(),
  status: z.enum(["todo", "in_progress", "mastered"]).optional(),
  resource_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  resource_kind: z.enum(["songsterr", "youtube", "pdf", "other"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
});

function cleanTags(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const arr = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t, i, a) => t.length > 0 && a.indexOf(t) === i);
  return arr.length ? arr.join(",") : null;
}

function coerceUrl(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length === 0 ? null : s;
}

function coerceInt(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function detectKind(url: string | null): ResourceKind | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("songsterr")) return "songsterr";
  if (u.includes("youtu")) return "youtube";
  if (u.endsWith(".pdf")) return "pdf";
  return "other";
}

export async function createRiffAction(formData: FormData) {
  const url = coerceUrl(formData.get("resource_url"));
  const parsed = RiffSchema.parse({
    title: (formData.get("title") ?? "").toString(),
    artist: (formData.get("artist") ?? "").toString() || null,
    target_bpm: coerceInt(formData.get("target_bpm")),
    current_bpm: coerceInt(formData.get("current_bpm")),
    status: (formData.get("status") ?? "todo").toString() as RiffStatus,
    resource_url: url,
    resource_kind: detectKind(url),
    notes: (formData.get("notes") ?? "").toString() || null,
    tags: cleanTags((formData.get("tags") ?? "").toString()),
  });
  const riff = q.createRiff(parsed);
  revalidatePath("/riffs");
  revalidatePath("/");
  return riff;
}

export async function updateRiffAction(id: string, formData: FormData) {
  const url = coerceUrl(formData.get("resource_url"));
  const parsed = RiffSchema.parse({
    title: (formData.get("title") ?? "").toString(),
    artist: (formData.get("artist") ?? "").toString() || null,
    target_bpm: coerceInt(formData.get("target_bpm")),
    current_bpm: coerceInt(formData.get("current_bpm")),
    status: (formData.get("status") ?? "todo").toString() as RiffStatus,
    resource_url: url,
    resource_kind: detectKind(url),
    notes: (formData.get("notes") ?? "").toString() || null,
    tags: cleanTags((formData.get("tags") ?? "").toString()),
  });
  q.updateRiff(id, parsed);
  revalidatePath("/riffs");
  revalidatePath(`/riffs/${id}`);
  revalidatePath("/");
}

export async function deleteRiffAction(id: string) {
  q.deleteRiff(id);
  revalidatePath("/riffs");
  revalidatePath("/");
}

export async function setRiffStatusAction(id: string, status: RiffStatus) {
  q.updateRiff(id, { status });
  revalidatePath("/riffs");
  revalidatePath(`/riffs/${id}`);
}

export async function startSessionAction() {
  const s = q.startSession();
  revalidatePath("/");
  revalidatePath("/session");
  return s;
}

export async function cancelSessionAction(id: string) {
  q.cancelSession(id);
  revalidatePath("/");
  revalidatePath("/session");
}

export async function logBpmAction(input: {
  session_id: string;
  riff_id: string;
  current_bpm: number;
}) {
  const result = q.addPracticeLog(input);
  revalidatePath(`/riffs/${input.riff_id}`);
  revalidatePath("/session");
  return result;
}

export async function endSessionAction(
  id: string,
  payload: {
    duration_minutes: number;
    warmup_minutes: number;
    technique_minutes: number;
    songs_minutes: number;
    pain_fingers: number;
    pain_wrist: number;
    mood: number | null;
    notes: string | null;
  },
) {
  q.endSession(id, payload);
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/session");
}

export async function resetAllAction() {
  q.resetAll();
  revalidatePath("/", "layout");
}

// ============== Locale ==============

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set("kessoku-locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}

// ============== App settings ==============

const AppSettingsSchema = z.object({
  weekly_goal_minutes: z.number().int().min(0).max(10080),
  phase_warmup_minutes: z.number().int().min(0).max(240),
  phase_technique_minutes: z.number().int().min(0).max(240),
  phase_songs_minutes: z.number().int().min(0).max(240),
  bpm_step: z.number().int().refine((n) => [1, 2, 5, 10].includes(n)),
});

export async function updateAppSettingsAction(formData: FormData) {
  const input = AppSettingsSchema.parse({
    weekly_goal_minutes: parseInt((formData.get("weekly_goal_minutes") ?? "0").toString(), 10) || 0,
    phase_warmup_minutes:
      parseInt((formData.get("phase_warmup_minutes") ?? "10").toString(), 10) || 10,
    phase_technique_minutes:
      parseInt((formData.get("phase_technique_minutes") ?? "20").toString(), 10) || 20,
    phase_songs_minutes:
      parseInt((formData.get("phase_songs_minutes") ?? "30").toString(), 10) || 30,
    bpm_step: parseInt((formData.get("bpm_step") ?? "5").toString(), 10) || 5,
  });
  q.setAppSetting("weekly_goal_minutes", input.weekly_goal_minutes);
  q.setAppSetting("phase_warmup_minutes", input.phase_warmup_minutes);
  q.setAppSetting("phase_technique_minutes", input.phase_technique_minutes);
  q.setAppSetting("phase_songs_minutes", input.phase_songs_minutes);
  q.setAppSetting("bpm_step", input.bpm_step);
  revalidatePath("/", "layout");
}
