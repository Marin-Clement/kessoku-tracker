import "server-only";
import { getDb } from "./db";
import { randomUUID } from "node:crypto";
import type { Riff, Session, PracticeLog, RiffStatus, ResourceKind } from "./types";
import { dayKey, todayKey } from "./utils";

// ============== Riffs ==============

export function listRiffs(): Riff[] {
  return getDb()
    .prepare(`SELECT * FROM riffs ORDER BY status, updated_at DESC`)
    .all() as Riff[];
}

export function getRiff(id: string): Riff | null {
  return (getDb().prepare(`SELECT * FROM riffs WHERE id = ?`).get(id) as Riff) ?? null;
}

export function createRiff(input: {
  title: string;
  artist?: string | null;
  target_bpm?: number | null;
  current_bpm?: number | null;
  status?: RiffStatus;
  resource_url?: string | null;
  resource_kind?: ResourceKind | null;
  notes?: string | null;
  tags?: string | null;
}): Riff {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO riffs (id, title, artist, target_bpm, current_bpm, max_bpm, status, resource_url, resource_kind, notes, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.title,
      input.artist ?? null,
      input.target_bpm ?? null,
      input.current_bpm ?? null,
      input.current_bpm ?? null,
      input.status ?? "todo",
      input.resource_url ?? null,
      input.resource_kind ?? null,
      input.notes ?? null,
      input.tags ?? null,
    );
  return getRiff(id)!;
}

export function updateRiff(id: string, input: Partial<Omit<Riff, "id" | "created_at">>) {
  const existing = getRiff(id);
  if (!existing) return null;
  const merged = { ...existing, ...input };
  getDb()
    .prepare(
      `UPDATE riffs SET title=?, artist=?, target_bpm=?, current_bpm=?, max_bpm=?, status=?, resource_url=?, resource_kind=?, notes=?, tags=?, updated_at=datetime('now') WHERE id=?`,
    )
    .run(
      merged.title,
      merged.artist,
      merged.target_bpm,
      merged.current_bpm,
      merged.max_bpm,
      merged.status,
      merged.resource_url,
      merged.resource_kind,
      merged.notes,
      merged.tags,
      id,
    );
  return getRiff(id);
}

export function deleteRiff(id: string) {
  getDb().prepare(`DELETE FROM riffs WHERE id = ?`).run(id);
}

// ============== Sessions ==============

export function getActiveSession(): Session | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM sessions WHERE finished = 0 ORDER BY started_at DESC LIMIT 1`)
      .get() as Session) ?? null
  );
}

export function getSession(id: string): Session | null {
  return (getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as Session) ?? null;
}

export function listSessions(limit = 50): Session[] {
  return getDb()
    .prepare(`SELECT * FROM sessions WHERE finished = 1 ORDER BY date DESC LIMIT ?`)
    .all(limit) as Session[];
}

export function todaySession(): Session | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM sessions WHERE day_key = ? AND finished = 1 ORDER BY date DESC LIMIT 1`)
      .get(todayKey()) as Session) ?? null
  );
}

export function startSession(): Session {
  const active = getActiveSession();
  if (active) return active;
  const id = randomUUID();
  const now = new Date();
  getDb()
    .prepare(
      `INSERT INTO sessions (id, date, day_key, started_at) VALUES (?, ?, ?, datetime('now'))`,
    )
    .run(id, now.toISOString(), dayKey(now));
  return getSession(id)!;
}

export function updateSession(id: string, input: Partial<Session>) {
  const existing = getSession(id);
  if (!existing) return null;
  const merged = { ...existing, ...input };
  getDb()
    .prepare(
      `UPDATE sessions SET
        duration_minutes=?, warmup_minutes=?, technique_minutes=?, songs_minutes=?,
        pain_fingers=?, pain_wrist=?, mood=?, notes=?, finished=?, ended_at=?
       WHERE id=?`,
    )
    .run(
      merged.duration_minutes,
      merged.warmup_minutes,
      merged.technique_minutes,
      merged.songs_minutes,
      merged.pain_fingers,
      merged.pain_wrist,
      merged.mood,
      merged.notes,
      merged.finished,
      merged.ended_at,
      id,
    );
  return getSession(id);
}

export function endSession(
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
  getDb()
    .prepare(
      `UPDATE sessions SET
        duration_minutes=?, warmup_minutes=?, technique_minutes=?, songs_minutes=?,
        pain_fingers=?, pain_wrist=?, mood=?, notes=?, finished=1, ended_at=datetime('now')
       WHERE id=?`,
    )
    .run(
      payload.duration_minutes,
      payload.warmup_minutes,
      payload.technique_minutes,
      payload.songs_minutes,
      payload.pain_fingers,
      payload.pain_wrist,
      payload.mood,
      payload.notes,
      id,
    );
  return getSession(id);
}

