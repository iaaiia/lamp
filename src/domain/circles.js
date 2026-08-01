/**
 * Kreise — die Räume, aus denen lamb besteht.
 *
 * Die Produktregel dahinter: Ein Mensch ist nie einfach "im Netzwerk", sondern
 * immer in einem konkreten Kreis mit bekannter Öffentlichkeit. Wer schreibt,
 * weiß, wer mitliest. Das ist die strukturelle Antwort auf Kontextkollaps — die
 * Mechanik, durch die ein Satz für Freund:innen plötzlich vor Fremden steht.
 *
 * Vier Arten, die sich nicht nur im Etikett unterscheiden:
 *
 *   private — Freundeskreis, Familie. Nur Mitglieder sehen etwas, und es
 *             verlässt diesen Server nie (siehe `federates`).
 *   topic   — Themenkreis. Öffentlich lesbar, föderiert.
 *   local   — an einen Ort gebunden, sonst wie topic.
 *   panel   — Youth Panel: öffentlich, moderiert, mit Verfahren (noch nicht gebaut).
 */

import { all, get, now, run } from '../db.js';
import { DomainError } from './accounts.js';

export const KINDS = new Set(['private', 'topic', 'local', 'panel']);
const JOINING = new Set(['open', 'request', 'invite']);

/** Private Kreise verlassen diesen Server nie. */
export const federates = (circle) => Boolean(circle) && circle.kind !== 'private';

/** Nur Mitglieder dürfen private Kreise lesen. */
export const isReadable = (circle, viewer) =>
  circle.kind !== 'private' || (Boolean(viewer) && isMember(circle.id, viewer.id));

