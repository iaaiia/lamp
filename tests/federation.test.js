/** ActivityPub: signatures, inbox handling and the rule that federation obeys the same limits. */

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { freshDatabase, makeAccount } from './helpers.js';
import config from '../src/config.js';
import { upsertRemoteAccount } from '../src/domain/accounts.js';
import { createPost, findPostByUri } from '../src/domain/posts.js';
import { block, isFollowing, requestFollow } from '../src/domain/safety.js';
import { generateKeyPair, signRequest, parseSignatureHeader, verifySignature } from '../src/lib/crypto.js';
import { actorDocument, noteDocument, webfingerDocument } from '../src/federation/activitypub.js';
import { authenticateRequest, handleActivity, stripHtml } from '../src/federation/inbox.js';
import { normaliseActor } from '../src/federation/delivery.js';
import { preferencesOf } from '../src/domain/accounts.js';

beforeEach(freshDatabase);

/** A remote server with a real key pair, so signatures are genuinely verified. */
function makeRemote(username = 'remote', host = 'remote.example') {
  const { publicKey, privateKey } = generateKeyPair();
  const account = upsertRemoteAccount({
    username,
    domain: host,
    displayName: username,
    actorUrl: `https://${host}/users/${username}`,
    inboxUrl: `https://${host}/users/${username}/inbox`,
    sharedInboxUrl: `https://${host}/inbox`,
    publicKey,
  });
  return { account, privateKey, publicKey };
}

function signedPost(remote, path, activity) {
  const body = JSON.stringify(activity);
  const headers = signRequest({
    keyId: `${remote.account.actor_url}#main-key`,
    privateKey: remote.privateKey,
    method: 'POST',
    url: `${config.origin}${path}`,
    body,
  });
  return { method: 'POST', path, headers, body };
}

describe('documents', () => {
  it('serves a valid actor with a public key and shared inbox', () => {
    const account = makeAccount('ada');
    const doc = actorDocument(account, preferencesOf(account));
    assert.equal(doc.type, 'Person');
    assert.equal(doc.preferredUsername, 'ada');
    assert.ok(doc.publicKey.publicKeyPem.includes('BEGIN PUBLIC KEY'));
    assert.ok(doc.inbox.endsWith('/@ada/inbox'));
    assert.ok(doc.endpoints.sharedInbox.endsWith('/inbox'));
  });

  it('publishes the reply policy and alt text on the wire', () => {
    const account = makeAccount('ada2');
    const post = createPost(account, {
      content: 'hello world',
      replyPolicy: 'mentioned',
      media: [{ url: 'https://example.org/a.png', alt: 'A red bicycle' }],
    });
    const note = noteDocument(post, account);
    assert.equal(note.replyPolicy, 'mentioned');
    assert.equal(note.attachment[0].name, 'A red bicycle');
  });

  it('answers webfinger with an actor link', () => {
    const account = makeAccount('finger');
    const doc = webfingerDocument(account);
    const self = doc.links.find((l) => l.rel === 'self');
    assert.equal(self.type, 'application/activity+json');
  });
});

