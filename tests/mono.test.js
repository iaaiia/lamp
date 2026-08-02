/**
 * Tests für mono. Die eine Regel muss geprüft sein, sonst ist sie nur ein Text
 * im README: Ein Konto hat höchstens einen Beitrag, und Schreiben löscht.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';

import { closeDatabase, get, openDatabase } from '../mono/db.js';
import * as accounts from '../mono/domain/accounts.js';
import * as mono from '../mono/domain/mono.js';
import { boundaryOf, parseMultipart } from '../mono/lib/multipart.js';
import { createApp } from '../mono/server.js';
import { seit } from '../mono/web/views.js';

process.env.NODE_ENV = 'test';

function fresh() {
  closeDatabase();
  openDatabase(':memory:');
}

const makeAccount = (handle) =>
  accounts.createAccount({ handle, password: 'a-long-enough-password', displayName: handle });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// — Die eine Regel ————————————————————————————————————————————

test('ein Konto hat höchstens einen Beitrag, und der neue ersetzt den alten', () => {
  fresh();
  const mira = makeAccount('mira');

  mono.replace(mira.id, { text: 'erstes' });
  assert.equal(mono.read(mira.id).text, 'erstes');

  mono.replace(mira.id, { text: 'zweites' });
  const jetzt = mono.read(mira.id);
  assert.equal(jetzt.text, 'zweites');
  assert.equal(mono.wall().filter((m) => m.account.handle === 'mira').length, 1);
});

test('ein ersetztes Medium ist danach nicht mehr abrufbar', () => {
  fresh();
  const mira = makeAccount('mira');
  const first = mono.replace(mira.id, { text: '', media: alt('ein Punkt') });
  assert.ok(mono.mediaBytes(first.media.id));

  mono.replace(mira.id, { text: 'jetzt nur Text' });
  assert.equal(mono.mediaBytes(first.media.id), undefined);
  assert.equal(mono.read(mira.id).media, null);
});

test('löschen lässt nichts stehen — und das ist ein gültiger Zustand', () => {
  fresh();
  const mira = makeAccount('mira');
  mono.replace(mira.id, { text: 'etwas' });
  mono.clear(mira.id);
  assert.equal(mono.read(mira.id), null);
  assert.equal(mono.wall().length, 0);
});

test('ein leerer Beitrag wird abgelehnt, und der alte bleibt stehen', () => {
  fresh();
  const mira = makeAccount('mira');
  mono.replace(mira.id, { text: 'bleibt' });
  assert.throws(() => mono.replace(mira.id, { text: '   ' }), mono.MonoError);
  assert.equal(mono.read(mira.id).text, 'bleibt');
});

test('ein abgelehntes Medium kostet nicht den bestehenden Beitrag', () => {
  fresh();
  const mira = makeAccount('mira');
  mono.replace(mira.id, { text: 'bleibt' });
  assert.throws(
    () => mono.replace(mira.id, { media: { contentType: 'application/zip', alt: 'x', data: PNG } }),
    mono.MonoError,
  );
  assert.throws(
    () => mono.replace(mira.id, { media: { contentType: 'image/png', alt: '', data: PNG } }),
    /was zu sehen ist/,
  );
  assert.equal(mono.read(mira.id).text, 'bleibt');
});

test('zu langer Text wird abgelehnt', () => {
  fresh();
  const mira = makeAccount('mira');
  assert.throws(() => mono.replace(mira.id, { text: 'x'.repeat(701) }), mono.MonoError);
});

test('es gibt keine Beitragstabelle — nur eine Zeile je Mensch', () => {
  fresh();
  const tables = get(
    "SELECT group_concat(name) AS names FROM sqlite_master WHERE type = 'table'",
  ).names.split(',');
  assert.ok(!tables.includes('posts'));
  assert.ok(!tables.includes('reactions'));
  assert.deepEqual(
    tables.filter((t) => !t.startsWith('sqlite_')).sort(),
    ['accounts', 'follows', 'media', 'sessions'],
  );
});

// — Leute ——————————————————————————————————————————————————————

test('deine Leute zeigen genau ihren jeweils aktuellen Beitrag', () => {
  fresh();
  const mira = makeAccount('mira');
  const jonas = makeAccount('jonas');
  const lea = makeAccount('lea');

  accounts.follow(mira.id, jonas.id);
  accounts.follow(mira.id, lea.id);
  mono.replace(jonas.id, { text: 'alt' });
  mono.replace(lea.id, { text: 'lea sagt was' });
  mono.replace(jonas.id, { text: 'neu' });

  const liste = mono.circle(mira.id);
  assert.equal(liste.length, 2);
  assert.equal(liste[0].account.handle, 'jonas'); // zuletzt geschrieben, zuerst
  assert.equal(liste[0].text, 'neu');
  assert.ok(!liste.some((m) => m.text === 'alt'));
});

test('wer nichts stehen hat, taucht nicht auf', () => {
  fresh();
  const mira = makeAccount('mira');
  const jonas = makeAccount('jonas');
  accounts.follow(mira.id, jonas.id);
  assert.equal(mono.circle(mira.id).length, 0);
  mono.replace(jonas.id, { text: 'da' });
  assert.equal(mono.circle(mira.id).length, 1);
  mono.clear(jonas.id);
  assert.equal(mono.circle(mira.id).length, 0);
});

test('sich selbst folgen geht nicht', () => {
  fresh();
  const mira = makeAccount('mira');
  assert.equal(accounts.follow(mira.id, mira.id), false);
  assert.equal(accounts.followingCount(mira.id), 0);
});

// — Multipart ——————————————————————————————————————————————————

test('der Multipart-Parser trennt Felder und Datei', () => {
  const boundary = 'abc123';
  const raw = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="text"\r\n\r\nhallo\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="alt"\r\n\r\nein Punkt\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="datei"; filename="p.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`,
    ),
    PNG,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const { fields, files } = parseMultipart(raw, boundary);
  assert.equal(fields.text, 'hallo');
  assert.equal(fields.alt, 'ein Punkt');
  assert.equal(files.length, 1);
  assert.equal(files[0].contentType, 'image/png');
  assert.ok(files[0].data.equals(PNG));
});

test('boundaryOf liest die Grenze aus dem Content-Type', () => {
  assert.equal(boundaryOf('multipart/form-data; boundary=xyz'), 'xyz');
  assert.equal(boundaryOf('multipart/form-data; boundary="x y"'), 'x y');
  assert.equal(boundaryOf('application/x-www-form-urlencoded'), null);
});

// — HTTP ———————————————————————————————————————————————————————

async function withServer(fn) {
  const server = createServer(createApp());
  server.listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(base);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

const form = (data) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(data).toString(),
  redirect: 'manual',
});

async function signUp(base, handle) {
  const res = await fetch(
    `${base}/registrieren`,
    form({ handle, password: 'a-long-enough-password', displayName: handle }),
  );
  assert.equal(res.status, 303);
  return res.headers.get('set-cookie').split(';')[0];
}

test('HTTP: registrieren, schreiben, ersetzen, lesen', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');

    await fetch(`${base}/mono`, { ...form({ text: 'erstes' }), headers: { ...form({}).headers, cookie } });
    let page = await (await fetch(`${base}/@mira`)).text();
    assert.ok(page.includes('erstes'));

    await fetch(`${base}/mono`, { ...form({ text: 'zweites' }), headers: { ...form({}).headers, cookie } });
    page = await (await fetch(`${base}/@mira`)).text();
    assert.ok(page.includes('zweites'));
    assert.ok(!page.includes('erstes'));
  });
});

test('HTTP: die Seite liefert kein Skript aus und verbietet es', async () => {
  fresh();
  await withServer(async (base) => {
    const res = await fetch(`${base}/wand`);
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /script-src 'none'/);
    assert.ok(!(await res.text()).includes('<script'));
  });
});

test('HTTP: ohne Anmeldung führt Schreiben zur Anmeldung', async () => {
  fresh();
  await withServer(async (base) => {
    const res = await fetch(`${base}/mono`, form({ text: 'hm' }));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/anmelden');
  });
});

test('HTTP: Text wird escaped, nicht eingebaut', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');
    await fetch(`${base}/mono`, {
      ...form({ text: '<script>alert(1)</script>' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    });
    const page = await (await fetch(`${base}/@mira`)).text();
    assert.ok(!page.includes('<script>alert(1)'));
    assert.ok(page.includes('&lt;script&gt;'));
  });
});

test('HTTP: Foto hochladen ersetzt den Text und ist danach abrufbar', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');
    await fetch(`${base}/mono`, {
      ...form({ text: 'nur Text' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    });

    const body = new FormData();
    body.set('text', '');
    body.set('alt', 'ein Punkt');
    body.set('datei', new Blob([PNG], { type: 'image/png' }), 'p.png');
    const res = await fetch(`${base}/mono`, { method: 'POST', body, headers: { cookie }, redirect: 'manual' });
    assert.equal(res.status, 303);

    const page = await (await fetch(`${base}/@mira`)).text();
    assert.ok(!page.includes('nur Text'));
    assert.match(page, /<img src="\/medien\/\d+" alt="ein Punkt">/);

    const id = /\/medien\/(\d+)/.exec(page)[1];
    const media = await fetch(`${base}/medien/${id}`);
    assert.equal(media.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.from(await media.arrayBuffer()).equals(PNG), true);

    // Ersetzen macht die alte Medien-URL tot.
    await fetch(`${base}/mono`, {
      ...form({ text: 'wieder Text' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    });
    assert.equal((await fetch(`${base}/medien/${id}`)).status, 404);
  });
});

test('HTTP: folgen und entfolgen ändern deine Leute', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');
    await signUp(base, 'jonas');
    mono.replace(accounts.findByHandle('jonas').id, { text: 'jonas sagt was' });

    await fetch(`${base}/@jonas/folgen`, { ...form({}), headers: { cookie }, redirect: 'manual' });
    let page = await (await fetch(`${base}/leute`, { headers: { cookie } })).text();
    assert.ok(page.includes('jonas sagt was'));

    await fetch(`${base}/@jonas/entfolgen`, { ...form({}), headers: { cookie }, redirect: 'manual' });
    page = await (await fetch(`${base}/leute`, { headers: { cookie } })).text();
    assert.ok(!page.includes('jonas sagt was'));
  });
});

test('HTTP: Fehler kommen auf Deutsch, in der Sprache der Oberfläche', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');
    const body = new FormData();
    body.set('text', '');
    body.set('alt', '');
    body.set('datei', new Blob([PNG], { type: 'image/png' }), 'p.png');
    const res = await fetch(`${base}/mono`, { method: 'POST', body, headers: { cookie } });
    assert.equal(res.status, 400);
    const page = await res.text();
    assert.ok(page.includes('was zu sehen ist'));
    assert.ok(!/required|unsupported|too large/.test(page));
  });
});

test('HTTP: das Feld ist der Beitrag — leer abschicken löscht ihn', async () => {
  fresh();
  await withServer(async (base) => {
    const cookie = await signUp(base, 'mira');
    const post = (text) =>
      fetch(`${base}/mono`, {
        ...form({ text }),
        headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
      });

    await post('etwas');
    // Das Feld zeigt, was gilt — es steht nicht daneben.
    let page = await (await fetch(`${base}/`, { headers: { cookie } })).text();
    assert.match(page, /<textarea[^>]*>etwas<\/textarea>/);

    const res = await post('   ');
    assert.equal(res.status, 303);
    assert.equal(mono.read(accounts.findByHandle('mira').id), null);
    page = await (await fetch(`${base}/`, { headers: { cookie } })).text();
    assert.match(page, /<textarea[^>]*><\/textarea>/);
  });
});

test('HTTP: unbekannter Mensch ergibt 404', async () => {
  fresh();
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/@niemand`)).status, 404);
  });
});

// — Kleinkram —————————————————————————————————————————————————

test('seit() sagt Abstand statt Zeitstempel', () => {
  const ago = (ms) => new Date(Date.now() - ms).toISOString();
  assert.equal(seit(ago(5_000)), 'gerade eben');
  assert.equal(seit(ago(5 * 60_000)), 'vor 5 min');
  assert.equal(seit(ago(3 * 3600_000)), 'vor 3 h');
  assert.equal(seit(ago(2 * 86400_000)), 'vor 2 d');
  assert.equal(seit(null), '');
});

test('Handles sind eng begrenzt und einmalig', () => {
  fresh();
  makeAccount('mira');
  assert.throws(() => makeAccount('mira'), /hat schon jemand/);
  assert.throws(() => makeAccount('Mi ra'), /geht so nicht/);
  assert.throws(
    () => accounts.createAccount({ handle: 'kurz', password: 'kurz' }),
    /Passwort ist zu kurz/,
  );
});

function alt(description) {
  return { contentType: 'image/png', alt: description, data: PNG };
}
