/**
 * mono — HTTP-Server.
 *
 * Vier Wege, mehr braucht es nicht: schreiben, deine Leute, die Wand, ein
 * Mensch. Alles servergerendert, kein Client-JavaScript (`script-src 'none'`).
 */

import { createServer } from 'node:http';
import config from './config.js';
import { openDatabase } from './db.js';
import { createRouter, parseCookies, parseForm, readBody } from '../src/lib/http.js';
import { boundaryOf, parseMultipart, readRawBody } from './lib/multipart.js';
import * as accounts from './domain/accounts.js';
import * as mono from './domain/mono.js';
import * as views from './web/views.js';

const COOKIE = 'mono_session';

const sessionCookie = (id) =>
  `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function sendHtml(res, status, html, cookie) {
  const headers = {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(html),
    'referrer-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
    'content-security-policy':
      "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; script-src 'none'; form-action 'self'",
  };
  if (cookie) headers['set-cookie'] = cookie;
  res.writeHead(status, headers);
  res.end(html);
}

function redirect(res, location, cookie) {
  const headers = { location };
  if (cookie) headers['set-cookie'] = cookie;
  res.writeHead(303, headers);
  res.end();
}

const viewer = (req) => accounts.accountForSession(parseCookies(req.headers.cookie ?? '')[COOKIE]);

export function createApp() {
  const router = createRouter();

  // — Ansehen ————————————————————————————————————————————————

  router.get('/', (req, res) => {
    const account = viewer(req);
    if (!account) return sendHtml(res, 200, views.willkommen({}));
    sendHtml(res, 200, views.startseite({ mono: mono.read(account.id) }));
  });

  router.get('/leute', (req, res) => {
    const account = viewer(req);
    if (!account) return redirect(res, '/anmelden');
    sendHtml(res, 200, views.leute({ monos: mono.circle(account.id) }));
  });

  router.get('/wand', (req, res) => {
    sendHtml(res, 200, views.wand({ monos: mono.wall() }));
  });

  router.get('/@:handle', (req, res, { params }) => {
    const person = accounts.findByHandle(params.handle);
    if (!person) return sendHtml(res, 404, views.nichtGefunden());
    const account = viewer(req);
    sendHtml(
      res,
      200,
      views.profil({
        account,
        person,
        mono: mono.read(person.id),
        folgt: account ? accounts.follows(account.id, person.id) : false,
      }),
    );
  });

  router.get('/medien/:id', (req, res, { params }) => {
    const row = mono.mediaBytes(Number(params.id));
    // Nur ausliefern, solange das Medium der aktuelle Beitrag ist. Ein
    // ersetzter Beitrag ist geloescht, also darf auch die alte URL nichts
    // mehr hergeben — sonst waere „geloescht" nur ein Wort im Interface.
    if (!row) {
      res.writeHead(404).end();
      return;
    }
    const bytes = Buffer.from(row.bytes);
    res.writeHead(200, {
      'content-type': row.content_type,
      'content-length': bytes.length,
      'cache-control': 'private, max-age=60',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
    });
    res.end(bytes);
  });

  router.get('/anmelden', (req, res) => {
    if (viewer(req)) return redirect(res, '/');
    sendHtml(res, 200, views.anmelden({}));
  });

  // — Schreiben ——————————————————————————————————————————————

  router.post('/mono', async (req, res) => {
    const account = viewer(req);
    if (!account) return redirect(res, '/anmelden');

    let text = '';
    let media = null;
    const boundary = boundaryOf(req.headers['content-type'] ?? '');
    try {
      if (boundary) {
        const raw = await readRawBody(req, config.limits.mediaBytes + 64 * 1024);
        const { fields, files } = parseMultipart(raw, boundary);
        text = fields.text ?? '';
        const file = files.find((f) => f.name === 'datei' && f.data.length > 0);
        if (file) media = { contentType: file.contentType, alt: fields.alt ?? '', data: file.data };
      } else {
        const form = parseForm(await readBody(req));
        text = form.text ?? '';
      }
      // Das Feld *ist* der Beitrag: Wer es leerraeumt und abschickt, nimmt ihn
      // weg. Deshalb gibt es keinen eigenen Loeschknopf — und deshalb ist ein
      // leeres Feld hier kein Fehler, sondern eine Aussage.
      if (!String(text).trim() && !media) mono.clear(account.id);
      else mono.replace(account.id, { text, media });
    } catch (error) {
      const fehler = error instanceof mono.MonoError ? error.message : 'Das hat nicht geklappt.';
      return sendHtml(res, 400, views.startseite({ mono: mono.read(account.id), fehler }));
    }
    redirect(res, '/');
  });

  router.post('/@:handle/folgen', async (req, res, { params }) => {
    const account = viewer(req);
    if (!account) return redirect(res, '/anmelden');
    await readBody(req);
    const person = accounts.findByHandle(params.handle);
    if (person) accounts.follow(account.id, person.id);
    redirect(res, `/@${params.handle}`);
  });

  router.post('/@:handle/entfolgen', async (req, res, { params }) => {
    const account = viewer(req);
    if (!account) return redirect(res, '/anmelden');
    await readBody(req);
    const person = accounts.findByHandle(params.handle);
    if (person) accounts.unfollow(account.id, person.id);
    redirect(res, `/@${params.handle}`);
  });

  // — Konto ——————————————————————————————————————————————————

  router.post('/registrieren', async (req, res) => {
    const form = parseForm(await readBody(req));
    try {
      const account = accounts.createAccount({
        handle: form.handle,
        password: form.password,
        displayName: form.displayName ?? '',
      });
      redirect(res, '/', sessionCookie(accounts.startSession(account.id)));
    } catch (error) {
      sendHtml(res, 400, views.willkommen({ fehler: error.message }));
    }
  });

  router.post('/anmelden', async (req, res) => {
    const form = parseForm(await readBody(req));
    const account = accounts.authenticate(form.handle ?? '', form.password ?? '');
    if (!account) {
      return sendHtml(res, 400, views.anmelden({ fehler: 'Name oder Passwort stimmt nicht.' }));
    }
    redirect(res, '/', sessionCookie(accounts.startSession(account.id)));
  });

  router.post('/abmelden', async (req, res) => {
    await readBody(req);
    const sessionId = parseCookies(req.headers.cookie ?? '')[COOKIE];
    if (sessionId) accounts.endSession(sessionId);
    redirect(res, '/', clearCookie());
  });

  return async (req, res) => {
    const url = new URL(req.url, config.origin);
    const route = router.match(req.method, url.pathname);
    if (!route) return sendHtml(res, 404, views.nichtGefunden());
    try {
      await route.handler(req, res, { params: route.params, url });
    } catch (error) {
      if (!res.headersSent) sendHtml(res, 500, views.nichtGefunden());
      else res.end();
      if (process.env.NODE_ENV !== 'test') console.error(error);
    }
  };
}

export function seedDemo() {
  if (accounts.findByHandle('mira')) return;
  const mira = accounts.createAccount({
    handle: 'mira',
    password: 'mono-demo-password',
    displayName: 'Mira',
  });
  const jonas = accounts.createAccount({
    handle: 'jonas',
    password: 'mono-demo-password',
    displayName: 'Jonas',
  });
  mono.replace(mira.id, { text: 'Heute ist der Fluss so hoch, dass die Bank unter Wasser steht.' });
  mono.replace(jonas.id, { text: 'Ich lerne gerade Bass. Es klingt noch nach Umzug.' });
  accounts.follow(mira.id, jonas.id);
  accounts.follow(jonas.id, mira.id);
}

const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isEntry) {
  openDatabase();
  if (config.seed) seedDemo();
  createServer(createApp()).listen(config.port, () => {
    console.log(`mono läuft auf ${config.origin}`);
  });
}
