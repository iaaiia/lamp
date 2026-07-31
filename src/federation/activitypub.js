/** ActivityStreams 2.0 document builders and the WebFinger resource. */

import config from '../config.js';
import { countFollowers, countFollowing } from '../domain/safety.js';

export const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

export const actorUrl = (username) => `${config.origin}/@${username}`;
export const inboxUrl = (username) => `${config.origin}/@${username}/inbox`;
export const outboxUrl = (username) => `${config.origin}/@${username}/outbox`;
export const sharedInboxUrl = () => `${config.origin}/inbox`;
export const keyId = (username) => `${actorUrl(username)}#main-key`;

const CONTEXT = [
  'https://www.w3.org/ns/activitystreams',
  'https://w3id.org/security/v1',
  {
    // Declared so other implementations can read lamb's well-being posture
    // instead of guessing it. Interop, not marketing.
    lamb: 'https://lamb.example/ns#',
    replyPolicy: 'lamb:replyPolicy',
    metricsPublic: 'lamb:metricsPublic',
  },
];

export function actorDocument(account, prefs) {
  return {
    '@context': CONTEXT,
    id: actorUrl(account.username),
    type: 'Person',
    preferredUsername: account.username,
    name: account.display_name || account.username,
    summary: account.bio || '',
    url: actorUrl(account.username),
    discoverable: Boolean(prefs.discoverable),
    indexable: Boolean(prefs.discoverable),
    manuallyApprovesFollowers: false,
    metricsPublic: Boolean(prefs.showMetrics),
    inbox: inboxUrl(account.username),
    outbox: outboxUrl(account.username),
    followers: `${actorUrl(account.username)}/followers`,
    following: `${actorUrl(account.username)}/following`,
    endpoints: { sharedInbox: sharedInboxUrl() },
    published: account.created_at,
    publicKey: {
      id: keyId(account.username),
      owner: actorUrl(account.username),
      publicKeyPem: account.public_key,
    },
  };
}

export function noteDocument(post, author) {
  const audience = post.visibility === 'public'
    ? { to: [PUBLIC], cc: [`${actorUrl(author.username)}/followers`] }
    : { to: [`${actorUrl(author.username)}/followers`], cc: [] };

  return {
    '@context': CONTEXT,
    id: post.uri,
    type: 'Note',
    attributedTo: actorUrl(author.username),
    content: post.content,
    summary: post.content_warning || null,
    sensitive: Boolean(post.content_warning),
    contentMap: { [post.language]: post.content },
    inReplyTo: post.in_reply_to_uri ?? null,
    replyPolicy: post.reply_policy,
    published: post.created_at,
    attachment: JSON.parse(post.media || '[]').map((item) => ({
      type: 'Document',
      url: item.url,
      // `name` is the alt text; lamb refuses to publish an attachment without it.
      name: item.alt,
    })),
    ...audience,
  };
}

export function createActivity(post, author) {
  const note = noteDocument(post, author);
  return {
    '@context': CONTEXT,
    id: `${post.uri}#create`,
    type: 'Create',
    actor: actorUrl(author.username),
    published: post.created_at,
    to: note.to,
    cc: note.cc,
    object: note,
  };
}

export const deleteActivity = (post, author) => ({
  '@context': CONTEXT,
  id: `${post.uri}#delete`,
  type: 'Delete',
  actor: actorUrl(author.username),
  to: [PUBLIC],
  object: { id: post.uri, type: 'Tombstone' },
});

export const followActivity = (follower, targetActorUrl, uri) => ({
  '@context': CONTEXT,
  id: uri,
  type: 'Follow',
  actor: actorUrl(follower.username),
  object: targetActorUrl,
});

export const acceptActivity = (localAccount, followActivityDocument) => ({
  '@context': CONTEXT,
  id: `${actorUrl(localAccount.username)}#accepts/${encodeURIComponent(followActivityDocument.id ?? '')}`,
  type: 'Accept',
  actor: actorUrl(localAccount.username),
  object: followActivityDocument,
});

export const undoActivity = (account, object) => ({
  '@context': CONTEXT,
  id: `${actorUrl(account.username)}#undo/${Date.now()}`,
  type: 'Undo',
  actor: actorUrl(account.username),
  object,
});

export function collection(id, items, { ordered = true } = {}) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id,
    type: ordered ? 'OrderedCollection' : 'Collection',
    totalItems: items.length,
    [ordered ? 'orderedItems' : 'items']: items,
  };
}

export function webfingerDocument(account) {
  const host = new URL(config.origin).host;
  return {
    subject: `acct:${account.username}@${host}`,
    aliases: [actorUrl(account.username)],
    links: [
      { rel: 'self', type: 'application/activity+json', href: actorUrl(account.username) },
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: actorUrl(account.username) },
    ],
  };
}

export function nodeInfo() {
  return {
    version: '2.1',
    software: { name: 'lamb', version: '0.1.0', repository: 'https://github.com/iaaiia/lamb' },
    protocols: ['activitypub'],
    services: { inbound: [], outbound: [] },
    openRegistrations: true,
    usage: { users: {} },
    metadata: {
      nodeName: config.instanceName,
      // Machine-readable statement of the product posture, so instance pickers
      // and youth organisations can filter for well-being defaults.
      wellbeingDefaults: {
        defaultFeed: config.defaults.feed,
        engagementRankingDefault: false,
        infiniteScroll: false,
        publicMetricsDefault: config.defaults.showMetrics,
        behaviouralAdvertising: false,
        altTextRequired: true,
        accountPortabilityExport: true,
      },
    },
  };
}

export const counts = (accountId) => ({
  followers: countFollowers(accountId),
  following: countFollowing(accountId),
});
