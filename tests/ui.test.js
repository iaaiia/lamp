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
import { createPost, react } from '../src/domain/posts.js';
import { circleSigil } from '../src/web/sigil.js';
import { layoutSky } from '../src/web/sky.js';
import { circleTile } from '../src/web/views.js';
import { STYLESHEET } from '../src/web/style.js';
import { personOrbCss } from '../src/web/orb.js';

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

describe('Menschenkugel', () => {
  const farbe = (regel) => regel.match(/--c1:(#[0-9A-F]{6})/i)[1];
  const groesse = (regel) => regel.match(/--od:(\d+)px/)[1];

  it('gibt einem Menschen seine Farbe, dem Beitrag seine Form', () => {
    // Wiedererkennbar und trotzdem verspielt: die Farbe bleibt über alle
    // Nachrichten hinweg dieselbe, Größe und Versatz wechseln.
    const a = personOrbCss('mira', '1', 'x');
    const b = personOrbCss('mira', '77', 'y');
    assert.equal(farbe(a), farbe(b), 'dieselbe Person, dieselbe Farbe');
    assert.notEqual(groesse(a), groesse(b), 'anderer Beitrag, andere Größe');
  });

  it('liegt bei gleicher Eingabe immer gleich', () => {
    assert.equal(personOrbCss('mira', '1', 'x'), personOrbCss('mira', '1', 'x'));
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

  it('führt die ganze Navigation in der Kopfleiste — und sonst nirgends', async () => {
    // Die Skizze kennt oben das Zeichen und zwei Knöpfe, unten das Schreibfeld.
    // Zwei Navigationen für eine App mit einem Ort waren eine zu viel.
    const html = await load('/');
    assert.doesNotMatch(html, /class="dock"/, 'die Tab-Leiste ist weg');
    assert.match(html, /class="brandmark" href="\/"/, 'das Zeichen führt nach Hause');
    assert.match(html, /aria-label="Nachrichten"/);
    assert.match(html, /aria-label="Einstellungen"/);
  });

  it('stellt überall dieselbe Schreibleiste unten hin', async () => {
    const html = await load('/');
    assert.match(html, /class="writebar"/);
    assert.match(html, /class="write-field" href="\/compose">Etwas sagen …<\/a>/);
  });

  it('setzt das Schreibfeld unten wie in einem Messenger — eingeklappt', async () => {
    const html = await load('/c/lebhafter-kreis');
    const nachricht = html.indexOf('Hier ist gerade etwas los');
    const schreibfeld = html.indexOf('class="writebar"');

    assert.ok(schreibfeld !== -1, 'es gibt eine Schreibleiste');
    assert.ok(nachricht < schreibfeld, 'sie steht unter dem Gespräch, nicht darüber');
    assert.match(html, /<summary>Etwas sagen …<\/summary>/, 'und ist eingeklappt');
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

describe('Oberfläche im neuen Zuschnitt', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('mira2', { displayName: 'Mira' });
    cookie = `lamb_session=${createSession(mira.id).id}`;
    const kreis = createCircle(mira, { name: 'Ein Kreis', kind: 'topic' });
    for (let i = 0; i < 3; i += 1) createPost(mira, { content: `Beitrag ${i}`, visibility: 'public' });
    createPost(mira, { content: 'Im Kreis', circleId: kreis.id });

    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  const load = async (path) => (await fetch(`${base}${path}`, { headers: { cookie }, redirect: 'manual' })).text();

  it('sagt in der Kopfleiste, wo man ist', async () => {
    assert.match(await load('/'), /<h1 class="appbar-title">Dein Himmel<\/h1>/);
    assert.match(await load('/settings'), /<h1 class="appbar-title">Einstellungen<\/h1>/);
  });

  it('führt von überall mit einem Griff nach Hause', async () => {
    // Statt eines Zurück-Pfeils, der je nach Seite woanders hinführte: das
    // Zeichen links, immer derselbe Weg.
    assert.match(await load('/settings'), /class="brandmark" href="\/" aria-label="Zum Himmel"/);
    assert.match(await load('/c/kultur-leipzig'), /class="brandmark" href="\/"/);
  });

  it('zählt Beiträge des Kontos, nicht die der angezeigten Seite', async () => {
    const html = await load('/@mira2');
    // Drei unter eigenem Namen; der Kreisbeitrag gehört seinem Kreis.
    assert.match(html, /<span class="num">3<\/span><span class="lbl">Beiträge<\/span>/);
  });

  it('behauptet keine Zahlen, wo nichts freigegeben ist', async () => {
    const fremde = makeAccount('fremde2', { displayName: 'Fremde' });
    createPost(fremde, { content: 'hallo', visibility: 'public' });
    const html = await load('/@fremde2');
    assert.match(html, /hält seinen Kreis privat/);
    assert.doesNotMatch(html, /class="stats"/);
  });
});

describe('Überschriften', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('mira3', { displayName: 'Mira' });
    cookie = `lamb_session=${createSession(mira.id).id}`;
    createCircle(mira, { name: 'Ein Kreis', kind: 'topic' });
    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  it('gibt jeder Seite genau eine Überschrift erster Ordnung', async () => {
    const seiten = ['/', '/stream', '/discover', '/compose', '/settings', '/moderation', '/@mira3', '/c/ein-kreis', '/circles/new'];
    for (const pfad of seiten) {
      const html = await (await fetch(`${base}${pfad}`, { headers: { cookie } })).text();
      const anzahl = (html.match(/<h1/g) ?? []).length;
      assert.equal(anzahl, 1, `${pfad} hat ${anzahl} h1`);
    }
  });

  it('gibt auch abgemeldeten Seiten genau eine', async () => {
    for (const pfad of ['/', '/login', '/register']) {
      const html = await (await fetch(`${base}${pfad}`)).text();
      assert.equal((html.match(/<h1/g) ?? []).length, 1, `${pfad}`);
    }
  });
});

describe('Grundlayout', () => {
  it('gibt dem Inhalt Innenabstand und eine Lesebreite', () => {
    // Beim Umbau auf die App-Leiste war diese Regel einmal verlorengegangen und
    // der Text klebte am Bildschirmrand. Ein Stylesheet ohne sie ist kaputt.
    assert.match(STYLESHEET, /main,\s*\n?footer\.site \.inner \{[^}]*max-width: 48rem/);
    assert.match(STYLESHEET, /main,\s*\n?footer\.site \.inner \{[^}]*padding: [^;]+;/);
  });

  it('gestaltet die Schreibleiste, die das Layout ausliefert', () => {
    // Die Leiste wurde gerendert, aber nie gestaltet — fünf nackte Links
    // untereinander. Wer die Markup-Klasse ausliefert, muss sie auch kleiden.
    assert.match(STYLESHEET, /\.writebar \{[^}]*position: fixed/s);
    assert.match(STYLESHEET, /\.write-field \{/);
    // …und Platz darunter lassen, sonst endet der Inhalt hinter ihr.
    assert.match(STYLESHEET, /body\.has-writebar main \{[^}]*padding-bottom/s);
  });

  it('hält das Schreibfeld über der letzten Blase, nicht darauf', () => {
    // Sticky mit Abstand zum unteren Rand zog das Feld mitten in die letzte
    // Nachricht, sobald die Seite kürzer war als der Bildschirm.
    assert.match(STYLESHEET, /\.writebar \{[^}]*position: fixed/s);
    assert.match(STYLESHEET, /\.chat-window\.is-chat \{[^}]*padding-bottom/s);
  });
});

describe('Startseite', () => {
  let server;
  let base;

  before(async () => {
    freshDatabase();
    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  const load = async (pfad = '/') => (await fetch(`${base}${pfad}`)).text();

  it('sagt in einem Satz, worum es geht, und bietet genau eine Handlung', async () => {
    const html = await load();
    assert.match(html, /<h1 class="stage-title">lamb<br>ist hier<\/h1>/);
    assert.match(html, /<form class="stage-search" method="get" action="\/discover"/);
    assert.equal((html.match(/<button/g) ?? []).length, 1, 'genau eine Schaltfläche');
  });

  it('funktioniert ohne Skript vollständig', async () => {
    const html = await load();
    // Die Kugeln sind schon im ausgelieferten HTML — ohne Skript liegen sie
    // still da, und die Seite bleibt bedienbar.
    assert.equal((html.match(/class="f-orb"/g) ?? []).length, 5);
    assert.match(html, /<input type="text" id="q" name="q"/);
    assert.match(html, /href="\/register"/);
    assert.match(html, /href="\/login"/);
  });

  it('lässt das Suchfeld auch abgemeldet etwas finden', async () => {
    const mira = makeAccount('wirt');
    createCircle(mira, { name: 'Offener Kreis', kind: 'topic' });
    createCircle(mira, { name: 'Privater Kreis', kind: 'private' });

    const treffer = await (await fetch(`${base}/discover?q=kreis`)).text();
    assert.match(treffer, /Offener Kreis/);
    assert.doesNotMatch(treffer, /Privater Kreis/, 'private Kreise nie');
  });

  it('deckelt die Zahl der Kugeln, statt endlos nachzulegen', async () => {
    const skript = await (await fetch(`${base}/orbs.js`)).text();
    assert.match(skript, /const MAX = \d+/);
    assert.match(skript, /if \(orbs\(\)\.length >= MAX\) return null/);
  });

  it('lädt und misst nichts im Browser', async () => {
    const skript = await (await fetch(`${base}/orbs.js`)).text();
    for (const verboten of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie', 'navigator.send']) {
      assert.ok(!skript.includes(verboten), `Skript enthält ${verboten}`);
    }
  });
});

describe('Körnung', () => {
  it('benutzt dieselbe Körnung für alle Kugeln — und lädt sie nicht nach', () => {
    // Ein Daten-URI: keine Anfrage, kein Bild vom Server, kein Zählpixel.
    assert.match(STYLESHEET, /--grain: url\("data:image\/svg\+xml/);
    assert.match(STYLESHEET, /feTurbulence/);

    const stellen = (STYLESHEET.match(/var\(--grain\)/g) ?? []).length;
    assert.equal(stellen, 3, 'Plakat, Kacheln und Wolken tragen dieselbe Körnung');
  });

  it('zeichnet die Kugeln zum Rand hin verblassend', () => {
    // Ohne Maske hätte die Kugel eine harte Kante und läge auf dem Himmel,
    // statt in ihm zu liegen.
    assert.match(STYLESHEET, /\.f-body \{[^}]*mask-image: radial-gradient/s);
    assert.match(STYLESHEET, /\.orb-body \{[^}]*mask-image: radial-gradient/s);
  });
});

describe('Der gesuchte Kreis', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('gast', { displayName: 'Mira' });
    const jonas = makeAccount('jonas9', { displayName: 'Jonas' });
    cookie = `lamb_session=${createSession(mira.id).id}`;

    const kreis = createCircle(mira, { name: 'Kultur Leipzig', kind: 'local', purpose: 'Was hier läuft.' });
    join(kreis, jonas);
    const beitrag = createPost(mira, { content: 'Samstag jemand Zeit?', circleId: kreis.id, replyPolicy: 'everyone' });
    createPost(jonas, { content: 'Ich bin dabei.', inReplyTo: beitrag.id });

    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  const load = async (pfad, mit = true) =>
    (await fetch(`${base}${pfad}`, mit ? { headers: { cookie } } : {})).text();

  it('führt die Welt der Startseite fort — aber ohne Deko-Kugeln', async () => {
    // Derselbe Grund wie auf der Startseite, dieselbe Bildsprache. Was weg ist:
    // die Kugeln, die nur im Hintergrund lagen und nichts trugen. Eine Kugel
    // steht hier für einen Menschen, ein Thema, eine Nachricht — oder gar nicht.
    for (const pfad of ['/discover', '/c/kultur-leipzig']) {
      const html = await load(pfad);
      assert.match(html, /class="[^"]*on-stage/, `${pfad} steht nicht auf der Bühne`);
      assert.doesNotMatch(html, /class="orbfield stage-orbs"/, `${pfad} hat noch Deko-Kugeln`);
    }
  });

  it('nennt den Kreis einmal — in der Kopfleiste, nicht zweimal', async () => {
    const html = await load('/c/kultur-leipzig');
    assert.match(html, /<h1 class="appbar-title">Kultur Leipzig<\/h1>/);
    assert.doesNotMatch(html, /class="space-name"/, 'kein zweiter Name als Plakat');
    assert.match(html, /2 Mitglieder/);
  });

  it('zeigt Nachricht und Antwort zusammen, das Handeln in der Kugel', async () => {
    const html = await load('/c/kultur-leipzig');
    const nachricht = html.slice(html.indexOf('<div class="msg"'));
    const eine = nachricht.slice(0, nachricht.indexOf('<div class="msg"', 10) + 1 || undefined);

    assert.match(eine, /Samstag jemand Zeit\?/, 'die Nachricht');
    assert.match(eine, /Ich bin dabei\./, 'und die Antwort daneben');

    // Support, Person und Antworten hängen an der Kugel, nicht am Text.
    const kugel = eine.slice(eine.indexOf('class="orb-pop"'), eine.indexOf('class="bubble"'));
    assert.match(kugel, /class="msg-orb"/);
    assert.match(kugel, /class="support tiny"/, 'der Support-Knopf');
    assert.match(kugel, /class="orb-person"/, 'wer da spricht');
  });

  it('lässt Gäste mitlesen und sagt, wofür sie ein Konto brauchen', async () => {
    const html = await load('/c/kultur-leipzig', false);
    assert.match(html, /Samstag jemand Zeit\?/, 'mitlesen geht ohne Konto');
    assert.match(html, /Ich bin dabei\./);
    assert.doesNotMatch(html, /class="support"/, 'aber kein Support-Button');
    assert.match(html, /Zum Mitreden und Support geben brauchst du eins/);
  });

  it('bleibt auch auf der Bühne ohne Skript', async () => {
    for (const pfad of ['/discover', '/c/kultur-leipzig']) {
      assert.doesNotMatch(await load(pfad), /<script/i, `${pfad} enthält ein Skript`);
    }
  });
});

describe('Farbwelt', () => {
  it('hält Ember aus den Kugeln heraus — auch in der erweiterten Palette', async () => {
    const { readFile } = await import('node:fs/promises');
    // Warme Kugeln gibt es jetzt (Gold, Türkis), aber Ember bleibt der Farbton
    // des Supports und darf nirgends als Dekoration auftauchen.
    for (const datei of ['src/web/landing.js', 'src/web/stage.js', 'src/web/orb.js', 'src/web/sky.js']) {
      const quelle = await readFile(datei, 'utf8');
      assert.doesNotMatch(quelle, /DC6B45|F08A5E/i, `${datei} benutzt Ember`);
    }
  });
});

describe('Chatfenster', () => {
  let server;
  let base;
  let cookie;

  before(async () => {
    freshDatabase();
    const mira = makeAccount('wirtin', { displayName: 'Mira' });
    const jonas = makeAccount('gast7', { displayName: 'Jonas' });
    cookie = `lamb_session=${createSession(mira.id).id}`;

    const kreis = createCircle(mira, { name: 'Kultur', kind: 'topic', purpose: 'Was läuft.' });
    join(kreis, jonas);

    const erste = createPost(mira, { content: 'Erste Nachricht', circleId: kreis.id, replyPolicy: 'everyone' });
    createPost(jonas, { content: 'Antwort darauf', inReplyTo: erste.id });
    react(jonas.id, erste.id);
    await new Promise((r) => setTimeout(r, 1100));
    createPost(jonas, { content: 'Zweite Nachricht', circleId: kreis.id, replyPolicy: 'everyone' });

    server = createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  const load = async (pfad) => (await fetch(`${base}${pfad}`, { headers: { cookie } })).text();

  it('lässt die Nachrichten von alt nach neu laufen, wie in einem Chat', async () => {
    const html = await load('/c/kultur');
    assert.ok(
      html.indexOf('Erste Nachricht') < html.indexOf('Zweite Nachricht'),
      'die ältere steht oben',
    );
  });

  it('gibt jeder Nachricht die Kugel ihrer Sprecherin', async () => {
    // Eine Spalte aus Kugeln mit Text daneben — und die Kugeln sind nicht
    // gleich groß, sonst wären es Punkte. Größe und Farbe kommen aus dem Namen.
    const html = await load('/c/kultur');
    assert.match(html, /class="msg-orb"/);
    assert.match(html, /class="orb-mark" id="msgorb-0"/);
    assert.match(html, /#msgorb-0\{--c1:#[0-9A-F]{6};--c2:#[0-9A-F]{6};--od:\d+px/i);
    assert.doesNotMatch(html, /class="msg is-me"/, 'keine Seitenwahl mehr');
  });

  it('legt die Kugeln versetzt und verschieden groß — aber immer gleich', async () => {
    // Verspielt heißt nicht beliebig: der Versatz kommt aus dem Beitrag, sieht
    // zufällig aus und ist beim nächsten Aufruf derselbe.
    const html = await load('/c/kultur');
    const regeln = [...html.matchAll(/#msgorb-\d+\{([^}]*)\}/g)].map((m) => m[1]);
    assert.ok(regeln.length >= 2, 'mindestens zwei Kugeln');
    assert.notEqual(regeln[0], regeln[1], 'zwei Kugeln liegen nicht gleich');
    for (const regel of regeln) {
      assert.match(regel, /--od:\d+px/, 'eine eigene Größe');
      assert.match(regel, /--mx:[\d.]+rem/, 'ein seitlicher Versatz');
      assert.match(regel, /--my:-?[\d.]+rem/, 'und einer in der Höhe');
    }
    assert.equal((await load('/c/kultur')).match(/#msgorb-0\{[^}]*\}/)[0], `#msgorb-0{${regeln[0]}}`);
  });

  it('stellt die vier Ansichten als Weg auf: Leute, Gespräch, Themen, Rückhalt', async () => {
    // Kein Menü, sondern eine Reihenfolge: man verbindet sich mit Menschen,
    // fängt Gespräche an, daraus werden Themen, daraus wird Rückhalt.
    const html = await load('/c/kultur');
    const zeile = html.slice(html.indexOf('class="views"'), html.indexOf('</nav>'));
    const worte = [...zeile.matchAll(/>(Leute|Gespräch|Themen|Rückhalt)</g)].map((m) => m[1]);
    assert.deepEqual(worte, ['Leute', 'Gespräch', 'Themen', 'Rückhalt']);
  });

  it('wird nach rechts tiefer — und sagt in jeder Stufe, wofür sie da ist', async () => {
    const stufen = { leute: 1, chat: 2, themen: 3, support: 4 };
    for (const [ansicht, stufe] of Object.entries(stufen)) {
      const html = await load(`/c/kultur${ansicht === 'chat' ? '' : `?ansicht=${ansicht}`}`);
      assert.match(html, new RegExp(`class="chat-window[^"]*tiefe-${stufe}"`), `${ansicht} liegt falsch`);
      assert.match(html, /class="tiefe-satz"/, `${ansicht} sagt nicht, wofür es da ist`);
    }
  });

  it('trägt in jeder Ansicht Kugeln, die etwas bedeuten', async () => {
    for (const [ansicht, praefix] of [['leute', 'leuteorb'], ['themen', 'themaorb'], ['support', 'stuetzorb']]) {
      const html = await load(`/c/kultur?ansicht=${ansicht}`);
      assert.match(html, new RegExp(`class="orb-mark" id="${praefix}-0"`), `${ansicht} ohne Kugeln`);
      assert.match(html, new RegExp(`#${praefix}-0\\{[^}]*--od:`), `${ansicht} ohne eigene Größe`);
    }
  });

  it('gibt jedem Wort in der Ansichtszeile eine eigene Ansicht', async () => {
    const html = await load('/c/kultur');
    for (const ziel of ['?ansicht=themen', '?ansicht=leute', '?ansicht=support']) {
      assert.ok(html.includes(ziel), `${ziel} fehlt in der Zeile`);
    }
    assert.match(html, /class="view is-active"[^>]*href="\/c\/kultur"/, 'das Gespräch ist aktiv');
  });

  it('zeigt unter Themen nur, woraus etwas geworden ist', async () => {
    // Ein Thema entsteht durch Zuwendung: eine Antwort oder Rückhalt. Ohne das
    // wäre „Themen“ nur das Gespräch ein zweites Mal.
    const html = await load('/c/kultur?ansicht=themen');
    assert.match(html, /Erste Nachricht/, 'hat Antwort und Rückhalt');
    assert.match(html, /1 Antwort/);
    assert.doesNotMatch(html, /Zweite Nachricht/, 'unbeantwortet, also noch kein Thema');
    assert.doesNotMatch(html, /<summary>Etwas sagen …<\/summary>/, 'hier wird nicht geschrieben');
  });

  it('zeigt unter Leute, wer hier ist — mit Moderation', async () => {
    const html = await load('/c/kultur?ansicht=leute');
    assert.match(html, /Mira/);
    assert.match(html, /Moderation/);
    assert.match(html, /href="\/@gast7"/, 'und führt zu den Profilen');
  });

  it('zeigt unter Rückhalt, wo Support gegeben wurde — als Menschen', async () => {
    const html = await load('/c/kultur?ansicht=support');
    assert.match(html, /Erste Nachricht/);
    assert.match(html, /Jonas steht dahinter/);
  });

  it('bleibt eine Ansicht, wenn jemand etwas Unbekanntes anfragt', async () => {
    const html = await load('/c/kultur?ansicht=quatsch');
    assert.match(html, /<summary>Etwas sagen …<\/summary>/, 'zurück ins Gespräch');
  });

  it('braucht für all das kein Skript', async () => {
    for (const p of ['', '?ansicht=themen', '?ansicht=leute', '?ansicht=support']) {
      assert.doesNotMatch(await load(`/c/kultur${p}`), /<script/i, p);
    }
  });
});
