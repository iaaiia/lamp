/** Posts: creation, visibility, reactions, deletion. */

import config from '../config.js';
import { all, get, now, run } from '../db.js';
import { DomainError, findById, isPaused, preferencesOf } from './accounts.js';
import { canReply, isFollowing, replyCooldownRemaining } from './safety.js';
import { findById as findCircle, isMember } from './circles.js';

// 'circle' wird nie von aussen gesetzt — es folgt aus der Art des Kreises.
const VISIBILITIES = new Set(['public', 'followers', 'mentioned']);
const REPLY_POLICIES = new Set(['everyone', 'followers', 'mentioned', 'nobody']);

/** Mint the canonical ActivityPub id for a local post. */
const postUri = (username, id) => `${config.origin}/@${username}/posts/${id}`;

export function createPost(author, { content, contentWarning = null, language = 'en', visibility, replyPolicy, inReplyTo = null, media = [], circleId = null }) {
  const text = String(content ?? '').trim();
  if (!text) throw new DomainError('A post needs some text.', 'content');
  if (text.length > config.limits.postLength) {
    throw new DomainError(`Posts are limited to ${config.limits.postLength} characters.`, 'content');
  }

  // Alt text is not optional. An image without a description is not publishable
  // — accessibility is an acceptance criterion, not a nice-to-have.
  for (const item of media) {
    if (!item.alt || !String(item.alt).trim()) {
      throw new DomainError('Every image needs a description (alt text).', 'media');
    }
  }

  const prefs = preferencesOf(author);

  // In einem Kreis bestimmt der Kreis die Sichtbarkeit, nicht die einzelne
  // Person: Wer in einem privaten Kreis schreibt, kann das nicht versehentlich
  // öffentlich tun.
  let circle = null;
  if (circleId) {
    circle = findCircle(circleId);
    if (!circle) throw new DomainError('Diesen Kreis gibt es nicht.', 'circle');
    if (!isMember(circle.id, author.id)) {
      throw new DomainError('Du bist in diesem Kreis nicht Mitglied.', 'circle');
    }
  }

  const vis = circle
    ? (circle.kind === 'private' ? 'circle' : 'public')
    : (VISIBILITIES.has(visibility) ? visibility : (author.is_minor ? 'followers' : 'public'));
  const policy = REPLY_POLICIES.has(replyPolicy) ? replyPolicy : prefs.replyPolicy;

  if (inReplyTo) {
    const parent = findPostById(inReplyTo);
    if (!parent) throw new DomainError('Diesen Beitrag gibt es nicht mehr.');
    // Antworten bleiben in dem Kreis, in dem der Ursprungsbeitrag steht.
    if (parent.circle_id && !circleId) {
      circle = findCircle(parent.circle_id);
      if (!isMember(parent.circle_id, author.id)) {
        throw new DomainError('Du bist in diesem Kreis nicht Mitglied.', 'circle');
      }
    }
    const verdict = canReply(parent, author);
    if (!verdict.allowed) throw new DomainError(verdict.reason, 'reply');
    const wait = replyCooldownRemaining(author.id, parent.id);
    if (wait > 0) {
      throw new DomainError(`Take a breath — you can reply in this thread again in ${wait}s.`, 'reply');
    }
  }

  const id = run(
    `INSERT INTO posts (account_id, circle_id, uri, content, content_warning, language, visibility, reply_policy, in_reply_to, media, created_at)
     VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?)`,
    author.id,
    circle?.id ?? null,
    text,
    contentWarning || null,
    language,
    vis,
    policy,
    inReplyTo,
    JSON.stringify(media),
    now(),
  );
  run('UPDATE posts SET uri = ? WHERE id = ?', postUri(author.username, id), id);
  return findPostById(id);
}

/** Store a post that arrived over federation. */
export function ingestRemotePost(author, { uri, content, contentWarning = null, language = 'en', inReplyTo = null, createdAt, media = [] }) {
  const existing = get('SELECT * FROM posts WHERE uri = ?', uri);
  if (existing) return existing;
  const id = run(
    `INSERT INTO posts (account_id, uri, content, content_warning, language, visibility, reply_policy, in_reply_to, media, created_at)
     VALUES (?, ?, ?, ?, ?, 'public', 'followers', ?, ?, ?)`,
    author.id,
    uri,
    String(content ?? '').slice(0, config.limits.postLength),
    contentWarning,
    language,
    inReplyTo,
    JSON.stringify(media),
    createdAt ?? now(),
  );
  return findPostById(id);
}

