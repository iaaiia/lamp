/** End-to-end: the real HTTP app, exercised over a socket. */

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { freshDatabase, makeAccount } from './helpers.js';
import { createApp } from '../src/server.js';
import { createPost } from '../src/domain/posts.js';
import { createSession } from '../src/domain/accounts.js';

let server;
let base;
let cookie;

before(async () => {
  freshDatabase();
  const account = makeAccount('kim', { displayName: 'Kim' });
  createPost(account, { content: 'A first public post.', visibility: 'public' });
  cookie = `lamp_session=${createSession(account.id).id}`;

  server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const fetchPath = (path, options = {}) => fetch(`${base}${path}`, { redirect: 'manual', ...options });

describe('web surface', () => {
  it('serves a signed-out landing page', async () => {
    const response = await fetchPath('/');
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /Skip to content/, 'a skip link is present for keyboard users');
  });

  it('ships no client-side JavaScript at all', async () => {
    const html = await (await fetchPath('/', { headers: { cookie } })).text();
    assert.doesNotMatch(html, /<script/i);
    assert.match(
      (await fetchPath('/')).headers.get('content-security-policy'),
      /script-src 'none'/,
      'and the CSP forbids it',
    );
  });

  it('renders the timeline with a feed explanation and an explicit end marker', async () => {
    const html = await (await fetchPath('/', { headers: { cookie } })).text();
    assert.match(html, /Newest first/);
    assert.match(html, /Nothing is ranked, hidden or boosted/);
    assert.match(html, /Nothing more will load on its own/);
  });

  it('hides like counts from everyone but the author', async () => {
    const mine = await (await fetchPath('/@kim', { headers: { cookie } })).text();
    assert.match(mine, /0 likes/, 'the author sees their own count');

    const theirs = await (await fetchPath('/@kim')).text();
    assert.match(theirs, /Counts are private/);
    assert.doesNotMatch(theirs, /0 likes/);
  });

  it('keeps the settings page reachable and explains the pause option', async () => {
    const html = await (await fetchPath('/settings', { headers: { cookie } })).text();
    assert.match(html, /Pause my account/);
    assert.match(html, /Nothing is deleted/);
  });

  it('exports the account as a downloadable file', async () => {
    const response = await fetchPath('/settings/export', { headers: { cookie } });
    assert.match(response.headers.get('content-disposition'), /attachment; filename="lamp-export-kim.json"/);
    const dump = await response.json();
    assert.equal(dump.profile.username, 'kim');
    assert.equal(dump.posts.length, 1);
  });

  it('sends anonymous users to sign-in instead of leaking authenticated pages', async () => {
    const response = await fetchPath('/settings');
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), '/login');
  });

  it('escapes user content', async () => {
    const account = makeAccount('xss');
    createPost(account, { content: '<img src=x onerror=alert(1)>', visibility: 'public' });
    const html = await (await fetchPath('/@xss')).text();
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img src=x/);
  });
});

describe('federation endpoints', () => {
  it('answers webfinger', async () => {
    const response = await fetchPath('/.well-known/webfinger?resource=acct:kim@localhost');
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.match(body.subject, /^acct:kim@/);
  });

  it('serves the actor as activity+json on content negotiation', async () => {
    const response = await fetchPath('/@kim', { headers: { accept: 'application/activity+json' } });
    assert.match(response.headers.get('content-type'), /application\/activity\+json/);
    const actor = await response.json();
    assert.equal(actor.preferredUsername, 'kim');
    assert.ok(actor.publicKey.publicKeyPem);
  });

  it('serves the same URL as HTML to a browser', async () => {
    const response = await fetchPath('/@kim', { headers: { accept: 'text/html' } });
    assert.match(response.headers.get('content-type'), /text\/html/);
  });

  it('publishes its well-being posture in nodeinfo', async () => {
    const info = await (await fetchPath('/nodeinfo/2.1')).json();
    assert.equal(info.metadata.wellbeingDefaults.infiniteScroll, false);
    assert.equal(info.protocols[0], 'activitypub');
  });

  it('rejects an unsigned inbox delivery', async () => {
    const response = await fetchPath('/inbox', {
      method: 'POST',
      headers: { 'content-type': 'application/activity+json' },
      body: JSON.stringify({ type: 'Create' }),
    });
    assert.equal(response.status, 401);
  });

  it('hides follower collections when the account keeps counts private', async () => {
    const collection = await (await fetchPath('/@kim/followers')).json();
    assert.equal(collection.totalItems, 0);
  });
});
