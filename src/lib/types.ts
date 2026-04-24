export type RiffStatus = "todo" | "in_progress" | "mastered";

export type ResourceKind = "songsterr" | "youtube" | "pdf" | "other";

export interface Riff {
  id: string;
  title: string;
  artist: string | null;
  target_bpm: number | null;
  current_bpm: number | null;
  max_bpm: number | null;
  status: RiffStatus;
  resource_url: string | null;
  resource_kind: ResourceKind | null;
  notes: string | null;
  tags: string | null; // comma-separated
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  date: string; // ISO
  day_key: string; // YYYY-MM-DD
  duration_minutes: number;
  warmup_minutes: number;
  technique_minutes: number;
  songs_minutes: number;
  pain_fingers: number | null;
  pain_wrist: number | null;
  mood: number | null;
  notes: string | null;
  finished: 0 | 1;
  started_at: string;
  ended_at: string | null;
}

export interface PracticeLog {
  id: string;
  session_id: string;
  riff_id: string;
  current_bpm: number;
  created_at: string;
}

export interface Settings {
  key: string;
  value: string;
}
