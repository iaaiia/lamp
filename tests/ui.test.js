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
import { layoutSky } from '../src/web/sky.js';
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

  it('legt eigene Kreise nach innen und unbekannte nach außen', async () => {
    const html = await load('/');
    assert.match(html, /class="cloud"/, 'eigene Kreise liegen nah');
    assert.match(html, /Lebhafter Kreis/);
    assert.match(html, /Stiller Kreis/);
  });

  it('zeigt Vorschau und zweiten Weg ohne Klick', async () => {
    const html = await load('/');
    assert.match(html, /Hier ist gerade etwas los/, 'der letzte Beitrag steht in der Wolke');
    assert.match(html, /\?write=1/, 'und ein Weg direkt ins Schreibfeld');
  });

  it('bietet denselben Bestand als Liste an', async () => {
    const html = await load('/');
    const list = html.slice(html.indexOf('sky-list'));
    assert.match(list, /Lebhafter Kreis/);
    assert.match(list, /Stiller Kreis/);
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

describe('Himmel', () => {
  it('legt jeden Kreis immer an dieselbe Stelle', () => {
    const near = [{ slug: 'abi-2027', kind: 'topic', member_count: 4 }];
    const far = [{ slug: 'skaten', kind: 'local', member_count: 9 }];
    assert.deepEqual(layoutSky(near, far).clouds, layoutSky(near, far).clouds);
  });

  it('legt Eigenes nach links und Unbekanntes nach rechts', () => {
    const near = [{ slug: 'meins', kind: 'topic', member_count: 3 }];
    const far = [{ slug: 'fremdes', kind: 'topic', member_count: 3 }];
    const [mine, theirs] = layoutSky(near, far).clouds;

    assert.ok(mine.x < 50, 'eigene Kreise liegen dort, wo die Fläche beginnt');
    assert.ok(theirs.x > 50, 'unbekannte liegen jenseits des Randes');
    assert.equal(mine.near, true);
    assert.equal(theirs.near, false);
  });

  it('deckelt die Größe, damit ein großer Kreis nicht alles verdeckt', () => {
    const huge = layoutSky([{ slug: 'gross', kind: 'topic', member_count: 90000 }], []).clouds[0];
    const big = layoutSky([{ slug: 'gross', kind: 'topic', member_count: 900 }], []).clouds[0];
    assert.equal(huge.size, big.size);
  });

  it('hält jede Wolke innerhalb der Fläche', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ slug: `kreis-${i}`, kind: 'topic', member_count: i + 1 }));
    for (const cloud of layoutSky(many, many).clouds) {
      assert.ok(cloud.x >= 5 && cloud.x <= 95, `x außerhalb: ${cloud.x}`);
      assert.ok(cloud.y >= 5 && cloud.y <= 93, `y außerhalb: ${cloud.y}`);
    }
  });
});

describe('Himmel im Browser', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('flieger', { displayName: 'Mira' });
    cookie = `lamb_session=${createSession(mira.id).id}`;
    createCircle(mira, { name: 'Mein Kreis', kind: 'topic' });
    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  it('erlaubt genau einen erzeugten Style-Block und sonst keine Inline-Styles', async () => {
    const response = await fetch(`${base}/`, { headers: { cookie } });
    const html = await response.text();
    const nonce = html.match(/<style nonce="([a-f0-9]+)">/);

    assert.ok(nonce, 'die Positionen kommen als signierter Style-Block');
    assert.match(response.headers.get('content-security-policy'), new RegExp(`style-src 'self' 'nonce-${nonce[1]}'`));
    assert.doesNotMatch(html, /style="/, 'Inline-Styles wären still wirkungslos und bleiben verboten');
  });

  it('verschachtelt keine Links — sonst hebt der Browser sie aus der Wolke', async () => {
    const html = await (await fetch(`${base}/`, { headers: { cookie } })).text();
    const clouds = html.match(/<div class="cloud[^"]*"[^>]*>[\s\S]*?<\/div>/g) ?? [];
    assert.ok(clouds.length > 0);
    for (const cloud of clouds) {
      assert.doesNotMatch(cloud, /<a[^>]*>(?:(?!<\/a>)[\s\S])*<a /, 'ein Link im Link');
    }
  });
});
