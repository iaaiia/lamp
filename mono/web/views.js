/**
 * Servergerendertes HTML. Kein Client-JavaScript — die CSP verbietet es.
 *
 * Es gibt vier Seiten: dein Beitrag, deine Leute, die Wand, ein Mensch. Mehr
 * Seiten hätte mono nur, wenn es mehr Beiträge hätte.
 */

import config from '../config.js';
import { STYLESHEET } from './style.js';

export const escape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Zeit als Abstand, nicht als Zeitstempel: „vor 3 Minuten“ liest sich als Zustand. */
export function seit(iso) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'gerade eben';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} d`;
  return `vor ${Math.floor(days / 7)} w`;
}

export function layout({ title, body, account = null, nav = true }) {
  const kopf = nav
    ? `<header class="kopf">
        <a class="wortmarke" href="/">mono</a>
        <nav>
          ${
            account
              ? `<a href="/">deins</a> · <a href="/leute">leute</a> · <a href="/wand">wand</a> · <a href="/@${escape(account.handle)}">@${escape(account.handle)}</a>`
              : '<a href="/wand">wand</a> · <a href="/anmelden">anmelden</a>'
          }
        </nav>
      </header>`
    : '';

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escape(title)} — ${escape(config.instanceName)}</title>
<style>${STYLESHEET}</style>
</head>
<body>
<div class="seite">
${kopf}
${body}
</div>
</body>
</html>`;
}

const warnung = (message) => (message ? `<p class="warnung">${escape(message)}</p>` : '');

/** Ein Beitrag. Es gibt genau eine Darstellung — überall dieselbe. */
export function beitrag(mono, { self = false } = {}) {
  if (!mono) return '';
  const name = mono.account.displayName || mono.account.handle;
  let medium = '';
  if (mono.media) {
    const src = `/medien/${mono.media.id}`;
    medium =
      mono.media.kind === 'video'
        ? `<video controls preload="metadata" src="${src}"></video>
           <p class="alt">${escape(mono.media.alt)}</p>`
        : `<img src="${src}" alt="${escape(mono.media.alt)}">
           <p class="alt">${escape(mono.media.alt)}</p>`;
  }
  return `<article class="karte beitrag">
    <div class="wer">
      <a href="/@${escape(mono.account.handle)}">${escape(name)}${self ? ' (du)' : ''}</a>
      <span class="wann">${seit(mono.at)}</span>
    </div>
    ${mono.text ? `<p>${escape(mono.text)}</p>` : ''}
    ${medium}
  </article>`;
}

/** Das Schreibfeld. Es steht immer über dem, was es ersetzen wird. */
export function schreiben(mono, fehler) {
  const ersetzt = mono
    ? '<p class="hinweis">Wenn du das abschickst, ist dein jetziger Beitrag weg. Es gibt nur einen.</p>'
    : '<p class="hinweis">Du hast gerade nichts stehen. Was du schreibst, steht dann da — bis du etwas anderes schreibst.</p>';

  return `${warnung(fehler)}
  <form class="karte" method="post" action="/mono" enctype="multipart/form-data">
    <textarea name="text" maxlength="${config.limits.monoLength}" placeholder="Schreib etwas…"></textarea>
    <fieldset>
      <label class="datei">
        <input id="datei" type="file" name="datei" accept="image/*,video/*">
        <span>Foto oder Video wählen — ersetzt ebenfalls alles</span>
      </label>
      <label for="alt">Beschreibung, wenn du eins anhängst (Pflicht)</label>
      <input id="alt" type="text" name="alt" maxlength="${config.limits.altLength}" placeholder="Was ist zu sehen?">
    </fieldset>
    <button class="knopf" type="submit">Fertig</button>
  </form>
  ${ersetzt}`;
}

