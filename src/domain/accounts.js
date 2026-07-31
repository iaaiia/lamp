/** Accounts: local registration, remote actor cache, preferences, pause/resume. */

import config from '../config.js';
import { all, get, now, run } from '../db.js';
import { generateKeyPair, hashPassword, randomToken, verifyPassword } from '../lib/crypto.js';

export class DomainError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export function defaultPreferences(isMinor = false) {
  return {
    ...config.defaults,
    ...(isMinor ? config.minorDefaults : {}),
  };
}

export function preferencesOf(account) {
  if (!account) return defaultPreferences();
  return { ...defaultPreferences(Boolean(account.is_minor)), ...JSON.parse(account.prefs || '{}') };
}

export function createLocalAccount({ username, password, displayName = '', isMinor = false }) {
  const handle = String(username ?? '').toLowerCase().trim();
  if (!USERNAME_RE.test(handle)) {
    throw new DomainError('Usernames use 3–30 lowercase letters, numbers or underscores.', 'username');
  }
  if (String(password ?? '').length < 10) {
    throw new DomainError('Passwords need at least 10 characters.', 'password');
  }
  if (get('SELECT id FROM accounts WHERE username = ? AND domain IS NULL', handle)) {
    throw new DomainError('That username is taken.', 'username');
  }

  const { publicKey, privateKey } = generateKeyPair();
  const id = run(
    `INSERT INTO accounts
       (username, domain, is_local, display_name, password_hash, is_minor, public_key, private_key, prefs, created_at)
     VALUES (?, NULL, 1, ?, ?, ?, ?, ?, ?, ?)`,
    handle,
    displayName.slice(0, config.limits.displayNameLength) || handle,
    hashPassword(password),
    isMinor ? 1 : 0,
    publicKey,
    privateKey,
    JSON.stringify(defaultPreferences(isMinor)),
    now(),
  );
  return findById(id);
}

/** Cache (or refresh) a remote actor so we can address and verify it later. */
export function upsertRemoteAccount({ username, domain, displayName, actorUrl, inboxUrl, sharedInboxUrl, publicKey, bio = '' }) {
  const existing = get('SELECT * FROM accounts WHERE actor_url = ?', actorUrl);
  if (existing) {
    run(
      `UPDATE accounts SET display_name = ?, bio = ?, inbox_url = ?, shared_inbox_url = ?, public_key = ?
       WHERE id = ?`,
      displayName ?? existing.display_name,
      bio,
      inboxUrl,
      sharedInboxUrl ?? null,
      publicKey ?? existing.public_key,
      existing.id,
    );
    return findById(existing.id);
  }
  const id = run(
    `INSERT INTO accounts
       (username, domain, is_local, display_name, bio, actor_url, inbox_url, shared_inbox_url, public_key, prefs, created_at)
     VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, '{}', ?)`,
    username,
    domain,
    displayName ?? username,
    bio,
    actorUrl,
    inboxUrl,
    sharedInboxUrl ?? null,
    publicKey ?? null,
    now(),
  );
  return findById(id);
}

export const findById = (id) => get('SELECT * FROM accounts WHERE id = ?', id);

export const findLocalByUsername = (username) =>
  get('SELECT * FROM accounts WHERE username = ? AND domain IS NULL', String(username).toLowerCase());

export const findByActorUrl = (url) => get('SELECT * FROM accounts WHERE actor_url = ?', url);

/** Resolve `@user` or `@user@domain` to an account row we already know about. */
export function findByHandle(handle) {
  const [username, domain] = String(handle).replace(/^@/, '').split('@');
  return domain
    ? get('SELECT * FROM accounts WHERE username = ? AND domain = ?', username.toLowerCase(), domain)
    : findLocalByUsername(username);
}

export function updatePreferences(accountId, patch) {
  const account = findById(accountId);
  if (!account) throw new DomainError('Unknown account.');
  const merged = { ...preferencesOf(account), ...patch };

  // Minor-protection floor: a minor account cannot be pushed into the more
  // exposed settings, whatever the form posts. DSA Art. 28 / call scope.
  if (account.is_minor) {
    Object.assign(merged, config.minorDefaults);
  }
  run('UPDATE accounts SET prefs = ? WHERE id = ?', JSON.stringify(merged), accountId);
  return merged;
}

export function updateProfile(accountId, { displayName, bio }) {
  run(
    'UPDATE accounts SET display_name = ?, bio = ? WHERE id = ?',
    String(displayName ?? '').slice(0, config.limits.displayNameLength),
    String(bio ?? '').slice(0, config.limits.bioLength),
    accountId,
  );
  return findById(accountId);
}

/**
 * "Pause my account": the account stops being visible and stops federating,
 * but nothing is deleted and the social graph survives. Reversible in one step.
 */
export function pauseAccount(accountId) {
  run('UPDATE accounts SET paused_at = ? WHERE id = ?', now(), accountId);
  return findById(accountId);
}

export function resumeAccount(accountId) {
  run('UPDATE accounts SET paused_at = NULL WHERE id = ?', accountId);
  return findById(accountId);
}

export const isPaused = (account) => Boolean(account?.paused_at);

/* ------------------------------------------------------------------ sessions */

export function authenticate(username, password) {
  const account = findLocalByUsername(username);
  if (!account || !verifyPassword(password, account.password_hash)) return null;
  return account;
}

export function createSession(accountId) {
  const id = randomToken();
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  run('INSERT INTO sessions (id, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)', id, accountId, now(), expires);
  return { id, expires };
}

export function accountForSession(sessionId) {
  if (!sessionId) return null;
  const row = get('SELECT * FROM sessions WHERE id = ? AND expires_at > ?', sessionId, now());
  return row ? findById(row.account_id) : null;
}

export const destroySession = (sessionId) => run('DELETE FROM sessions WHERE id = ?', sessionId);

/**
 * Portability export — the anti-lock-in guarantee, available to the user at any
 * time without asking anyone: profile, posts and social graph in one JSON file.
 */
export function exportAccount(accountId) {
  const account = findById(accountId);
  return {
    exportedAt: now(),
    profile: {
      username: account.username,
      displayName: account.display_name,
      bio: account.bio,
      createdAt: account.created_at,
      preferences: preferencesOf(account),
    },
    posts: all(
      'SELECT uri, content, content_warning, language, visibility, reply_policy, media, created_at FROM posts WHERE account_id = ? AND deleted_at IS NULL ORDER BY created_at',
      accountId,
    ),
    following: all(
      `SELECT a.username, a.domain, f.state FROM follows f JOIN accounts a ON a.id = f.target_id WHERE f.follower_id = ?`,
      accountId,
    ),
    followers: all(
      `SELECT a.username, a.domain, f.state FROM follows f JOIN accounts a ON a.id = f.follower_id WHERE f.target_id = ?`,
      accountId,
    ),
  };
}