export function cancelSession(id: string) {
  getDb().prepare(`DELETE FROM sessions WHERE id = ? AND finished = 0`).run(id);
}

// ============== Practice Logs ==============

export function addPracticeLog(input: {
  session_id: string;
  riff_id: string;
  current_bpm: number;
}): { log: PracticeLog; isPr: boolean } {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO practice_logs (id, session_id, riff_id, current_bpm) VALUES (?, ?, ?, ?)`,
    )
    .run(id, input.session_id, input.riff_id, input.current_bpm);

  const before = getRiff(input.riff_id);
  const isPr =
    before != null &&
    (before.max_bpm == null || input.current_bpm > (before.max_bpm ?? 0));

  getDb()
    .prepare(
      `UPDATE riffs
       SET current_bpm = ?,
           max_bpm = CASE WHEN max_bpm IS NULL OR ? > max_bpm THEN ? ELSE max_bpm END,
           status = CASE WHEN status='todo' THEN 'in_progress' ELSE status END,
           last_practiced_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(input.current_bpm, input.current_bpm, input.current_bpm, input.riff_id);

  const log = getDb().prepare(`SELECT * FROM practice_logs WHERE id = ?`).get(id) as PracticeLog;
  return { log, isPr };
}

export function logsForRiff(riffId: string, limit = 200): PracticeLog[] {
  return getDb()
    .prepare(
      `SELECT * FROM practice_logs WHERE riff_id = ? ORDER BY created_at ASC LIMIT ?`,
    )
    .all(riffId, limit) as PracticeLog[];
}

export function logsForSession(sessionId: string) {
  return getDb()
    .prepare(
      `SELECT pl.*, r.title as riff_title, r.target_bpm as riff_target_bpm
       FROM practice_logs pl JOIN riffs r ON r.id = pl.riff_id
       WHERE session_id = ? ORDER BY created_at ASC`,
    )
    .all(sessionId) as (PracticeLog & { riff_title: string; riff_target_bpm: number | null })[];
}

// ============== Aggregations ==============

export interface DailyPractice {
  day: string;
  total_minutes: number;
  pain_fingers: number | null;
  pain_wrist: number | null;
}

export function dailyPracticeLastNDays(n: number): DailyPractice[] {
  const rows = getDb()
    .prepare(
      `SELECT day_key as day,
              COALESCE(SUM(duration_minutes), 0) as total_minutes,
              MAX(pain_fingers) as pain_fingers,
              MAX(pain_wrist) as pain_wrist
       FROM sessions
       WHERE finished = 1 AND day_key >= date('now', ? )
       GROUP BY day_key
       ORDER BY day_key ASC`,
    )
    .all(`-${n - 1} days`) as DailyPractice[];
  // Fill missing days
  const map = new Map(rows.map((r) => [r.day, r]));
  const out: DailyPractice[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push(
      map.get(key) ?? { day: key, total_minutes: 0, pain_fingers: null, pain_wrist: null },
    );
  }
  return out;
}

