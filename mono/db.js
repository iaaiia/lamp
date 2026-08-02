/**
 * Speicher: node:sqlite, keine nativen Abhängigkeiten.
 *
 * Für Mitlesende: Es gibt keine Beitragstabelle. Der Beitrag ist eine Spalte auf
 * dem Konto — genau eine Zeile pro Mensch, überschreibbar, nicht anhäufbar. Das
 * ist der Punkt: Was es kein Schema für gibt, kann kein Feature versehentlich
 * wieder einführen. Kein Archiv, keine Reaktionen, keine Zählwerte, keine
 * Lesespuren.
 */

import { DatabaseSync } from 'node:sqlite';
import config from './config.js';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id             INTEGER PRIMARY KEY,
  handle         TEXT NOT NULL UNIQUE,
  display_name   TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL,

  -- Der eine Beitrag. NULL heißt: gerade nichts gesagt, und das ist ein
  -- gültiger Zustand, kein leeres Profil, das gefüllt werden müsste.
  mono_text      TEXT,
  mono_media_id  INTEGER REFERENCES media(id) ON DELETE SET NULL,
  mono_at        TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id           INTEGER PRIMARY KEY,
  account_id   INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,               -- image | video
  content_type TEXT NOT NULL,
  alt          TEXT NOT NULL,               -- Pflicht, auch beim Video
  bytes        BLOB NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
  id          INTEGER PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_id   INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  UNIQUE (follower_id, target_id)
);
CREATE INDEX IF NOT EXISTS follows_follower ON follows (follower_id);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`;

let db;

export function openDatabase(file = config.databaseFile) {
  db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function getDatabase() {
  if (!db) openDatabase();
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = undefined;
  }
}

export const now = () => new Date().toISOString();

export function run(sql, ...params) {
  const info = getDatabase().prepare(sql).run(...params);
  return Number(info.lastInsertRowid);
}

export function get(sql, ...params) {
  return getDatabase().prepare(sql).get(...params);
}

export function all(sql, ...params) {
  return getDatabase().prepare(sql).all(...params);
}
