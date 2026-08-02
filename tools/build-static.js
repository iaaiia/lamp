/**
 * Baut einen statischen Rundgang durch lamb — für GitHub Pages.
 *
 * Was das ist und was nicht:
 *
 *   Es ist  — dieselben Views, dasselbe Stylesheet, dieselben Kreiszeichen und
 *             derselbe Himmel wie im echten Server, mit Demodaten gefüllt und
 *             als Dateien abgelegt. Man kann sich durchklicken und die Fläche
 *             schieben.
 *   Es ist nicht — die Anwendung. Pages liefert Dateien aus; es führt kein Node
 *             aus, hat keine Datenbank und keine Sitzungen. Anmelden, Schreiben,
 *             Support geben und ActivityPub brauchen den echten Server
 *             (siehe Dockerfile).
 *
 * Damit niemand in eine tote Interaktion läuft, werden Formulare, die im echten
 * Betrieb POST senden, hier zu harmlosen Ankern umgeschrieben, und oben steht
 * ein Hinweis, was gerade fehlt.
 */

import { createServer } from 'node:http';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import config from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { createLocalAccount, createSession } from '../src/domain/accounts.js';
import { admit, createCircle, invite, join } from '../src/domain/circles.js';
import { createPost, react } from '../src/domain/posts.js';
import { requestFollow } from '../src/domain/safety.js';
import { createApp } from '../src/server.js';

// Bewusst nicht 'docs': dort liegt die Projektdokumentation, und dieses Skript
// leert sein Ausgabeverzeichnis vor jedem Lauf.
const OUT = path.resolve(process.argv[2] ?? 'site');

config.federation.enabled = false;
config.seed = false;

/* ------------------------------------------------------------- Demodaten */

/**
 * Genug Leben, dass der Himmel etwas zu zeigen hat: eigene Kreise mit
 * Gesprächen, fremde zum Entdecken, ein privater Kreis, ein Beitrag mit
 * Inhaltshinweis und Support daran.
 */
