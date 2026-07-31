/**
 * Outbound delivery: signed POSTs to remote inboxes, queued and retried.
 *
 * Paused accounts never deliver — pausing has to be real on the network, not
 * only in the local UI.
 */

import config from '../config.js';
import { all, get, now, run } from '../db.js';
import { signRequest } from '../lib/crypto.js';
import { keyId } from './activitypub.js';

/** Deduplicated inboxes for an audience (shared inbox preferred). */
export function inboxesFor(accounts) {
  const seen = new Set();
  for (const account of accounts) {
    if (account.is_local) continue;
    const url = account.shared_inbox_url || account.inbox_url;
    if (url) seen.add(url);
  }
  return [...seen];
}

export function enqueue(actor, inboxUrls, activity) {
  if (actor.paused_at) return [];
  const payload = JSON.stringify(activity);
  return inboxUrls.map((url) =>
    run(
      'INSERT INTO deliveries (inbox_url, actor_id, payload, created_at) VALUES (?, ?, ?, ?)',
      url,
      actor.id,
      payload,
      now(),
    ),
  );
}

async function post(delivery, actor) {
  const headers = signRequest({
    keyId: keyId(actor.username),
    privateKey: actor.private_key,
    method: 'POST',
    url: delivery.inbox_url,
    body: delivery.payload,
  });
  const response = await fetch(delivery.inbox_url, {
    method: 'POST',
    headers: { ...headers, accept: 'application/activity+json', 'user-agent': config.federation.userAgent },
    body: delivery.payload,
    signal: AbortSignal.timeout(config.federation.deliveryTimeoutMs),
  });
  if (!response.ok) throw new Error(`inbox responded ${response.status}`);
}

/**
 * Attempt every queued delivery once. Returns `{ sent, failed }`.
 * Called on a timer by the server; called directly by tests.
 */
export async function flushQueue() {
  if (!config.federation.enabled) return { sent: 0, failed: 0 };

  const queued = all("SELECT * FROM deliveries WHERE state = 'queued' ORDER BY id LIMIT 50");
  let sent = 0;
  let failed = 0;

  for (const delivery of queued) {
    const actor = get('SELECT * FROM accounts WHERE id = ?', delivery.actor_id);
    if (!actor?.private_key) {
      run("UPDATE deliveries SET state = 'failed', last_error = 'no signing key' WHERE id = ?", delivery.id);
      failed += 1;
      continue;
    }
    try {
      await post(delivery, actor);
      run("UPDATE deliveries SET state = 'sent', attempts = attempts + 1 WHERE id = ?", delivery.id);
      sent += 1;
    } catch (error) {
      const attempts = delivery.attempts + 1;
      const state = attempts >= config.federation.maxAttempts ? 'failed' : 'queued';
      run('UPDATE deliveries SET attempts = ?, state = ?, last_error = ? WHERE id = ?', attempts, state, String(error.message), delivery.id);
      if (state === 'failed') failed += 1;
    }
  }
  return { sent, failed };
}

/** Fetch a remote actor document and normalise the fields we store. */
export async function fetchActor(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/activity+json', 'user-agent': config.federation.userAgent },
    signal: AbortSignal.timeout(config.federation.deliveryTimeoutMs),
  });
  if (!response.ok) throw new Error(`actor fetch failed: ${response.status}`);
  return normaliseActor(await response.json());
}

export function normaliseActor(document) {
  return {
    actorUrl: document.id,
    username: document.preferredUsername,
    domain: document.id ? new URL(document.id).host : null,
    displayName: document.name ?? document.preferredUsername,
    bio: typeof document.summary === 'string' ? document.summary : '',
    inboxUrl: document.inbox,
    sharedInboxUrl: document.endpoints?.sharedInbox ?? null,
    publicKey: document.publicKey?.publicKeyPem ?? null,
  };
}

/** Resolve `user@host` via WebFinger to an actor URL. */
export async function resolveHandle(handle) {
  const [username, host] = handle.replace(/^@/, '').split('@');
  if (!username || !host) throw new Error('Handles look like @name@server.');
  const response = await fetch(`https://${host}/.well-known/webfinger?resource=acct:${username}@${host}`, {
    headers: { accept: 'application/jrd+json', 'user-agent': config.federation.userAgent },
    signal: AbortSignal.timeout(config.federation.deliveryTimeoutMs),
  });
  if (!response.ok) throw new Error(`webfinger failed: ${response.status}`);
  const document = await response.json();
  const link = document.links?.find((l) => l.rel === 'self' && l.type === 'application/activity+json');
  if (!link?.href) throw new Error('That server did not return an actor link.');
  return link.href;
}
