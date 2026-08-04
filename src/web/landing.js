/**
 * Die Startseite für alle, die noch nicht angemeldet sind.
 *
 * Aufbau nach der Vorlage: ein Himmel über die volle Fläche, eine große Zeile,
 * darunter genau eine Handlung — und davor Kugeln, die man anfassen kann.
 *
 * Bewusst einfarbig hell/dunkel gedacht als Plakat: Diese eine Seite folgt
 * nicht dem Systemwechsel, sondern bleibt der abendliche Himmel. Es ist die
 * einzige Seite im Produkt, die das darf, und es ist eine Entscheidung, kein
 * Versäumnis — überall sonst gilt weiter beides.
 *
 * Ohne JavaScript liegen die Kugeln still an ihrem Platz und die Seite
 * funktioniert vollständig. Das Skript fügt nur das Schieben und das Auftauchen
 * beim Scrollen hinzu.
 */

import config from '../config.js';

// Dieselben Bänder wie der Bogen und die Kugeln im Rest der App — das Plakat
// draußen und die Oberfläche drinnen sollen aus einer Welt kommen.
const PALETTE = [
  ['#8878C3', '#3A2E6B'],
  ['#0F8C8C', '#0A4444'],
  ['#3FBFB6', '#12544F'],
  ['#97C93D', '#3E5A15'],
  ['#F9CE00', '#6B5600'],
  ['#F9A61A', '#7A4A05'],
  ['#F47B20', '#75330A'],
  ['#A99AD6', '#463A80'],
];

/**
 * Die Kugeln, die beim Laden da sind.
 *
 * Sie liegen an den Rändern, zwei davon halb außerhalb — das gibt Tiefe und
 * zeigt, dass hinter dem Bildrand noch etwas liegt. Die Mittelbahn bleibt frei:
 * Überschrift und Suchfeld dürfen nie verdeckt sein, sonst ist die Seite hübsch
 * und unbenutzbar. Verschieben darf man sie trotzdem überallhin.
 *
 * Größen in vmin, damit sie auf jedem Gerät im Verhältnis bleiben.
 */
const START_ORBS = [
  { x: 96, y: 9, d: 46, p: 0 },    // oben rechts, ragt hinaus
  { x: 2, y: 90, d: 52, p: 4 },    // unten links, ragt hinaus
  { x: 90, y: 74, d: 17, p: 2 },
  { x: 13, y: 16, d: 14, p: 1 },
  { x: 70, y: 96, d: 20, p: 5 },
];

export function landingPage({ query = '' }) {
  const orbs = START_ORBS.map((o, i) => `<div class="f-orb" id="f${i}"><span class="f-body"></span></div>`).join('');

  const css = START_ORBS.map((o, i) => {
    const [light, dark] = PALETTE[o.p % PALETTE.length];
    return `#f${i}{--c1:${light};--c2:${dark};--d:${o.d}vmin;left:${o.x}%;top:${o.y}%;` +
      `--ox:${32 + ((i * 7) % 20)}%;--oy:${28 + ((i * 11) % 18)}%;--drift:${34 + i * 7}s;--delay:-${i * 5}s}`;
  }).join('\n');

  return {
    css,
    html: `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${config.instanceName} ist hier</title>
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/activity+json" href="${config.origin}">
<style nonce="__NONCE__">${css}</style>
</head>
<body class="landing">
<a class="skip-link" href="#main">Zum Inhalt springen</a>

<div class="stage">
  <div class="orbfield" data-orbs aria-hidden="true">${orbs}</div>

  <main id="main" tabindex="-1" class="stage-content">
    <h1 class="stage-title">${config.instanceName}<br>ist hier</h1>

    <form class="stage-search" method="get" action="/discover" role="search">
      <label for="q" class="visually-hidden">Kreis suchen</label>
      <input type="text" id="q" name="q" placeholder="Wonach suchst du?" value="${query}" autocomplete="off">
      <button type="submit">Suchen</button>
    </form>

    <p class="stage-links">
      <a href="/register">Konto anlegen</a>
      <span aria-hidden="true">·</span>
      <a href="/login">Anmelden</a>
    </p>

    <p class="stage-note">Kreise statt Strom. Support statt Likes. Auf offenen Protokollen,
    und dein Konto kannst du jederzeit mitnehmen.</p>
  </main>

  <p class="stage-end">Scroll weiter, dann kommen mehr. Irgendwann ist auch der Himmel zu
  Ende — hier zum Beispiel.</p>
</div>

<script src="/orbs.js" defer></script>
</body>
</html>`,
  };
}
