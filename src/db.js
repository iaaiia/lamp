/**
 * Storage layer: node:sqlite, no native dependencies.
 *
 * Data-model note for reviewers: there is deliberately no table, column or
 * event stream that could carry a behavioural advertising profile. Reading
 * behaviour is not recorded at all — the timeline is computed from follows and
 * time, never from inferred interest.
 */

import { DatabaseSync } from 'node:sqlite';
import config from './config.js';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id             INTEGER PRIMARY KEY,
  username       TEXT NOT NULL,
  domain         TEXT,                 -- NULL for local accounts
  is_local       INTEGER NOT NULL DEFAULT 1,
  display_name   TEXT NOT NULL DEFAULT '',
  bio            TEXT NOT NULL DEFAULT '',
  password_hash  TEXT,                 -- local accounts only
  is_minor       INTEGER NOT NULL DEFAULT 0,
  paused_at      TEXT,                 -- "pause my account": hidden, never deleted
  actor_url      TEXT,                 -- remote actor id
  inbox_url      TEXT,
  shared_inbox_url TEXT,
  public_key     TEXT,
  private_key    TEXT,                 -- local accounts only
  prefs          TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL,
  UNIQUE (username, domain)
);

-- Kreise: die Raeume, aus denen lamb besteht. Ein Mensch ist nie einfach "im
-- Netzwerk", sondern immer in einem konkreten Kreis mit bekannter Oeffentlichkeit
-- — die strukturelle Antwort auf Kontextkollaps.
CREATE TABLE IF NOT EXISTS circles (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  purpose     TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'topic',   -- private | topic | local | panel
  joining     TEXT NOT NULL DEFAULT 'open',    -- open | request | invite
  place       TEXT,                            -- nur fuer kind = 'local'
  created_by  INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  id         INTEGER PRIMARY KEY,
  circle_id  INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',   -- member | moderator
  state      TEXT NOT NULL DEFAULT 'member',   -- member | pending
  last_read_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (circle_id, account_id)
);
CREATE INDEX IF NOT EXISTS memberships_account ON memberships (account_id);

CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  circle_id     INTEGER REFERENCES circles(id) ON DELETE CASCADE,
  uri           TEXT NOT NULL UNIQUE,
  content       TEXT NOT NULL,
  content_warning TEXT,
  language      TEXT NOT NULL DEFAULT 'en',
  visibility    TEXT NOT NULL DEFAULT 'public',   -- public | followers | mentioned
  reply_policy  TEXT NOT NULL DEFAULT 'followers',-- everyone | followers | mentioned | nobody
  in_reply_to   INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  media         TEXT NOT NULL DEFAULT '[]',       -- [{url, alt}] — alt text is mandatory
  created_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX IF NOT EXISTS posts_account_created ON posts (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_circle_created ON posts (circle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created ON posts (created_at DESC);

CREATE TABLE IF NOT EXISTS follows (
  id          INTEGER PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_id   INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  state       TEXT NOT NULL DEFAULT 'pending',    -- pending | accepted
  uri         TEXT,
  created_at  TEXT NOT NULL,
  UNIQUE (follower_id, target_id)
);

CREATE TABLE IF NOT EXISTS reactions (
  id         INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'like',
  created_at TEXT NOT NULL,
  UNIQUE (account_id, post_id, kind)
);

CREATE TABLE IF NOT EXISTS blocks (
  id         INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'block',       -- block | mute
  created_at TEXT NOT NULL,
  UNIQUE (account_id, target_id, kind)
);

CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY,
  reporter_id   INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  post_id       INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  account_id    INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL DEFAULT '',
  source        TEXT NOT NULL DEFAULT 'user',     -- user | triage
  severity      TEXT NOT NULL DEFAULT 'unknown',  -- machine hint, never a decision
  triage        TEXT NOT NULL DEFAULT '{}',
  state         TEXT NOT NULL DEFAULT 'open',     -- open | actioned | dismissed
  decided_by    INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  decision_note TEXT,
  created_at    TEXT NOT NULL,
  decided_at    TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id           INTEGER PRIMARY KEY,
  inbox_url    TEXT NOT NULL,
  actor_id     INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  payload      TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  state        TEXT NOT NULL DEFAULT 'queued',    -- queued | sent | failed
  last_error   TEXT,
  created_at   TEXT NOT NULL
);
`;

let db;

/** Open (or reopen) the database. `:memory:` is used by the test suite. */
export function openDatabase(file = config.databaseFile) {
  db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function getDatabase() {
  if (!db) openDatabase();
  return db;
}

/** Close and drop the handle — tests call this between cases. */
export function closeDatabase() {
  if (db) {
    db.close();
    db = undefined;
  }
}

export const now = () => new Date().toISOString();

/** Run a statement and return `lastInsertRowid` as a number. */
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