export function slugify(name) {
  return String(name)
    .toLowerCase()
    // Umlaute zuerst ausschreiben — nach einer Unicode-Zerlegung wäre aus "ü"
    // schon "u" geworden, und "schueler" hiesse "schuler".
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function createCircle(creator, { name, purpose = '', kind = 'topic', joining, place = null }) {
  const label = String(name ?? '').trim();
  if (label.length < 3) throw new DomainError('Ein Kreis braucht einen Namen mit mindestens 3 Zeichen.', 'name');
  if (!KINDS.has(kind)) throw new DomainError('Diese Art von Kreis gibt es nicht.', 'kind');

  // Private Kreise sind immer auf Einladung — sonst wären sie nicht privat.
  const joinMode = kind === 'private' ? 'invite' : (JOINING.has(joining) ? joining : 'open');

  let slug = slugify(label);
  if (!slug) throw new DomainError('Aus diesem Namen lässt sich keine Adresse bilden.', 'name');
  if (get('SELECT id FROM circles WHERE slug = ?', slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const id = run(
    `INSERT INTO circles (slug, name, purpose, kind, joining, place, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    slug,
    label,
    String(purpose).slice(0, 280),
    kind,
    joinMode,
    kind === 'local' ? place : null,
    creator.id,
    now(),
  );
  // Wer einen Kreis öffnet, moderiert ihn — Moderation ist immer benannt.
  run(
    "INSERT INTO memberships (circle_id, account_id, role, state, created_at) VALUES (?, ?, 'moderator', 'member', ?)",
    id,
    creator.id,
    now(),
  );
  return findById(id);
}

export const findById = (id) => get('SELECT * FROM circles WHERE id = ?', id);
export const findBySlug = (slug) => get('SELECT * FROM circles WHERE slug = ?', slug);

/* --------------------------------------------------------- Mitgliedschaften */

export const membership = (circleId, accountId) =>
  get('SELECT * FROM memberships WHERE circle_id = ? AND account_id = ?', circleId, accountId);

export const isMember = (circleId, accountId) =>
  Boolean(get("SELECT 1 FROM memberships WHERE circle_id = ? AND account_id = ? AND state = 'member'", circleId, accountId));

export const isModerator = (circleId, accountId) =>
  Boolean(get("SELECT 1 FROM memberships WHERE circle_id = ? AND account_id = ? AND role = 'moderator' AND state = 'member'", circleId, accountId));

export const memberCount = (circleId) =>
  get("SELECT COUNT(*) AS n FROM memberships WHERE circle_id = ? AND state = 'member'", circleId).n;

export const members = (circleId, limit = 5) =>
  all(
    `SELECT a.* FROM memberships m JOIN accounts a ON a.id = m.account_id
     WHERE m.circle_id = ? AND m.state = 'member'
     ORDER BY m.created_at ASC LIMIT ?`,
    circleId,
    limit,
  );

/**
 * Beitreten. `open` nimmt sofort auf, `request` legt eine Anfrage an,
 * `invite` lehnt ab — Einladungen laufen über `invite()`.
 */
export function join(circle, account) {
  const existing = membership(circle.id, account.id);
  if (existing) return existing;
  if (circle.joining === 'invite') {
    throw new DomainError('Dieser Kreis ist nur auf Einladung offen.', 'joining');
  }
  const state = circle.joining === 'open' ? 'member' : 'pending';
  run(
    'INSERT INTO memberships (circle_id, account_id, role, state, created_at) VALUES (?, ?, ?, ?, ?)',
    circle.id,
    account.id,
    'member',
    state,
    now(),
  );
  return membership(circle.id, account.id);
}

export function invite(circle, moderator, account) {
  if (!isModerator(circle.id, moderator.id)) {
    throw new DomainError('Nur die Moderation dieses Kreises kann einladen.');
  }
  if (membership(circle.id, account.id)) return membership(circle.id, account.id);
  run(
    "INSERT INTO memberships (circle_id, account_id, role, state, created_at) VALUES (?, ?, 'member', 'member', ?)",
    circle.id,
    account.id,
    now(),
  );
  return membership(circle.id, account.id);
}

export function admit(circle, moderator, accountId) {
  if (!isModerator(circle.id, moderator.id)) {
    throw new DomainError('Nur die Moderation dieses Kreises kann aufnehmen.');
  }
  run("UPDATE memberships SET state = 'member' WHERE circle_id = ? AND account_id = ?", circle.id, accountId);
}

/**
 * Verlassen. Die letzte Moderation kann nicht gehen, ohne den Kreis führungslos
 * zurückzulassen — dann muss vorher jemand anders benannt werden.
 */
export function leave(circle, account) {
  if (isModerator(circle.id, account.id)) {
    const moderators = get(
      "SELECT COUNT(*) AS n FROM memberships WHERE circle_id = ? AND role = 'moderator' AND state = 'member'",
      circle.id,
    ).n;
    if (moderators <= 1) {
      throw new DomainError('Du moderierst diesen Kreis allein. Benenne erst jemand anderen.');
    }
  }
  run('DELETE FROM memberships WHERE circle_id = ? AND account_id = ?', circle.id, account.id);
}

export const pendingRequests = (circleId) =>
  all(
    `SELECT a.*, m.created_at AS requested_at FROM memberships m JOIN accounts a ON a.id = m.account_id
     WHERE m.circle_id = ? AND m.state = 'pending' ORDER BY m.created_at ASC`,
    circleId,
  );

/* ------------------------------------------------------------------ Übersicht */

/**
 * Die Cluster-Startseite: alle Kreise einer Person, mit dem, was seit dem
 * letzten Besuch dazugekommen ist.
 *
 * Bewusst kein "Ungelesen"-Zähler pro Beitrag: gezählt wird, was seit dem
 * letzten Öffnen des Kreises geschrieben wurde. Ein Badge, das nie auf null
 * geht, ist ein Zugmechanismus, kein Informationsdienst.
 */
export function circlesFor(accountId) {
  return all(
    `SELECT c.*, m.role, m.state, m.last_read_at,
            (SELECT COUNT(*) FROM memberships x WHERE x.circle_id = c.id AND x.state = 'member') AS member_count,
            (SELECT COUNT(*) FROM posts p
               WHERE p.circle_id = c.id AND p.deleted_at IS NULL
                 AND (m.last_read_at IS NULL OR p.created_at > m.last_read_at)
                 AND p.account_id != ?) AS fresh_count,
            (SELECT p.created_at FROM posts p
               WHERE p.circle_id = c.id AND p.deleted_at IS NULL
               ORDER BY p.created_at DESC LIMIT 1) AS last_post_at,
            -- Vorschau für die Hero-Kachel: "wo etwas los ist" heisst zu zeigen,
            -- was dort gesagt wurde. Nur eigene Kreise, also kein Leck.
            (SELECT p.content FROM posts p
               WHERE p.circle_id = c.id AND p.deleted_at IS NULL AND p.content_warning IS NULL
               ORDER BY p.created_at DESC LIMIT 1) AS last_post_content,
            (SELECT COALESCE(NULLIF(a.display_name, ''), a.username) FROM posts p
               JOIN accounts a ON a.id = p.account_id
               WHERE p.circle_id = c.id AND p.deleted_at IS NULL AND p.content_warning IS NULL
               ORDER BY p.created_at DESC LIMIT 1) AS last_post_author
     FROM memberships m JOIN circles c ON c.id = m.circle_id
     WHERE m.account_id = ? AND m.state = 'member'
     ORDER BY COALESCE(last_post_at, c.created_at) DESC`,
    accountId,
    accountId,
  );
}

/** Öffentliche Kreise zum Entdecken — private tauchen hier nie auf. */
export function discoverable(accountId, limit = 12) {
  return all(
    `SELECT c.*,
            (SELECT COUNT(*) FROM memberships x WHERE x.circle_id = c.id AND x.state = 'member') AS member_count
     FROM circles c
     WHERE c.kind != 'private'
       AND c.id NOT IN (SELECT circle_id FROM memberships WHERE account_id = ?)
     ORDER BY member_count DESC, c.created_at DESC
     LIMIT ?`,
    accountId,
    limit,
  );
}

/**
 * Kreise suchen. Nur offene — private Kreise tauchen in keiner Suche auf, sonst
 * liesse sich ihre Existenz erraten.
 */
export function searchCircles(query, limit = 24) {
  const term = `%${String(query ?? '').trim().toLowerCase()}%`;
  return all(
    `SELECT c.*,
            (SELECT COUNT(*) FROM memberships x WHERE x.circle_id = c.id AND x.state = 'member') AS member_count,
            (SELECT p.created_at FROM posts p WHERE p.circle_id = c.id AND p.deleted_at IS NULL
               ORDER BY p.created_at DESC LIMIT 1) AS last_post_at
     FROM circles c
     WHERE c.kind != 'private'
       AND (LOWER(c.name) LIKE ? OR LOWER(c.purpose) LIKE ? OR LOWER(COALESCE(c.place, '')) LIKE ?)
     ORDER BY member_count DESC, c.created_at DESC
     LIMIT ?`,
    term,
    term,
    term,
    limit,
  );
}

export function markRead(circleId, accountId) {
  run('UPDATE memberships SET last_read_at = ? WHERE circle_id = ? AND account_id = ?', now(), circleId, accountId);
}

/** Beiträge eines Kreises, chronologisch, mit explizitem Blättern. */
export function circleTimeline(circleId, { before = null, limit = 20 } = {}) {
  const separator = before ? before.lastIndexOf('|') : -1;
  const createdAt = separator === -1 ? before : before.slice(0, separator);
  const id = separator === -1 ? Number.MAX_SAFE_INTEGER : Number(before.slice(separator + 1));

  const rows = all(
    `SELECT p.*, a.username, a.domain, a.display_name
     FROM posts p JOIN accounts a ON a.id = p.account_id
     WHERE p.circle_id = ? AND p.deleted_at IS NULL AND p.in_reply_to IS NULL
       AND a.paused_at IS NULL
       AND (? IS NULL OR p.created_at < ? OR (p.created_at = ? AND p.id < ?))
     ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
    circleId,
    createdAt ?? null,
    createdAt ?? null,
    createdAt ?? null,
    id,
    limit + 1,
  );
  const page = rows.slice(0, limit);

  // Die ersten Antworten gleich mitliefern: Ein Gespräch, das man erst
  // aufklappen muss, ist keins.
  for (const post of page) {
    post.replies = all(
      `SELECT p.*, a.username, a.domain, a.display_name
       FROM posts p JOIN accounts a ON a.id = p.account_id
       WHERE p.in_reply_to = ? AND p.deleted_at IS NULL AND a.paused_at IS NULL
       ORDER BY p.created_at ASC LIMIT 4`,
      post.id,
    );
  }

  return {
    posts: page,
    nextCursor: rows.length > limit ? `${page.at(-1).created_at}|${page.at(-1).id}` : null,
  };
}

/* ------------------------------------------------ Ansichten im Chatfenster */

/**
 * Themen: nicht alles, was gesagt wurde, sondern woraus etwas geworden ist.
 * Ein Beitrag wird zum Thema, wenn jemand geantwortet hat oder jemand
 * dahintersteht — Themen definieren sich über die Zuwendung des Kreises, nicht
 * über die Absicht der Schreibenden. Sonst wäre „Themen“ nur das Gespräch
 * zweimal.
 *
 * Sortiert nach letzter Regung, nicht nach Menge — wo zuletzt gesprochen wurde,
 * steht oben. Reichweite ordnet hier nichts.
 */
export function circleThreads(circleId, limit = 30) {
  return all(
    `SELECT p.*, a.username, a.domain, a.display_name,
            (SELECT COUNT(*) FROM posts r WHERE r.in_reply_to = p.id AND r.deleted_at IS NULL) AS reply_count,
            (SELECT COUNT(*) FROM reactions x WHERE x.post_id = p.id) AS support_count,
            COALESCE((SELECT MAX(r.created_at) FROM posts r WHERE r.in_reply_to = p.id AND r.deleted_at IS NULL),
                     p.created_at) AS last_activity
     FROM posts p JOIN accounts a ON a.id = p.account_id
     WHERE p.circle_id = ? AND p.deleted_at IS NULL AND p.in_reply_to IS NULL AND a.paused_at IS NULL
       AND (reply_count > 0 OR support_count > 0)
     ORDER BY last_activity DESC
     LIMIT ?`,
    circleId,
    limit,
  );
}

/** Wer hier ist — mit Rolle, damit Moderation sichtbar bleibt. */
export function circlePeople(circleId) {
  return all(
    `SELECT a.*, m.role, m.created_at AS joined_at,
            (SELECT COUNT(*) FROM posts p
               WHERE p.circle_id = ? AND p.account_id = a.id AND p.deleted_at IS NULL) AS post_count
     FROM memberships m JOIN accounts a ON a.id = m.account_id
     WHERE m.circle_id = ? AND m.state = 'member'
     ORDER BY CASE m.role WHEN 'moderator' THEN 0 ELSE 1 END, m.created_at ASC`,
    circleId,
    circleId,
  );
}

/**
 * Wo Rückhalt gegeben wurde. Bewusst nicht nach Menge sortiert, sondern nach
 * dem jüngsten Support — sonst wäre es doch wieder eine Rangliste.
 */
export function circleSupported(circleId, limit = 20) {
  return all(
    `SELECT p.*, a.username, a.domain, a.display_name,
            MAX(r.created_at) AS last_support
     FROM reactions r
     JOIN posts p ON p.id = r.post_id
     JOIN accounts a ON a.id = p.account_id
     WHERE p.circle_id = ? AND p.deleted_at IS NULL AND a.paused_at IS NULL
     GROUP BY p.id
     ORDER BY last_support DESC
     LIMIT ?`,
    circleId,
    limit,
  );
}

export const KIND_LABELS = {
  private: 'Privat',
  topic: 'Thema',
  local: 'Lokal',
  panel: 'Youth Panel',
};
