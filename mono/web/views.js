/**
 * Servergerendertes HTML. Kein Client-JavaScript — die CSP verbietet es.
 *
 * Die Seiten sind nach der Referenz gebaut: oben eine Titelleiste, in der Mitte
 * eine Fläche, unten das, was man drückt. Was schwebt, schwebt über dem Inhalt;
 * was zusammengehört, liegt in einer Fläche statt in je einer Karte.
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

const reiter = (hier) => {
  const eintrag = (pfad, wort) =>
    `<a href="${pfad}"${hier === pfad ? ' aria-current="page"' : ''}>${wort}</a>`;
  return `<nav class="reiter">${eintrag('/', 'Deins')}${eintrag('/leute', 'Leute')}${eintrag('/wand', 'Wand')}</nav>`;
};

/**
 * @param titel  steht mittig in der Leiste — sonst steht dort nichts
 * @param fuss   was unten schwebt, über den Reitern
 * @param hier   Pfad für die Markierung im Reiter; null blendet ihn aus
 */
export function layout({ titel, body, hier = null, fuss = '', zurueck = null }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f2f2f7">
<title>${escape(titel)}</title>
<style>${STYLESHEET}</style>
</head>
<body>
<header class="leiste">${
    zurueck ? `<a class="zurueck" href="${zurueck}">Zurück</a>` : ''
  }${escape(titel)}</header>
<main class="seite">
${body}
</main>
<div class="fuss">
${fuss}
${hier === null ? '' : reiter(hier)}
</div>
</body>
</html>`;
}

/** Ein Beitrag als Zeile. Überall dieselbe Darstellung. */
export function beitrag(mono, { name = true } = {}) {
  if (!mono) return '';
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
  const wer = name
    ? `<div class="wer">
         <a href="/@${escape(mono.account.handle)}">${escape(mono.account.displayName || mono.account.handle)}</a>
         <span class="wann">${seit(mono.at)}</span>
       </div>`
    : '';
  return `<article class="zeile beitrag">
    ${wer}
    ${mono.text ? `<p>${escape(mono.text)}</p>` : ''}
    ${medium}
  </article>`;
}

const listeVon = (monos, leer) =>
  monos.length
    ? `<div class="flaeche liste">${monos.map((m) => beitrag(m)).join('')}</div>`
    : `<p class="leer">${leer}</p>`;

/**
 * Deine Seite ist dein Beitrag — das Feld *ist* das, was dasteht, wie in der
 * Referenz die Notiz das Feld ist. Kein Schreibfeld über einer Karte, die
 * dasselbe nochmal zeigt: Was du siehst, ist was gilt, und was du abschickst,
 * ersetzt es. Leer abschicken löscht; deshalb braucht es keinen Löschknopf.
 */
export function startseite({ mono, fehler }) {
  const angehaengt = mono?.media
    ? `<div class="zeile beitrag">${
        mono.media.kind === 'video'
          ? `<video controls preload="metadata" src="/medien/${mono.media.id}"></video>`
          : `<img src="/medien/${mono.media.id}" alt="${escape(mono.media.alt)}">`
      }</div>`
    : '';

  return layout({
    titel: config.instanceName,
    hier: '/',
    body: `${fehler ? `<p class="warnung">${escape(fehler)}</p>` : ''}
      <form id="schreiben" class="flaeche${mono?.media ? ' mit-medium' : ''}" method="post" action="/mono" enctype="multipart/form-data">
        <textarea name="text" maxlength="${config.limits.monoLength}" placeholder="Schreib etwas…">${escape(mono?.text ?? '')}</textarea>
        ${angehaengt}
        <div class="liste">
          <label class="datei">
            <input id="datei" type="file" name="datei" accept="image/*,video/*">
            <span>Foto oder Video</span>
          </label>
          <input id="alt" type="text" name="alt" maxlength="${config.limits.altLength}" placeholder="Was ist zu sehen?">
        </div>
      </form>
      ${mono ? '<p class="hinweis">Leer abschicken löscht.</p>' : ''}`,
    fuss: `<button class="knopf" type="submit" form="schreiben">Fertig</button>`,
  });
}

export const leute = ({ monos }) =>
  layout({
    titel: 'Leute',
    hier: '/leute',
    body: listeVon(monos, 'Von deinen Leuten sagt gerade niemand etwas.'),
  });

export const wand = ({ monos }) =>
  layout({
    titel: 'Wand',
    hier: '/wand',
    body: listeVon(monos, 'Hier sagt gerade niemand etwas.'),
  });

export function profil({ account, person, mono, folgt }) {
  const knopf =
    account && account.id !== person.id
      ? `<form method="post" action="/@${escape(person.handle)}/${folgt ? 'entfolgen' : 'folgen'}">
           <button class="knopf klar${folgt ? ' warnend' : ''}" type="submit">${
             folgt ? 'Nicht mehr folgen' : 'Folgen'
           }</button>
         </form>`
      : '';
  return layout({
    titel: person.display_name || person.handle,
    hier: null,
    zurueck: '/wand',
    body: mono
      ? `<div class="flaeche liste">${beitrag(mono, { name: false })}</div>
         <p class="hinweis">@${escape(person.handle)} · ${seit(mono.at)}</p>`
      : `<p class="leer">@${escape(person.handle)} sagt gerade nichts.</p>`,
    fuss: knopf,
  });
}

export const willkommen = ({ fehler }) =>
  layout({
    titel: config.instanceName,
    hier: null,
    body: `<h1 class="titel">Ein Beitrag.<br>Mehr hast du nicht.</h1>
      <p class="vorspann">Bis du etwas anderes hinstellst.</p>
      ${fehler ? `<p class="warnung">${escape(fehler)}</p>` : ''}
      <form id="anlegen" class="flaeche liste" method="post" action="/registrieren">
        <input type="text" name="handle" maxlength="${config.limits.handleLength}" placeholder="Name" required>
        <input type="text" name="displayName" maxlength="${config.limits.displayNameLength}" placeholder="Angezeigt als">
        <input type="password" name="password" placeholder="Passwort" required>
      </form>
      <p class="hinweis">Schon dabei? <a href="/anmelden">Anmelden</a></p>`,
    fuss: `<button class="knopf" type="submit" form="anlegen">Anfangen</button>`,
  });

export const anmelden = ({ fehler }) =>
  layout({
    titel: 'Anmelden',
    hier: null,
    zurueck: '/',
    body: `${fehler ? `<p class="warnung">${escape(fehler)}</p>` : ''}
      <form id="anmelden" class="flaeche liste" method="post" action="/anmelden">
        <input type="text" name="handle" placeholder="Name" required>
        <input type="password" name="password" placeholder="Passwort" required>
      </form>`,
    fuss: `<button class="knopf" type="submit" form="anmelden">Weiter</button>`,
  });

export const nichtGefunden = () =>
  layout({ titel: 'Nichts da', hier: null, body: '<p class="leer">Diese Seite gibt es nicht.</p>' });