function seed() {
  openDatabase(':memory:');

  const mira = createLocalAccount({ username: 'mira', password: 'nur-fuer-die-demo', displayName: 'Mira' });
  const jonas = createLocalAccount({ username: 'jonas', password: 'nur-fuer-die-demo', displayName: 'Jonas', isMinor: true });
  const amina = createLocalAccount({ username: 'amina', password: 'nur-fuer-die-demo', displayName: 'Amina' });
  const tomas = createLocalAccount({ username: 'tomas', password: 'nur-fuer-die-demo', displayName: 'Tomas' });

  requestFollow(mira.id, jonas.id);
  requestFollow(jonas.id, mira.id);
  requestFollow(mira.id, amina.id);

  const leipzig = createCircle(mira, {
    name: 'Leipzig 15 bis 24',
    kind: 'local',
    place: 'Leipzig',
    purpose: 'Was hier so läuft.',
  });
  join(leipzig, jonas);
  join(leipzig, amina);
  join(leipzig, tomas);

  const freunde = createCircle(mira, { name: 'Freundeskreis', kind: 'private', purpose: 'Nur wir.' });
  invite(freunde, mira, jonas);
  invite(freunde, mira, amina);

  const mental = createCircle(amina, {
    name: 'Mental Health',
    kind: 'topic',
    joining: 'request',
    purpose: 'Moderiert. Inhaltshinweise sind hier normal.',
  });
  // Dieser Kreis nimmt auf Anfrage auf — erst die Moderation lässt herein.
  join(mental, mira);
  admit(mental, amina, mira.id);
  join(mental, jonas);
  admit(mental, amina, jonas.id);

  const abi = createCircle(mira, { name: 'Abi 2027', kind: 'topic', purpose: 'Lernen, Panik, Ergebnisse.' });
  join(abi, jonas);

  // Kreise, die Mira noch nicht kennt — sie liegen im Himmel weiter außen.
  createCircle(tomas, { name: 'Skaten Plagwitz', kind: 'local', place: 'Leipzig', purpose: 'Wo gerade was geht.' });
  createCircle(tomas, { name: 'Erste WG', kind: 'topic', purpose: 'Wohnungssuche, Mietkram, Putzplan-Drama.' });
  createCircle(amina, { name: 'Bewerbungen', kind: 'topic', purpose: 'Anschreiben gegenlesen, ehrlich und freundlich.' });
  createCircle(tomas, { name: 'Serien schauen', kind: 'topic', purpose: 'Ohne Spoiler, bitte.' });

  createPost(jonas, {
    content: 'Weiß jemand, ob die Bibliothek Sonntag offen hat? Muss für Mathe lernen, und zu Hause ist gerade nichts zu machen.',
    circleId: leipzig.id,
    replyPolicy: 'everyone',
  });
  const antwort = createPost(amina, {
    content: 'Ja, sonntags ab 11. Der dritte Stock ist am leisesten, da sitze ich meistens.',
    circleId: leipzig.id,
    replyPolicy: 'everyone',
  });
  react(mira.id, antwort.id);
  react(jonas.id, antwort.id);
  createPost(tomas, { content: 'Der Lesesaal im Erdgeschoss ist sonntags meistens leer.', inReplyTo: antwort.id });

  const flohmarkt = createPost(mira, {
    content: 'Falls jemand Samstag zum Flohmarkt will: Ich fahre gegen zehn los.',
    circleId: leipzig.id,
    replyPolicy: 'everyone',
  });
  createPost(tomas, { content: 'Ich komme mit. Treffpunkt an der Haltestelle?', inReplyTo: flohmarkt.id });
  createPost(amina, { content: 'Bringt Kleingeld mit, die meisten Stände nehmen nichts anderes.', inReplyTo: flohmarkt.id });
  react(jonas.id, flohmarkt.id);
  react(tomas.id, flohmarkt.id);

  const schwer = createPost(jonas, {
    content: 'Dritte Klausur in Folge verhauen. Ich muss das nicht gelöst kriegen, ich wollte es nur mal irgendwo hinschreiben, wo nicht sofort jemand Ratschläge gibt.',
    contentWarning: 'Prüfungsdruck',
    circleId: mental.id,
    replyPolicy: 'followers',
  });
  react(mira.id, schwer.id);
  react(amina.id, schwer.id);

  const schalter = createPost(mira, {
    content: 'Kleine Sache, die mir hilft: Benachrichtigungen ab 22 Uhr aus. Keine große Methode, nur ein Schalter.',
    circleId: mental.id,
    replyPolicy: 'followers',
  });
  createPost(amina, { content: 'Mache ich seit einem Monat. Der Unterschied ist größer, als ich dachte.', inReplyTo: schalter.id });
  react(jonas.id, schalter.id);

  const kapitel = createPost(mira, { content: 'Hat jemand die Zusammenfassung von Kapitel 4?', circleId: abi.id, replyPolicy: 'everyone' });
  createPost(jonas, { content: 'Ich schick sie dir heute Abend.', inReplyTo: kapitel.id });
  createPost(mira, { content: 'Samstag jemand Zeit?', circleId: freunde.id, replyPolicy: 'everyone' });

  createPost(mira, {
    content: 'lamb läuft jetzt föderiert. Wer von einem anderen Server folgen will: @mira@lamb.example',
    visibility: 'public',
    replyPolicy: 'followers',
  });

  return { viewer: mira, session: createSession(mira.id).id };
}

/* ------------------------------------------------------- Seiten abgreifen */

const FLAT = new Map([
  ['/', 'index.html'],
  ['/discover', 'discover.html'],
  ['/settings', 'settings.html'],
  ['/moderation', 'moderation.html'],
  ['/@mira', 'profil-mira.html'],
]);

const circleFile = (slug) => `kreis-${slug}.html`;

/**
 * Alle Links auf die abgelegten Dateien umbiegen und Formulare entschärfen.
 * Flache Dateinamen, damit nichts von der Verzeichnistiefe abhängt — die Seite
 * liegt bei GitHub Pages unter einem Unterpfad.
 */