export function computeStreak(): number {
  const days = getDb()
    .prepare(
      `SELECT DISTINCT day_key FROM sessions WHERE finished = 1 ORDER BY day_key DESC LIMIT 400`,
    )
    .all() as { day_key: string }[];
  if (days.length === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  // Allow today to count; if today is missing but yesterday exists, start from yesterday.
  if (days[0].day_key !== dayKey(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (days[0].day_key !== dayKey(cursor)) return 0;
  }
  for (const d of days) {
    if (d.day_key === dayKey(cursor)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function tendinitisAlert(): { risk: boolean; days: number } {
  const recent = getDb()
    .prepare(
      `SELECT pain_wrist FROM sessions WHERE finished = 1 AND pain_wrist IS NOT NULL ORDER BY date DESC LIMIT 3`,
    )
    .all() as { pain_wrist: number }[];
  const hot = recent.filter((r) => (r.pain_wrist ?? 0) >= 4).length;
  return { risk: hot >= 2, days: hot };
}

export function totalsAllTime() {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as session_count, COALESCE(SUM(duration_minutes), 0) as total_minutes FROM sessions WHERE finished = 1`,
    )
    .get() as { session_count: number; total_minutes: number };
  return row;
}

export function exportAll() {
  return {
    exported_at: new Date().toISOString(),
    riffs: listRiffs(),
    sessions: getDb().prepare(`SELECT * FROM sessions ORDER BY date ASC`).all(),
    practice_logs: getDb().prepare(`SELECT * FROM practice_logs ORDER BY created_at ASC`).all(),
  };
}

export function importAll(data: {
  riffs?: Riff[];
  sessions?: Session[];
  practice_logs?: PracticeLog[];
}) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM practice_logs`).run();
    db.prepare(`DELETE FROM sessions`).run();
    db.prepare(`DELETE FROM riffs`).run();
    if (data.riffs) {
      const stmt = db.prepare(
        `INSERT INTO riffs (id, title, artist, target_bpm, current_bpm, max_bpm, status, resource_url, resource_kind, notes, tags, last_practiced_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const r of data.riffs) {
        stmt.run(
          r.id,
          r.title,
          r.artist,
          r.target_bpm,
          r.current_bpm,
          r.max_bpm ?? r.current_bpm ?? null,
          r.status,
          r.resource_url,
          r.resource_kind,
          r.notes,
          r.tags ?? null,
          r.last_practiced_at ?? null,
          r.created_at,
          r.updated_at,
        );
      }
    }
    if (data.sessions) {
      const stmt = db.prepare(
        `INSERT INTO sessions (id, date, day_key, duration_minutes, warmup_minutes, technique_minutes, songs_minutes, pain_fingers, pain_wrist, mood, notes, finished, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const s of data.sessions) {
        stmt.run(
          s.id,
          s.date,
          s.day_key,
          s.duration_minutes,
          s.warmup_minutes,
          s.technique_minutes,
          s.songs_minutes,
          s.pain_fingers,
          s.pain_wrist,
          s.mood,
          s.notes,
          s.finished,
          s.started_at,
          s.ended_at,
        );
      }
    }
    if (data.practice_logs) {
      const stmt = db.prepare(
        `INSERT INTO practice_logs (id, session_id, riff_id, current_bpm, created_at) VALUES (?, ?, ?, ?, ?)`,
      );
      for (const l of data.practice_logs) {
        stmt.run(l.id, l.session_id, l.riff_id, l.current_bpm, l.created_at);
      }
    }
  });
  tx();
}

// ============== App settings (weekly goal, phases, bpm step) ==============

export interface AppSettings {
  weekly_goal_minutes: number; // 0 = disabled
  phase_warmup_minutes: number;
  phase_technique_minutes: number;
  phase_songs_minutes: number;
  bpm_step: number; // 1, 5, or 10
}

const DEFAULT_SETTINGS: AppSettings = {
  weekly_goal_minutes: 0,
  phase_warmup_minutes: 10,
  phase_technique_minutes: 20,
  phase_songs_minutes: 30,
  bpm_step: 5,
};

export function getAppSettings(): AppSettings {
  const rows = getDb().prepare(`SELECT key, value FROM settings`).all() as {
    key: string;
    value: string;
  }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return {
    weekly_goal_minutes: parseInt(out.weekly_goal_minutes ?? "", 10) ||
      DEFAULT_SETTINGS.weekly_goal_minutes,
    phase_warmup_minutes:
      parseInt(out.phase_warmup_minutes ?? "", 10) || DEFAULT_SETTINGS.phase_warmup_minutes,
    phase_technique_minutes:
      parseInt(out.phase_technique_minutes ?? "", 10) ||
      DEFAULT_SETTINGS.phase_technique_minutes,
    phase_songs_minutes:
      parseInt(out.phase_songs_minutes ?? "", 10) || DEFAULT_SETTINGS.phase_songs_minutes,
    bpm_step: parseInt(out.bpm_step ?? "", 10) || DEFAULT_SETTINGS.bpm_step,
  };
}

export function setAppSetting(key: keyof AppSettings, value: number) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    )
    .run(key, String(value));
}

// ============== Practice suggestions ==============

export interface StaleRiff {
  id: string;
  title: string;
  artist: string | null;
  target_bpm: number | null;
  current_bpm: number | null;
  tags: string | null;
  days_since: number | null; // null = never practiced
}

export function staleActiveRiffs(minDays = 4, limit = 6): StaleRiff[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, artist, target_bpm, current_bpm, tags,
              CAST((julianday('now') - julianday(COALESCE(last_practiced_at, created_at))) AS INTEGER) as days_since,
              last_practiced_at
       FROM riffs
       WHERE status = 'in_progress'
       ORDER BY (last_practiced_at IS NULL) DESC, last_practiced_at ASC
       LIMIT ?`,
    )
    .all(limit) as (StaleRiff & { last_practiced_at: string | null })[];
  return rows.filter((r) => (r.days_since ?? 99) >= minDays).map((r) => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    target_bpm: r.target_bpm,
    current_bpm: r.current_bpm,
    tags: r.tags,
    days_since: r.last_practiced_at == null ? null : r.days_since,
  }));
}

export function resetAll() {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM practice_logs`).run();
    db.prepare(`DELETE FROM sessions`).run();
    db.prepare(`DELETE FROM riffs`).run();
  });
  tx();
}
