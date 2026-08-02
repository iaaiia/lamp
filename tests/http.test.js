/** End-to-end: the real HTTP app, exercised over a socket. */

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { freshDatabase, makeAccount } from './helpers.js';
import { createApp } from '../src/server.js';
import { createPost, react } from '../src/domain/posts.js';
import { createSession } from '../src/domain/accounts.js';

let server;
let base;
let cookie;
let postId;

before(async () => {
  freshDatabase();
  const account = makeAccount('kim', { displayName: 'Kim' });
  postId = createPost(account, { content: 'A first public post.', visibility: 'public' }).id;
  cookie = `lamb_session=${createSession(account.id).id}`;

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
    assert.match(html, /<html lang="de">/);
    assert.match(html, /Zum Inhalt springen/, 'a skip link is present for keyboard users');
  });

  it('ships no client-side JavaScript in the application', async () => {
    // Die Anwendung bleibt skriptfrei. Genau eine Seite darf ein Skript laden —
    // die abgemeldete Startseite, wo Kugeln geschoben werden. Dieser Test hält
    // die Grenze fest, damit die Ausnahme nicht leise wächst.
    for (const path of ['/', '/stream', '/compose', '/discover', '/settings']) {
      const response = await fetchPath(path, { headers: { cookie } });
      assert.doesNotMatch(await response.text(), /<script/i, `${path} enthält ein Skript`);
      assert.match(
        response.headers.get('content-security-policy'),
        /script-src 'none'/,
        `${path} erlaubt Skript`,
      );
    }
  });

  it('makes the signed-out landing the one named exception', async () => {
    const response = await fetchPath('/');
    assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
    assert.match(await response.text(), /<script src="\/orbs.js" defer><\/script>/);

    // Und auch abgemeldet gilt die Regel überall sonst weiter.
    const andere = await fetchPath('/login');
    assert.match(andere.headers.get('content-security-policy'), /script-src 'none'/);
    assert.doesNotMatch(await andere.text(), /<script/i);
  });

  it('keeps the sky a space you push around rather than a stream', async () => {
    // Der Himmel ist nicht mehr die Startseite — die gehört dem eigenen Weg —,
    // aber er ist unverändert eine Fläche und keine Liste.
    const html = await (await fetchPath('/kreise', { headers: { cookie } })).text();
    assert.match(html, /Dein Himmel/);
    assert.match(html, /Schieb ihn hin und her/);
  });

  it('tells the phone to fill the screen, so the safe areas are real', async () => {
    for (const path of ['/', '/stream']) {
      const html = await (await fetchPath(path, { headers: { cookie } })).text();
      assert.match(html, /viewport-fit=cover/, `${path} lacks viewport-fit`);
    }
  });

  it('renders the follow stream with a feed explanation and an explicit end marker', async () => {
    const html = await (await fetchPath('/stream', { headers: { cookie } })).text();
    assert.match(html, /Neueste zuerst/);
    assert.match(html, /Nichts wird gewichtet/);
    assert.match(html, /Es lädt nichts von allein nach/);
  });

  it('shows support as people, never as a bare number', async () => {
    const supporter = makeAccount('rae', { displayName: 'Rae' });
    react(supporter.id, postId);

    const mine = await (await fetchPath('/@kim', { headers: { cookie } })).text();
    assert.match(mine, /Rae steht dahinter/, 'the author sees who is backing them');
    assert.doesNotMatch(mine, /\b1 Support\b/, 'and never a bare count');
  });

  it('keeps support private from others until the author opts in', async () => {
    const theirs = await (await fetchPath('/@kim')).text();
    assert.match(theirs, /Rückhalt bleibt im Kreis/);
    assert.doesNotMatch(theirs, /steht dahinter/);
  });

  it('keeps the settings page reachable and explains the pause option', async () => {
    const html = await (await fetchPath('/settings', { headers: { cookie } })).text();
    assert.match(html, /Kreis ruhen lassen/);
    assert.match(html, /Nichts wird gelöscht/);
  });

  it('exports the account as a downloadable file', async () => {
    const response = await fetchPath('/settings/export', { headers: { cookie } });
    assert.match(response.headers.get('content-disposition'), /attachment; filename="lamb-export-kim.json"/);
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