export const findPostById = (id) =>
  get('SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL', id);

export const findPostByUri = (uri) =>
  get('SELECT * FROM posts WHERE uri = ? AND deleted_at IS NULL', uri);

export const deletePost = (postId, accountId) =>
  run('UPDATE posts SET deleted_at = ? WHERE id = ? AND account_id = ?', now(), postId, accountId);

export const repliesTo = (postId) =>
  all(
    `SELECT p.*, a.username, a.domain, a.display_name, a.paused_at
     FROM posts p JOIN accounts a ON a.id = p.account_id
     WHERE p.in_reply_to = ? AND p.deleted_at IS NULL AND a.paused_at IS NULL
     ORDER BY p.created_at ASC`,
    postId,
  );

/** Can `viewer` (possibly null) see this post? */
export function isVisibleTo(post, viewer) {
  const author = findById(post.account_id);
  if (!author || isPaused(author)) return false;
  if (viewer && viewer.id === post.account_id) return true;

  // Ein Beitrag in einem Kreis gehört dem Kreis: seine Regel schlägt jede
  // andere. Nichtmitglieder sehen ihn nicht, egal über welchen Weg sie kommen.
  if (post.circle_id) {
    const circle = findCircle(post.circle_id);
    if (!circle) return false;
    if (circle.kind === 'private') return Boolean(viewer) && isMember(circle.id, viewer.id);
    return true;
  }

  switch (post.visibility) {
    case 'public':
      return true;
    case 'followers':
      return Boolean(viewer) && isFollowing(viewer.id, post.account_id);
    case 'mentioned': {
      if (!viewer) return false;
      const handle = viewer.domain ? `@${viewer.username}@${viewer.domain}` : `@${viewer.username}`;
      return post.content.includes(handle);
    }
    default:
      return false;
  }
}

/* -------------------------------------------------------------------- Support */

/**
 * Support ist kein Like. Es sagt "ich stehe dahinter", nicht "ich finde das gut" —
 * und es wird deshalb als Menschen angezeigt, nicht als Zahl.
 *
 * @returns {{names: string[], total: number}} bis zu `limit` Namen plus Gesamtzahl.
 */
export function supporters(postId, limit = 3) {
  const rows = all(
    `SELECT a.display_name, a.username
     FROM reactions r JOIN accounts a ON a.id = r.account_id
     WHERE r.post_id = ? AND r.kind = 'like'
     ORDER BY r.created_at ASC`,
    postId,
  );
  return {
    names: rows.slice(0, limit).map((row) => row.display_name || row.username),
    total: rows.length,
  };
}

/**
 * Der Satz, der im Raum steht. Nie eine nackte Zahl: entweder Namen, oder —
 * sobald es mehr werden, als sich sinnvoll aufzählen lässt — Namen plus Rest.
 */
export function supportSentence(postId) {
  const { names, total } = supporters(postId);
  if (total === 0) return null;
  const rest = total - names.length;
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
  if (rest > 0) return `${names.join(', ')} und ${rest} weitere stehen dahinter`;
  return total === 1 ? `${list} steht dahinter` : `${list} stehen dahinter`;
}

/* ------------------------------------------------------------------ reactions */

export function react(accountId, postId, kind = 'like') {
  run(
    'INSERT OR IGNORE INTO reactions (account_id, post_id, kind, created_at) VALUES (?, ?, ?, ?)',
    accountId,
    postId,
    kind,
    now(),
  );
}

export const unreact = (accountId, postId, kind = 'like') =>
  run('DELETE FROM reactions WHERE account_id = ? AND post_id = ? AND kind = ?', accountId, postId, kind);

export const countReactions = (postId, kind = 'like') =>
  get('SELECT COUNT(*) AS n FROM reactions WHERE post_id = ? AND kind = ?', postId, kind).n;

export const hasReacted = (accountId, postId, kind = 'like') =>
  Boolean(get('SELECT 1 FROM reactions WHERE account_id = ? AND post_id = ? AND kind = ?', accountId, postId, kind));

/**
 * Whether a reaction count may be shown to `viewer`.
 *
 * Default: counts are for the author only. Public scoreboards are the feature
 * young co-creators most consistently name as harmful, so opting in is a
 * deliberate act by the *author*, not a viewer setting.
 */
export function metricsVisible(post, viewer) {
  const author = findById(post.account_id);
  if (!author) return false;
  if (viewer && viewer.id === author.id) return true;
  return Boolean(preferencesOf(author).showMetrics);
}
