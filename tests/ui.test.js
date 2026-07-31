/**
 * Oberfläche: Kreiszeichen, Kachelraster, Aktionsleiste.
 *
 * Was hier abgesichert wird, sind nicht Pixel, sondern die Regeln, nach denen
 * die Oberfläche Auskunft gibt: dass ein Zeichen etwas über seinen Kreis
 * aussagt, dass die große Kachel dorthin zeigt, wo etwas passiert, und dass die
 * Suche private Kreise nicht verrät.
 */

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { freshDatabase, makeAccount } from './helpers.js';
import { createApp } from '../src/server.js';
import { createSession } from '../src/domain/accounts.js';
import { createCircle, join, searchCircles } from '../src/domain/circles.js';
import { createPost } from '../src/domain/posts.js';
import { circleSigil } from '../src/web/sigil.js';
import { circleTile } from '../src/web/views.js';

describe('Kreiszeichen', () => {
  const circle = { slug: 'abi-2027', kind: 'topic', member_count: 12 };

  it('ist für denselben Kreis immer dasselbe', () => {
    assert.equal(
      circleSigil(circle, { id: 'a' }),
      circleSigil({ ...circle }, { id: 'a' }),
    );
  });

  it('unterscheidet sich zwischen Kreisen', () => {
    const other = circleSigil({ ...circle, slug: 'gaming-abends' }, { id: 'a' });
    assert.notEqual(circleSigil(circle, { id: 'a' }), other);
  });

  it('zeigt privaten Kreisen eine geschlossene zweite Schale', () => {
    const open = circleSigil({ ...circle, kind: 'topic' }, { id: 'a' });
    const closed = circleSigil({ ...circle, kind: 'private' }, { id: 'a' });
    assert.equal((open.match(/<circle/g) ?? []).length + 1, (closed.match(/<circle/g) ?? []).length);
  });

  it('wächst mit dem Kreis, aber gedeckelt', () => {
    const small = (circleSigil({ ...circle, member_count: 2 }, { id: 'a' }).match(/<circle/g) ?? []).length;
    const large = (circleSigil({ ...circle, member_count: 400 }, { id: 'a' }).match(/<circle/g) ?? []).length;
    const huge = (circleSigil({ ...circle, member_count: 40000 }, { id: 'a' }).match(/<circle/g) ?? []).length;
    assert.ok(large > small);
    assert.equal(large, huge, 'ab einer Grenze sagt mehr Größe nichts mehr aus');
  });

  it('benutzt nie Ember — die Farbe gehört dem Support', () => {
    for (const slug of ['a', 'bb', 'ccc', 'dddd', 'eeeee', 'ffffff', 'ggggggg']) {
      const svg = circleSigil({ slug, kind: 'topic', member_count: 5 }, { id: 'x' });
      assert.doesNotMatch(svg, /DC6B45|F08A5E/i);
    }
  });
});

describe('Kachel', () => {
  it('markiert Frisches, statt eine Dauerzahl zu tragen', () => {
    const withNew = circleTile({ slug: 'a', name: 'A', kind: 'topic', member_count: 3, fresh_count: 2 });
    assert.match(withNew, /2 neu/);

    const quiet = circleTile({ slug: 'b', name: 'B', kind: 'topic', member_count: 3, fresh_count: 0 });
    assert.match(quiet, /noch still/);
    assert.doesNotMatch(quiet, /0 neu/, 'eine Null wird nicht angezeigt');
  });

  it('zeigt die Vorschau nur in der großen Kachel', () => {
    const circle = { slug: 'c', name: 'C', kind: 'topic', member_count: 3, last_post_content: 'Hallo', last_post_author: 'Mira' };
    assert.match(circleTile(circle, { hero: true }), /Mira/);
    assert.doesNotMatch(circleTile(circle), /Mira/);
  });
});

describe('Suche', () => {
  before(freshDatabase);

  it('verrät private Kreise nicht', () => {
    const host = makeAccount('sucher');
    createCircle(host, { name: 'Geheimes Familientreffen', kind: 'private' });
    createCircle(host, { name: 'Offenes Familienthema', kind: 'topic' });

    const found = searchCircles('familie');
    assert.equal(found.length, 1);
    assert.equal(found[0].name, 'Offenes Familienthema');
  });
});

describe('Seiten', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('mira', { displayName: 'Mira' });
    const jonas = makeAccount('jonas', { displayName: 'Jonas' });
    cookie = `lamb_session=${createSession(mira.id).id}`;

    const quiet = createCircle(mira, { name: 'Stiller Kreis', kind: 'topic' });
    const busy = createCircle(mira, { name: 'Lebhafter Kreis', kind: 'topic' });
    join(busy, jonas);
    createPost(jonas, { content: 'Hier ist gerade etwas los.', circleId: busy.id });
    assert.ok(quiet);

    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  const load = async (path) => (await fetch(`${base}${path}`, { headers: { cookie }, redirect: 'manual' })).text();

  it('macht den Kreis zur großen Kachel, in dem etwas passiert — nicht den neuesten', async () => {
    const html = await load('/');
    const hero = html.match(/<a class="tile hero" href="([^"]+)"/);

    assert.ok(hero, 'es gibt genau eine große Kachel');
    assert.equal(hero[1], '/c/lebhafter-kreis', 'sie zeigt auf den Kreis, in dem etwas passiert');
    assert.ok(
      html.indexOf('Lebhafter Kreis') < html.indexOf('Stiller Kreis'),
      'und er steht vor dem stillen Kreis',
    );
  });

  it('stellt die Frage nach dem Kreis vor das Textfeld', async () => {
    const html = await load('/compose');
    assert.match(html, /Wo willst du das sagen\?/);
    assert.match(html, /Lebhafter Kreis/);
    assert.doesNotMatch(html, /<textarea/, 'auf dieser Seite wird noch nicht geschrieben');
  });

  it('hält die Aktionsleiste auf drei Ziele begrenzt', async () => {
    const html = await load('/');
    const dock = html.slice(html.indexOf('class="dock"'), html.indexOf('</nav>', html.indexOf('class="dock"')));
    assert.equal((dock.match(/<a /g) ?? []).length, 3);
  });

  it('klappt das Schreibfeld im Kreis ein, statt mit einem leeren Feld zu beginnen', async () => {
    const html = await load('/c/lebhafter-kreis');
    const composer = html.indexOf('compose-slot');
    const posts = html.indexOf('Hier ist gerade etwas los');
    assert.ok(composer !== -1 && composer < posts);
    assert.match(html, /<summary>Etwas in diesen Kreis schreiben<\/summary>/);
  });

  it('liefert weiterhin kein Client-JavaScript aus', async () => {
    for (const path of ['/', '/compose', '/discover', '/c/lebhafter-kreis']) {
      assert.doesNotMatch(await load(path), /<script/i, `${path} enthält ein Skript`);
    }
  });
});
