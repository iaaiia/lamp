/**
 * Der eine Beitrag.
 *
 * Alles in dieser Datei läuft auf eine Regel hinaus: Etwas Neues zu sagen
 * heißt, das Alte zu löschen. Nicht zu archivieren, nicht zu verbergen — zu
 * löschen. `replace()` ist deshalb der einzige Schreibweg, und jeder Aufruf
 * räumt zuerst auf. Ein Konto kann nie zwei Beiträge haben, weil es dafür
 * keinen Codepfad und keine Zeile im Schema gibt.
 */

import { all, get, now, run } from '../db.js';
import config from '../config.js';

export class MonoError extends Error {}

const kindFor = (contentType) => {
  if (config.media.image.includes(contentType)) return 'image';
  if (config.media.video.includes(contentType)) return 'video';
  return null;
};

/** Löscht den aktuellen Beitrag samt Medium. Danach ist der Platz leer. */
export function clear(accountId) {
  const account = get('SELECT mono_media_id FROM accounts WHERE id = ?', accountId);
  if (!account) throw new MonoError('unknown account');
  run(
    'UPDATE accounts SET mono_text = NULL, mono_media_id = NULL, mono_at = NULL WHERE id = ?',
    accountId,
  );
  if (account.mono_media_id) run('DELETE FROM media WHERE id = ?', account.mono_media_id);
  return true;
}

/**
 * Setzt den Beitrag — Text, Medium oder beides — und löscht dabei den alten.
 * Der einzige Schreibweg. Es gibt keinen `append`.
 */
export function replace(accountId, { text = '', media = null } = {}) {
  const value = String(text ?? '').trim();
  if (value.length > config.limits.monoLength) {
    throw new MonoError(`Das ist länger als ${config.limits.monoLength} Zeichen.`);
  }
  if (!value && !media) throw new MonoError('Ein Beitrag braucht Text oder ein Foto/Video.');

  let mediaId = null;
  if (media) {
    const kind = kindFor(media.contentType);
    if (!kind) {
      throw new MonoError(`Dieses Dateiformat geht nicht: ${media.contentType || 'unbekannt'}.`);
    }
    if (!media.data?.length) throw new MonoError('Die Datei war leer.');
    if (media.data.length > config.limits.mediaBytes) {
      throw new MonoError(`Die Datei ist größer als ${config.limits.mediaBytes / 1024 / 1024} MB.`);
    }

    // Bildbeschreibung ist Pflicht — auch beim Video, wo sie sagt, was zu sehen
    // und zu hoeren ist. Ohne sie waere der eine Beitrag fuer manche leer.
    const alt = String(media.alt ?? '').trim();
    if (!alt) throw new MonoError('Schreib dazu, was zu sehen ist — ohne das geht es nicht.');

    mediaId = run(
      `INSERT INTO media (account_id, kind, content_type, alt, bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      accountId,
      kind,
      media.contentType,
      alt.slice(0, config.limits.altLength),
      media.data,
      now(),
    );
  }

  // Erst jetzt raeumen: Waere oben etwas fehlgeschlagen, stuende der alte
  // Beitrag noch. Niemand verliert seinen Beitrag an einen Formularfehler.
  clear(accountId);

  run(
    'UPDATE accounts SET mono_text = ?, mono_media_id = ?, mono_at = ? WHERE id = ?',
    value || null,
    mediaId,
    now(),
    accountId,
  );
  return read(accountId);
}

const hydrate = (row) => {
  if (!row) return null;
  const mono = {
    account: { id: row.id, handle: row.handle, displayName: row.display_name },
    text: row.mono_text ?? '',
    at: row.mono_at,
    media: null,
  };
  if (!row.mono_at) return null;
  if (row.mono_media_id) {
    const media = get('SELECT id, kind, content_type, alt FROM media WHERE id = ?', row.mono_media_id);
    if (media) {
      mono.media = { id: media.id, kind: media.kind, contentType: media.content_type, alt: media.alt };
    }
  }
  return mono;
};

/** Der aktuelle Beitrag eines Kontos — oder null, wenn gerade nichts dasteht. */
export const read = (accountId) => hydrate(get('SELECT * FROM accounts WHERE id = ?', accountId));

export const readByHandle = (handle) =>
  hydrate(get('SELECT * FROM accounts WHERE handle = ?', String(handle).toLowerCase()));

export const mediaBytes = (id) => get('SELECT * FROM media WHERE id = ?', id);

/**
 * Was die Leute gerade sagen, denen du folgst. Streng nach Zeit, ohne
 * Nachladen, ohne Rang: Die Liste ist so lang wie deine Leute, nicht laenger.
 */
export const circle = (accountId) =>
  all(
    `SELECT a.* FROM follows f JOIN accounts a ON a.id = f.target_id
      WHERE f.follower_id = ? AND a.mono_at IS NOT NULL
      ORDER BY a.mono_at DESC`,
    accountId,
  ).map(hydrate);

/** Alle, die gerade etwas sagen — die offene Wand. */
export const wall = (limit = 60) =>
  all(
    `SELECT * FROM accounts WHERE mono_at IS NOT NULL ORDER BY mono_at DESC LIMIT ?`,
    limit,
  ).map(hydrate);