export function startseite({ account, mono, fehler }) {
  // Reihenfolge mit Absicht: schreiben, dann sehen, was das ersetzen wuerde,
  // und erst darunter der Weg, es ersatzlos wegzunehmen. Ein Loesch-Knopf ueber
  // dem Beitrag zeigt auf nichts.
  const jetzt = mono
    ? `<p class="hinweis">Das steht gerade unter deinem Namen:</p>
       ${beitrag(mono, { self: true })}
       <form method="post" action="/mono/loeschen">
         <button class="knopf leise" type="submit">Löschen und nichts hinstellen</button>
       </form>`
    : '';
  return layout({
    title: 'dein mono',
    account,
    body: `${schreiben(mono, fehler)}${jetzt}`,
  });
}

export function leute({ account, monos }) {
  const body = monos.length
    ? monos.map((m) => beitrag(m)).join('\n')
    : `<p class="leer">Du folgst noch niemandem — oder niemand von ihnen sagt gerade etwas.<br><a href="/wand">Schau auf die Wand.</a></p>`;
  return layout({ title: 'deine leute', account, body });
}

export function wand({ account, monos }) {
  const body = monos.length
    ? monos.map((m) => beitrag(m)).join('\n')
    : '<p class="leer">Hier sagt gerade niemand etwas.</p>';
  return layout({
    title: 'die wand',
    account,
    body: `<p class="hinweis">Alle, die gerade etwas stehen haben. Neueste zuerst, sonst keine Ordnung.</p>${body}`,
  });
}

export function profil({ account, person, mono, folgt }) {
  const name = person.display_name || person.handle;
  const knopf =
    account && account.id !== person.id
      ? `<form method="post" action="/@${escape(person.handle)}/${folgt ? 'entfolgen' : 'folgen'}">
           <button class="knopf${folgt ? ' leise' : ''}" type="submit">${folgt ? 'nicht mehr folgen' : 'folgen'}</button>
         </form>`
      : '';
  const inhalt = mono
    ? beitrag(mono, { self: Boolean(account) && account.id === person.id })
    : `<p class="leer">${escape(name)} sagt gerade nichts.</p>`;
  return layout({
    title: `@${person.handle}`,
    account,
    body: `<h1 class="gross">${escape(name)}</h1>
      <p class="vorspann">@${escape(person.handle)}</p>
      ${inhalt}
      ${knopf}`,
  });
}

export function willkommen({ fehler }) {
  return layout({
    title: 'ein Beitrag',
    nav: true,
    body: `<h1 class="gross">Ein Beitrag.<br>Mehr hast du nicht.</h1>
      <p class="vorspann">mono gibt jedem Menschen genau einen Platz. Was du schreibst oder
      zeigst, steht da — bis du etwas anderes hinstellst. Dann ist das Alte weg. Kein Verlauf,
      keine Zahlen, nichts zu scrollen, was du schon kennst.</p>
      ${warnung(fehler)}
      <form class="karte" method="post" action="/registrieren">
        <label for="handle">Name (a–z, 0–9, _)</label>
        <input id="handle" type="text" name="handle" maxlength="${config.limits.handleLength}" required>
        <label for="anzeige">Wie du angezeigt wirst</label>
        <input id="anzeige" type="text" name="displayName" maxlength="${config.limits.displayNameLength}">
        <label for="pw">Passwort (mindestens 8 Zeichen)</label>
        <input id="pw" type="password" name="password" required>
        <button class="knopf" type="submit">Anfangen</button>
      </form>
      <p class="hinweis">Schon dabei? <a href="/anmelden">Anmelden</a>.</p>`,
  });
}

export function anmelden({ fehler }) {
  return layout({
    title: 'anmelden',
    body: `<h1 class="gross">Anmelden</h1>
      ${warnung(fehler)}
      <form class="karte" method="post" action="/anmelden">
        <label for="handle">Name</label>
        <input id="handle" type="text" name="handle" required>
        <label for="pw">Passwort</label>
        <input id="pw" type="password" name="password" required>
        <button class="knopf" type="submit">Weiter</button>
      </form>
      <p class="hinweis">Neu hier? <a href="/">Konto anlegen</a>.</p>`,
  });
}

export const nichtGefunden = () =>
  layout({ title: 'nichts da', body: '<p class="leer">Diese Seite gibt es nicht.</p>' });
