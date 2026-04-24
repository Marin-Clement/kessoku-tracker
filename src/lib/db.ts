import "server-only";
import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "kessoku.db");

declare global {
  var __kessokuDb: Database.Database | undefined;
}

const SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS riffs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      target_bpm INTEGER,
      current_bpm INTEGER,
      status TEXT NOT NULL DEFAULT 'todo',
      resource_url TEXT,
      resource_kind TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      day_key TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      warmup_minutes INTEGER NOT NULL DEFAULT 0,
      technique_minutes INTEGER NOT NULL DEFAULT 0,
      songs_minutes INTEGER NOT NULL DEFAULT 0,
      pain_fingers INTEGER,
      pain_wrist INTEGER,
      mood INTEGER,
      notes TEXT,
      finished INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_day_key ON sessions(day_key);

    CREATE TABLE IF NOT EXISTS practice_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      riff_id TEXT NOT NULL REFERENCES riffs(id) ON DELETE CASCADE,
      current_bpm INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_logs_riff ON practice_logs(riff_id);
    CREATE INDEX IF NOT EXISTS idx_logs_session ON practice_logs(session_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
`;

function tableHasColumn(db: Database.Database, table: string, column: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === column);
}

function applyMigrations(db: Database.Database) {
  if (!tableHasColumn(db, "riffs", "tags")) {
    db.exec(`ALTER TABLE riffs ADD COLUMN tags TEXT`);
  }
  if (!tableHasColumn(db, "riffs", "max_bpm")) {
    db.exec(`ALTER TABLE riffs ADD COLUMN max_bpm INTEGER`);
  }
  if (!tableHasColumn(db, "riffs", "last_practiced_at")) {
    db.exec(`ALTER TABLE riffs ADD COLUMN last_practiced_at TEXT`);
  }
}

function createDb() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  applyMigrations(db);
  return db;
}

export function getDb() {
  if (!globalThis.__kessokuDb) {
    globalThis.__kessokuDb = createDb();
  }
  return globalThis.__kessokuDb;
}
