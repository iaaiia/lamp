/** Konten, Sitzungen, Folgen. Mehr Beziehungen gibt es in mono nicht. */

import { all, get, now, run } from '../db.js';
import config from '../config.js';
import { hashPassword, randomToken, verifyPassword } from '../../src/lib/crypto.js';

const HANDLE = /^[a-z0-9_]{2,20}$/;

export function normaliseHandle(value = '') {
  return String(value).trim().toLowerCase().replace(/^@/, '');
}

export function createAccount({ handle, password, displayName = '' }) {
  const name = normaliseHandle(handle);
  if (!HANDLE.test(name)) throw new Error('Der Name geht so nicht: 2–20 Zeichen aus a–z, 0–9, _');
  if (!password || password.length < 8) throw new Error('Das Passwort ist zu kurz (mindestens 8).');
  if (findByHandle(name)) throw new Error('Diesen Namen hat schon jemand.');

  const id = run(
    `INSERT INTO accounts (handle, display_name, password_hash, created_at)
     VALUES (?, ?, ?, ?)`,
    name,
    String(displayName).slice(0, config.limits.displayNameLength),
    hashPassword(password),
    now(),
  );
  return findById(id);
}

export const findById = (id) => get('SELECT * FROM accounts WHERE id = ?', id);
export const findByHandle = (handle) =>
  get('SELECT * FROM accounts WHERE handle = ?', normaliseHandle(handle));

export function authenticate(handle, password) {
  const account = findByHandle(handle);
  if (!account) return null;
  return verifyPassword(password, account.password_hash) ? account : null;
}

export function startSession(accountId) {
  const id = randomToken(24);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  run(
    'INSERT INTO sessions (id, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    id,
    accountId,
    now(),
    expires,
  );
  return id;
}

export function accountForSession(sessionId) {
  if (!sessionId) return null;
  const row = get(
    `SELECT a.* FROM sessions s JOIN accounts a ON a.id = s.account_id
     WHERE s.id = ? AND s.expires_at > ?`,
    sessionId,
    now(),
  );
  return row ?? null;
}

export const endSession = (sessionId) => run('DELETE FROM sessions WHERE id = ?', sessionId);

export function follow(followerId, targetId) {
  if (followerId === targetId) return false;
  run(
    `INSERT OR IGNORE INTO follows (follower_id, target_id, created_at) VALUES (?, ?, ?)`,
    followerId,
    targetId,
    now(),
  );
  return true;
}

export const unfollow = (followerId, targetId) =>
  run('DELETE FROM follows WHERE follower_id = ? AND target_id = ?', followerId, targetId);

export const follows = (followerId, targetId) =>
  Boolean(get('SELECT 1 FROM follows WHERE follower_id = ? AND target_id = ?', followerId, targetId));

export const followingCount = (accountId) =>
  get('SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?', accountId).n;

/**
 * Es gibt bewusst keine öffentliche Follower-Zahl im Interface — die Zahl hier
 * ist für die Person selbst, damit sie weiß, wie weit ihr Beitrag reicht.
 */
export const followerCount = (accountId) =>
  get('SELECT COUNT(*) AS n FROM follows WHERE target_id = ?', accountId).n;

export const suggestions = (accountId, limit = 20) =>
  all(
    `SELECT * FROM accounts
      WHERE id != ?
        AND id NOT IN (SELECT target_id FROM follows WHERE follower_id = ?)
      ORDER BY (mono_at IS NULL), mono_at DESC, handle
      LIMIT ?`,
    accountId,
    accountId,
    limit,
  );
