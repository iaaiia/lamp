/**
 * Consent-first interaction rules: follows, blocks, mutes, reply permissions.
 *
 * The reply-permission check is the single gate every reply passes through,
 * local or federated — a pile-on cannot be routed around by talking to the
 * inbox directly.
 */

import { all, get, now, run } from '../db.js';

/* -------------------------------------------------------------------- follows */

export function requestFollow(followerId, targetId, uri = null) {
  if (followerId === targetId) return null;
  if (isBlocked(targetId, followerId)) return null;

  const existing = get('SELECT * FROM follows WHERE follower_id = ? AND target_id = ?', followerId, targetId);
  if (existing) return existing;

  // Local accounts auto-accept today; a manual-approval mode is a WP3 backlog
  // item traceable to co-creation wave 2.
  run(
    'INSERT INTO follows (follower_id, target_id, state, uri, created_at) VALUES (?, ?, ?, ?, ?)',
    followerId,
    targetId,
    'accepted',
    uri,
    now(),
  );
  return get('SELECT * FROM follows WHERE follower_id = ? AND target_id = ?', followerId, targetId);
}

export const acceptFollow = (followerId, targetId) =>
  run("UPDATE follows SET state = 'accepted' WHERE follower_id = ? AND target_id = ?", followerId, targetId);

export const unfollow = (followerId, targetId) =>
  run('DELETE FROM follows WHERE follower_id = ? AND target_id = ?', followerId, targetId);

export const isFollowing = (followerId, targetId) =>
  Boolean(get("SELECT 1 FROM follows WHERE follower_id = ? AND target_id = ? AND state = 'accepted'", followerId, targetId));

export const followingIds = (accountId) =>
  all("SELECT target_id AS id FROM follows WHERE follower_id = ? AND state = 'accepted'", accountId).map((r) => r.id);

export const followerAccounts = (accountId) =>
  all(
    `SELECT a.* FROM follows f JOIN accounts a ON a.id = f.follower_id
     WHERE f.target_id = ? AND f.state = 'accepted'`,
    accountId,
  );

export const followingAccounts = (accountId) =>
  all(
    `SELECT a.* FROM follows f JOIN accounts a ON a.id = f.target_id
     WHERE f.follower_id = ? AND f.state = 'accepted'`,
    accountId,
  );

export const countFollowers = (accountId) =>
  get("SELECT COUNT(*) AS n FROM follows WHERE target_id = ? AND state = 'accepted'", accountId).n;

export const countFollowing = (accountId) =>
  get("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ? AND state = 'accepted'", accountId).n;

/* ------------------------------------------------------------- blocks / mutes */

export function block(accountId, targetId, kind = 'block') {
  run(
    'INSERT OR IGNORE INTO blocks (account_id, target_id, kind, created_at) VALUES (?, ?, ?, ?)',
    accountId,
    targetId,
    kind,
    now(),
  );
  if (kind === 'block') {
    // A block severs the relationship in both directions.
    unfollow(targetId, accountId);
    unfollow(accountId, targetId);
  }
}

export const unblock = (accountId, targetId, kind = 'block') =>
  run('DELETE FROM blocks WHERE account_id = ? AND target_id = ? AND kind = ?', accountId, targetId, kind);

/** Has `accountId` blocked `targetId`? */
export const isBlocked = (accountId, targetId) =>
  Boolean(get("SELECT 1 FROM blocks WHERE account_id = ? AND target_id = ? AND kind = 'block'", accountId, targetId));

export const isMuted = (accountId, targetId) =>
  Boolean(get("SELECT 1 FROM blocks WHERE account_id = ? AND target_id = ? AND kind = 'mute'", accountId, targetId));

/** Ids this account should not see content from, in either direction. */
export function hiddenAccountIds(accountId) {
  const rows = all(
    `SELECT target_id AS id FROM blocks WHERE account_id = ?
     UNION
     SELECT account_id AS id FROM blocks WHERE target_id = ? AND kind = 'block'`,
    accountId,
    accountId,
  );
  return rows.map((r) => r.id);
}

/* --------------------------------------------------------- reply permissions */

/**
 * May `actor` reply to `post`? Returns `{ allowed, reason }`.
 * `mentioned` is approximated by an @handle match in the post body — the
 * mention table is WP3 backlog, the gate itself is not.
 */
export function canReply(post, actor, authorUsername) {
  if (!actor) return { allowed: false, reason: 'Sign in to reply.' };
  if (post.account_id === actor.id) return { allowed: true };
  if (isBlocked(post.account_id, actor.id)) {
    return { allowed: false, reason: 'You cannot reply to this account.' };
  }

  switch (post.reply_policy) {
    case 'everyone':
      return { allowed: true };
    case 'followers':
      // Deliberately stricter than the Fediverse norm: the *author* must follow
      // the replier, not the other way round. Anyone can follow you; being
      // followed should not buy the right to speak in your thread.
      return isFollowing(post.account_id, actor.id)
        ? { allowed: true }
        : { allowed: false, reason: 'The author only takes replies from people they follow back.' };
    case 'mentioned': {
      const handle = actor.domain ? `@${actor.username}@${actor.domain}` : `@${actor.username}`;
      return post.content.includes(handle)
        ? { allowed: true }
        : { allowed: false, reason: 'The author allows replies from mentioned people only.' };
    }
    case 'nobody':
    default:
      return { allowed: false, reason: 'The author turned replies off for this post.' };
  }
}

/** Cool-down: rapid-fire replies to the same thread are the shape of a pile-on. */
export function replyCooldownRemaining(actorId, rootPostId, windowSeconds = 30) {
  const last = get(
    `SELECT created_at FROM posts
     WHERE account_id = ? AND in_reply_to = ? AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    actorId,
    rootPostId,
  );
  if (!last) return 0;
  const elapsed = (Date.now() - Date.parse(last.created_at)) / 1000;
  return elapsed >= windowSeconds ? 0 : Math.ceil(windowSeconds - elapsed);
}
