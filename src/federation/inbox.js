/**
 * Inbound federation: verify the signature, then handle the activity.
 *
 * The important property here is that federated actions go through the *same*
 * domain rules as local ones. A remote server cannot reply to a post whose
 * author disallows it, cannot address a paused account, and cannot bypass a
 * block by posting to the inbox directly.
 */

import { findByActorUrl, upsertRemoteAccount } from '../domain/accounts.js';
import { ingestRemotePost, findPostByUri } from '../domain/posts.js';
import { canReply, isBlocked, requestFollow, unfollow } from '../domain/safety.js';
import { triage } from '../domain/moderation.js';
import { get, now, run } from '../db.js';
import { parseSignatureHeader, verifySignature } from '../lib/crypto.js';
import { acceptActivity, actorUrl } from './activitypub.js';
import { enqueue, fetchActor, normaliseActor } from './delivery.js';

/**
 * Verify an inbound request.
 * `resolveActor` is injectable so tests can avoid the network.
 */
export async function authenticateRequest({ method, path, headers, body }, resolveActor = fetchActor) {
  const signature = parseSignatureHeader(headers.signature ?? headers.authorization);
  if (!signature) return { ok: false, reason: 'missing signature' };

  const ownerUrl = signature.keyId.split('#')[0];
  let account = findByActorUrl(ownerUrl);

  if (!account?.public_key) {
    try {
      const fetched = await resolveActor(ownerUrl);
      account = upsertRemoteAccount(fetched);
    } catch (error) {
      return { ok: false, reason: `actor unresolvable: ${error.message}` };
    }
  }

  const result = verifySignature({
    signature,
    publicKey: account.public_key,
    method,
    path,
    headers,
    body,
  });
  return result.ok ? { ok: true, account } : { ok: false, reason: result.reason };
}

const objectId = (object) => (typeof object === 'string' ? object : object?.id);

/** Handle a verified activity addressed to `localAccount` (null = shared inbox). */
export async function handleActivity(activity, sender, localAccount = null) {
  switch (activity.type) {
    case 'Follow':
      return handleFollow(activity, sender);
    case 'Undo':
      return handleUndo(activity, sender);
    case 'Accept':
      return handleAccept(activity, sender);
    case 'Create':
      return handleCreate(activity, sender);
    case 'Delete':
      return handleDelete(activity, sender);
    case 'Like':
      return handleLike(activity, sender);
    default:
      return { status: 202, note: `ignored ${activity.type}` };
  }
}

function localAccountFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/\/@([a-z0-9_]+)$/i);
  return match ? get('SELECT * FROM accounts WHERE username = ? AND domain IS NULL', match[1].toLowerCase()) : null;
}

function handleFollow(activity, sender) {
  const target = localAccountFromUrl(objectId(activity.object));
  if (!target) return { status: 404, note: 'unknown target' };
  if (target.paused_at) return { status: 202, note: 'account paused' };
  if (isBlocked(target.id, sender.id)) return { status: 202, note: 'blocked' };

  requestFollow(sender.id, target.id, activity.id);
  enqueue(target, [sender.shared_inbox_url || sender.inbox_url].filter(Boolean), acceptActivity(target, activity));
  return { status: 202, note: 'followed' };
}

function handleUndo(activity, sender) {
  const inner = activity.object;
  if (inner?.type === 'Follow') {
    const target = localAccountFromUrl(objectId(inner.object));
    if (target) unfollow(sender.id, target.id);
    return { status: 202, note: 'unfollowed' };
  }
  if (inner?.type === 'Like') {
    const post = findPostByUri(objectId(inner.object));
    if (post) run('DELETE FROM reactions WHERE account_id = ? AND post_id = ?', sender.id, post.id);
    return { status: 202, note: 'unliked' };
  }
  return { status: 202, note: 'ignored undo' };
}

function handleAccept(activity, sender) {
  const inner = activity.object;
  if (inner?.type !== 'Follow') return { status: 202, note: 'ignored accept' };
  const follower = localAccountFromUrl(inner.actor);
  if (follower) {
    run("UPDATE follows SET state = 'accepted' WHERE follower_id = ? AND target_id = ?", follower.id, sender.id);
  }
  return { status: 202, note: 'follow accepted' };
}

function handleCreate(activity, sender) {
  const note = activity.object;
  if (!note || note.type !== 'Note') return { status: 202, note: 'ignored object type' };

  let inReplyTo = null;
  if (note.inReplyTo) {
    const parent = findPostByUri(objectId(note.inReplyTo));
    if (parent) {
      // Same gate as the local composer: the author's reply setting wins,
      // whichever server the reply came from.
      const verdict = canReply(parent, sender);
      if (!verdict.allowed) return { status: 403, note: `reply rejected: ${verdict.reason}` };
      inReplyTo = parent.id;
    }
  }

  const language = typeof note.contentMap === 'object' && note.contentMap
    ? Object.keys(note.contentMap)[0] ?? 'en'
    : 'en';

  const post = ingestRemotePost(sender, {
    uri: note.id,
    content: stripHtml(note.content ?? ''),
    contentWarning: note.summary ?? null,
    language,
    inReplyTo,
    createdAt: note.published,
    media: (note.attachment ?? [])
      .filter((item) => item.url)
      // No alt text, no display: undescribed media is dropped rather than
      // shown to screen-reader users as an unlabelled blob.
      .filter((item) => item.name)
      .map((item) => ({ url: item.url, alt: item.name })),
  });

  triage(post);
  return { status: 202, note: 'created', postId: post.id };
}

function handleDelete(activity, sender) {
  const uri = objectId(activity.object);
  const post = findPostByUri(uri);
  if (post && post.account_id === sender.id) {
    run('UPDATE posts SET deleted_at = ? WHERE id = ?', now(), post.id);
  }
  return { status: 202, note: 'deleted' };
}

function handleLike(activity, sender) {
  const post = findPostByUri(objectId(activity.object));
  if (!post) return { status: 404, note: 'unknown post' };
  if (isBlocked(post.account_id, sender.id)) return { status: 202, note: 'blocked' };
  run(
    "INSERT OR IGNORE INTO reactions (account_id, post_id, kind, created_at) VALUES (?, ?, 'like', ?)",
    sender.id,
    post.id,
    now(),
  );
  return { status: 202, note: 'liked' };
}

/** Remote content arrives as HTML; LAMP stores and renders plain text. */
export function stripHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export { normaliseActor, actorUrl };