function rewrite(html, slugs) {
  let out = html;

  for (const [route, file] of FLAT) {
    if (route === '/') continue;
    out = out.replaceAll(`href="${route}"`, `href="${file}"`);
    out = out.replaceAll(`href="${route}?`, `href="${file}?`);
  }
  for (const slug of slugs) {
    out = out.replaceAll(`href="/c/${slug}"`, `href="${circleFile(slug)}"`);
    out = out.replaceAll(`href="/c/${slug}?`, `href="${circleFile(slug)}?`);
  }

  // Verbleibende absolute Pfade: Startseite, Stylesheet, alles Übrige.
  out = out.replaceAll('href="/style.css"', 'href="style.css"');
  out = out.replaceAll('href="/"', 'href="index.html"');
  out = out.replace(/href="\/[^"]*"/g, 'href="index.html"');

  // Formulare würden hier ins Leere senden. Sie bleiben sichtbar — sie gehören
  // zum Bild — aber sie tun nichts, statt in eine Fehlerseite zu laufen.
  out = out.replace(/<form([^>]*)method="post"([^>]*)>/gi, '<form$1method="get" action="#demo" data-demo="inert"$2>');
  out = out.replace(/action="\/[^"]*"/g, 'action="#demo"');

  return out;
}

const BANNER = `<div class="demo-banner" id="demo">
  <strong>Rundgang mit Demodaten.</strong> Schieben, stöbern und lesen geht.
  Anmelden, Schreiben und Föderation brauchen den laufenden Server —
  <a href="https://github.com/iaaiia/lamp#selbst-starten">so startest du ihn</a>.
</div>`;

const DEMO_CSS = `
.demo-banner {
  background: #F0EAE0;
  border-bottom: 1px solid rgba(22, 26, 30, .1);
  color: var(--ink);
  padding: .7rem 1.25rem;
  font-size: .88rem;
  line-height: 1.5;
}
.demo-banner strong { font-weight: 700; }
.demo-banner a { margin-left: .3rem; }
[data-demo="inert"] button { opacity: .55; cursor: not-allowed; }
`;

async function main() {
  // Sicherung gegen genau den Fehler, der hier einmal passiert ist: Das
  // Ausgabeverzeichnis wird geleert, also darf es nichts enthalten, was nicht
  // von diesem Skript stammt.
  if (/(^|[\\/])(src|docs|tests|tools|proposal|design|\.git)$/.test(OUT)) {
    throw new Error(`${OUT} ist kein Ausgabeverzeichnis — es würde gelöscht.`);
  }

  const { session } = seed();
  const app = createApp();
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cookie = `lamb_session=${session}`;

  const { all } = await import('../src/db.js');
  const circles = all('SELECT slug FROM circles ORDER BY id');
  const slugs = circles.map((row) => row.slug);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const pages = [
    ...[...FLAT.entries()].map(([route, file]) => ({ route, file })),
    ...slugs.map((slug) => ({ route: `/c/${slug}`, file: circleFile(slug) })),
  ];

  for (const { route, file } of pages) {
    const response = await fetch(base + route, { headers: { cookie } });
    if (!response.ok) throw new Error(`${route} antwortete ${response.status}`);
    let html = await response.text();

    html = rewrite(html, slugs);
    html = html.replace('<main id="main" tabindex="-1">', `${BANNER}\n<main id="main" tabindex="-1">`);
    // Der Rundgang liegt unter einem Unterpfad; absolute Verweise auf den
    // Ursprungsserver gehören hier nicht hin.
    html = html.replace(/<link rel="alternate"[^>]*>/, '');

    await writeFile(path.join(OUT, file), html, 'utf8');
    process.stdout.write(`  ${file}\n`);
  }

  const { STYLESHEET } = await import('../src/web/style.js');
  await writeFile(path.join(OUT, 'style.css'), STYLESHEET + DEMO_CSS, 'utf8');
  // Jekyll würde Dateien mit Unterstrich verschlucken und den Build verlangsamen.
  await writeFile(path.join(OUT, '.nojekyll'), '', 'utf8');

  server.close();
  console.log(`\n${pages.length + 1} Dateien in ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