describe('http signatures', () => {
  it('round-trips a signed request', () => {
    const remote = makeRemote();
    const request = signedPost(remote, '/inbox', { type: 'Follow' });
    const result = verifySignature({
      signature: parseSignatureHeader(request.headers.signature),
      publicKey: remote.account.public_key,
      method: 'POST',
      path: '/inbox',
      headers: request.headers,
      body: request.body,
    });
    assert.equal(result.ok, true);
  });

  it('rejects a tampered body', () => {
    const remote = makeRemote();
    const request = signedPost(remote, '/inbox', { type: 'Follow' });
    const result = verifySignature({
      signature: parseSignatureHeader(request.headers.signature),
      publicKey: remote.account.public_key,
      method: 'POST',
      path: '/inbox',
      headers: request.headers,
      body: '{"type":"Delete"}',
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /digest/);
  });

  it('rejects a request signed with the wrong key', async () => {
    const remote = makeRemote();
    const impostor = generateKeyPair();
    const body = JSON.stringify({ type: 'Follow' });
    const headers = signRequest({
      keyId: `${remote.account.actor_url}#main-key`,
      privateKey: impostor.privateKey,
      method: 'POST',
      url: `${config.origin}/inbox`,
      body,
    });
    const auth = await authenticateRequest({ method: 'POST', path: '/inbox', headers, body }, async () => {
      throw new Error('should not fetch');
    });
    assert.equal(auth.ok, false);
  });

  it('refuses unsigned deliveries', async () => {
    const auth = await authenticateRequest({ method: 'POST', path: '/inbox', headers: {}, body: '{}' });
    assert.equal(auth.ok, false);
    assert.match(auth.reason, /signature/);
  });
});

describe('inbox handling', () => {
  it('accepts a Follow and records it', async () => {
    const local = makeAccount('host');
    const remote = makeRemote();
    const result = await handleActivity(
      { type: 'Follow', id: 'https://remote.example/follows/1', actor: remote.account.actor_url, object: `${config.origin}/@host` },
      remote.account,
    );
    assert.equal(result.status, 202);
    assert.equal(isFollowing(remote.account.id, local.id), true);
  });

  it('ignores a Follow addressed to a paused account', async () => {
    const local = makeAccount('resting');
    const remote = makeRemote();
    const { pauseAccount } = await import('../src/domain/accounts.js');
    pauseAccount(local.id);
    const result = await handleActivity(
      { type: 'Follow', id: 'x', actor: remote.account.actor_url, object: `${config.origin}/@resting` },
      remote.account,
    );
    assert.equal(result.note, 'account paused');
    assert.equal(isFollowing(remote.account.id, local.id), false);
  });

  it('ingests a remote Note and strips its HTML', async () => {
    const remote = makeRemote();
    await handleActivity(
      {
        type: 'Create',
        actor: remote.account.actor_url,
        object: {
          id: 'https://remote.example/notes/1',
          type: 'Note',
          content: '<p>Hello <b>from</b> abroad</p>',
          published: new Date().toISOString(),
        },
      },
      remote.account,
    );
    const post = findPostByUri('https://remote.example/notes/1');
    assert.equal(post.content, 'Hello from abroad');
  });

  it('drops remote attachments that have no description', async () => {
    const remote = makeRemote();
    await handleActivity(
      {
        type: 'Create',
        actor: remote.account.actor_url,
        object: {
          id: 'https://remote.example/notes/2',
          type: 'Note',
          content: 'picture',
          attachment: [{ type: 'Document', url: 'https://remote.example/x.png' }],
        },
      },
      remote.account,
    );
    assert.deepEqual(JSON.parse(findPostByUri('https://remote.example/notes/2').media), []);
  });

  it('enforces the author\'s reply policy against a remote reply', async () => {
    const local = makeAccount('careful');
    const remote = makeRemote();
    const post = createPost(local, { content: 'closed thread', replyPolicy: 'nobody' });

    const result = await handleActivity(
      {
        type: 'Create',
        actor: remote.account.actor_url,
        object: { id: 'https://remote.example/notes/3', type: 'Note', content: 'anyway', inReplyTo: post.uri },
      },
      remote.account,
    );
    assert.equal(result.status, 403);
    assert.equal(findPostByUri('https://remote.example/notes/3'), undefined);
  });

  it('lets a permitted remote reply through', async () => {
    const local = makeAccount('open');
    const remote = makeRemote('friend');
    const post = createPost(local, { content: 'open thread', replyPolicy: 'everyone' });

    const result = await handleActivity(
      {
        type: 'Create',
        actor: remote.account.actor_url,
        object: { id: 'https://remote.example/notes/4', type: 'Note', content: 'nice one', inReplyTo: post.uri },
      },
      remote.account,
    );
    assert.equal(result.status, 202);
    assert.ok(findPostByUri('https://remote.example/notes/4'));
  });

  it('ignores a Like from a blocked account', async () => {
    const local = makeAccount('blocker');
    const remote = makeRemote('pest');
    const post = createPost(local, { content: 'mine' });
    block(local.id, remote.account.id);

    const result = await handleActivity(
      { type: 'Like', actor: remote.account.actor_url, object: post.uri },
      remote.account,
    );
    assert.equal(result.note, 'blocked');
  });

  it('only lets an actor delete its own post', async () => {
    const local = makeAccount('owner');
    const remote = makeRemote('other');
    const post = createPost(local, { content: 'not yours to delete' });

    await handleActivity({ type: 'Delete', actor: remote.account.actor_url, object: post.uri }, remote.account);
    assert.ok(findPostByUri(post.uri), 'the post survives a delete from the wrong actor');
  });

  it('removes a Follow on Undo', async () => {
    const local = makeAccount('target');
    const remote = makeRemote();
    requestFollow(remote.account.id, local.id);
    assert.equal(isFollowing(remote.account.id, local.id), true);

    await handleActivity(
      {
        type: 'Undo',
        actor: remote.account.actor_url,
        object: { type: 'Follow', actor: remote.account.actor_url, object: `${config.origin}/@target` },
      },
      remote.account,
    );
    assert.equal(isFollowing(remote.account.id, local.id), false);
  });
});

describe('actor normalisation', () => {
  it('reads the fields we need from a Mastodon-shaped actor', () => {
    const actor = normaliseActor({
      id: 'https://mastodon.example/users/kim',
      preferredUsername: 'kim',
      name: 'Kim',
      summary: '<p>hi</p>',
      inbox: 'https://mastodon.example/users/kim/inbox',
      endpoints: { sharedInbox: 'https://mastodon.example/inbox' },
      publicKey: { publicKeyPem: 'PEM' },
    });
    assert.equal(actor.username, 'kim');
    assert.equal(actor.domain, 'mastodon.example');
    assert.equal(actor.sharedInboxUrl, 'https://mastodon.example/inbox');
  });
});

describe('html stripping', () => {
  it('keeps paragraph breaks and decodes entities', () => {
    assert.equal(stripHtml('<p>one</p><p>two &amp; three</p>'), 'one\n\ntwo & three');
  });
});
