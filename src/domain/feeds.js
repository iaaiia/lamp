/**
 * Feed generators — the "middleware" layer.
 *
 * A feed generator is a named, swappable function that returns an ordered list
 * of post ids for a viewer. Third parties can register their own; the user
 * picks which one runs, and can switch or switch off at any time. Every
 * generator must declare `explanation`, shown in the UI above the feed, so a
 * ranked timeline is never unexplained.
 *
 * The interface is modelled on AT Protocol feed generators so that the same
 * third-party feed can serve both sides of the bridge.
 */

import config from '../config.js';
import { all } from '../db.js';
import { hiddenAccountIds, followingIds } from './safety.js';

/**
 * Cursors are composite — `created_at|id`. A timestamp alone is not a stable
 * key: several posts can share a millisecond, and a timestamp-only cursor
 * silently drops the rest of that millisecond from the next page.
 */
export const encodeCursor = (row) => `${row.created_at}|${row.id}`;

function decodeCursor(cursor) {
  if (!cursor) return null;
  const separator = cursor.lastIndexOf('|');
  if (separator === -1) return { createdAt: cursor, id: Number.MAX_SAFE_INTEGER };
  return { createdAt: cursor.slice(0, separator), id: Number(cursor.slice(separator + 1)) };
}

const registry = new Map();

export function registerFeed(generator) {
  if (!generator.id || typeof generator.build !== 'function') {
    throw new Error('A feed generator needs an id and a build() function.');
  }
  if (!generator.explanation) {
    throw new Error(`Feed "${generator.id}" must explain itself to users.`);
  }
  registry.set(generator.id, generator);
  return generator;
}

export const listFeeds = () => [...registry.values()].map(({ id, name, explanation, ranked }) => ({ id, name, explanation, ranked: Boolean(ranked) }));

export const getFeed = (id) => registry.get(id) ?? registry.get(config.defaults.feed);

/** Candidate posts for a viewer: own + followed, minus hidden accounts. */
function candidates(viewer, { limit, before }) {
  const authorIds = [viewer.id, ...followingIds(viewer.id)];
  const hidden = new Set(hiddenAccountIds(viewer.id));
  const visible = authorIds.filter((id) => !hidden.has(id));
  if (!visible.length) return [];
  const placeholders = visible.map(() => '?').join(',');
  const cursor = decodeCursor(before);

  return all(
    `SELECT p.*, a.username, a.domain, a.display_name, a.prefs AS author_prefs
     FROM posts p JOIN accounts a ON a.id = p.account_id
     WHERE p.account_id IN (${placeholders})
       AND p.deleted_at IS NULL
       AND a.paused_at IS NULL
       AND p.in_reply_to IS NULL
       AND (? IS NULL OR p.created_at < ? OR (p.created_at = ? AND p.id < ?))
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ?`,
    ...visible,
    cursor?.createdAt ?? null,
    cursor?.createdAt ?? null,
    cursor?.createdAt ?? null,
    cursor?.id ?? 0,
    limit,
  );
}

/**
 * The default. Strictly time-ordered, no scoring of any kind, and paged in
 * explicit steps — there is no infinite scroll anywhere in this product.
 */
registerFeed({
  id: 'chronological',
  name: 'Newest first',
  explanation: 'Everything from the people you follow, newest first. Nothing is ranked, hidden or boosted.',
  ranked: false,
  build: (viewer, options) => candidates(viewer, options),
});

/**
 * Opt-in alternative: still not engagement-optimised. It reorders *within* the
 * same time window so quieter accounts are not buried by prolific ones — a
 * request from co-creation wave 1 ("I miss my friends who post once a week").
 */
registerFeed({
  id: 'quiet-voices',
  name: 'Quiet voices first',
  explanation:
    'The same posts as "Newest first", but accounts that post rarely appear higher, so frequent posters do not crowd them out. No engagement data is used.',
  ranked: true,
  build: (viewer, options) => {
    const rows = candidates(viewer, { ...options, limit: options.limit * 3 });
    const frequency = new Map();
    for (const row of rows) frequency.set(row.account_id, (frequency.get(row.account_id) ?? 0) + 1);
    return rows
      .sort((a, b) => {
        const diff = frequency.get(a.account_id) - frequency.get(b.account_id);
        if (diff !== 0) return diff;
        return b.created_at.localeCompare(a.created_at) || b.id - a.id;
      })
      .slice(0, options.limit);
  },
});

/**
 * Build a timeline page.
 * Returns `{ feed, posts, nextCursor }` — `nextCursor` is only ever followed by
 * an explicit user action ("Show older posts"), never by a scroll listener.
 */
export function timeline(viewer, { feedId, before = null, limit = config.limits.pageSize } = {}) {
  const feed = getFeed(feedId);
  const posts = feed.build(viewer, { limit: limit + 1, before });
  const page = posts.slice(0, limit);
  return {
    feed: { id: feed.id, name: feed.name, explanation: feed.explanation, ranked: Boolean(feed.ranked) },
    posts: page,
    nextCursor: posts.length > limit ? encodeCursor(page.at(-1)) : null,
  };
}

/** A single account's public posts, chronological. */
export function accountTimeline(accountId, { before = null, limit = config.limits.pageSize } = {}) {
  const cursor = decodeCursor(before);
  const rows = all(
    `SELECT p.*, a.username, a.domain, a.display_name
     FROM posts p JOIN accounts a ON a.id = p.account_id
     WHERE p.account_id = ? AND p.deleted_at IS NULL AND p.in_reply_to IS NULL
       AND (? IS NULL OR p.created_at < ? OR (p.created_at = ? AND p.id < ?))
     ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
    accountId,
    cursor?.createdAt ?? null,
    cursor?.createdAt ?? null,
    cursor?.createdAt ?? null,
    cursor?.id ?? 0,
    limit + 1,
  );
  const page = rows.slice(0, limit);
  return { posts: page, nextCursor: rows.length > limit ? encodeCursor(page.at(-1)) : null };
}
