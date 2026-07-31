/**
 * lamb — Stylesheet.
 *
 * Umsetzung von design/lamb-tokens.css im laufenden Client. Als echte Datei
 * ausgeliefert, damit die CSP Inline-Styles verbieten kann.
 *
 * Drei Systemregeln, die hier eingehalten werden:
 *   1. --ember erscheint ausschliesslich an Support-Elementen.
 *   2. --forum bleibt Youth-Panel-Kontexten vorbehalten (noch nicht gebaut).
 *   3. Gruen kommt in der Marke nicht vor — bestaetigte Zustaende tragen Blau.
 *
 * Drei Body-Klassen tragen Nutzereinstellungen in die visuelle Ebene:
 *   .reduced-motion — keine Uebergaenge, keine Animation
 *   .low-stimulus   — entsaettigte Palette ohne Akzentfarben
 *   .plain-language — mehr Zeilenabstand, kuerzere Zeilenlaenge
 */

export const STYLESHEET = `
:root {
  color-scheme: light dark;

  --fog:        #F2F3F5;
  --surface:    #FFFFFF;
  --surface-2:  #FAFAFC;
  --ink:        #14171D;
  --ink-muted:  #5E636E;
  --line:       #DCDDE1;
  --line-soft:  #E9EAEE;

  --blue:       #2B4C9B;
  --blue-deep:  #1C3468;
  --blue-tint:  #E7ECF7;
  --blue-ink:   #FFFFFF;
  --ember:      #DC6B45;
  --ember-deep: #A8461F;
  --ember-tint: #FBEDE7;
  --ember-ink:  #FFFFFF;
  --forum:      #5B57C4;
  --forum-tint: #ECEBF9;

  --warn:       #A96613;
  --crit:       #A8322A;

  --radius-s: 10px;
  --radius-m: 16px;
  --radius-l: 24px;

  --display: ui-sans-serif, "Inter Tight", "Segoe UI", Roboto, sans-serif;
  --body: system-ui, -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  --shadow: 0 1px 2px rgba(20,23,29,.05), 0 8px 24px -12px rgba(20,23,29,.18);
  --focus: 0 0 0 3px var(--blue-tint);
  --measure: 62ch;
}

@media (prefers-color-scheme: dark) {
  :root {
    --fog:        #101319;
    --surface:    #171B23;
    --surface-2:  #1D222B;
    --ink:        #E8EAEE;
    --ink-muted:  #9AA1AF;
    --line:       #2A303B;
    --line-soft:  #222831;
    --blue:       #7EA0E8;
    --blue-deep:  #A8C0F2;
    --blue-tint:  #1B2740;
    --blue-ink:   #0E1420;
    --ember:      #F08A5E;
    --ember-deep: #F7B294;
    --ember-tint: #33201A;
    --ember-ink:  #22140F;
    --forum:      #9A95F0;
    --forum-tint: #22203D;
    --warn:       #D99A45;
    --crit:       #E0776C;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px -14px rgba(0,0,0,.7);
    --focus: 0 0 0 3px #24314D;
  }
}

/* Reizarm: die Akzente weichen entsaettigten Neutralen, die Struktur bleibt. */
body.low-stimulus {
  --blue: #4C525C;
  --blue-deep: #33383F;
  --blue-tint: #EDEEF0;
  --ember: #8A7A72;
  --ember-deep: #5D504A;
  --ember-tint: #F0EDEB;
  --forum: #5C5A66;
  --forum-tint: #EEEEF1;
}
@media (prefers-color-scheme: dark) {
  body.low-stimulus {
    --blue: #A6ADBA; --blue-deep: #C4CAD4; --blue-tint: #262B33; --blue-ink: #14171D;
    --ember: #B9A79E; --ember-deep: #D3C4BC; --ember-tint: #2A2522; --ember-ink: #14171D;
    --forum: #A9A6B8; --forum-tint: #272630;
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--fog);
  color: var(--ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
body.plain-language { line-height: 1.9; --measure: 52ch; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
body.reduced-motion *, body.reduced-motion *::before, body.reduced-motion *::after {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}

/* --------------------------------------------------------------- Typografie */

h1, h2, h3 {
  font-family: var(--display);
  margin: 0;
  line-height: 1.14;
  text-wrap: balance;
  letter-spacing: -0.024em;
}
h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.032em; }
h2 { font-size: 1.2rem; font-weight: 750; margin-top: 2rem; }
h3 { font-size: 1.02rem; font-weight: 700; }
p, li, label { max-width: var(--measure); }
p { margin: 0 0 .75rem; }

a { color: var(--blue); text-underline-offset: 2px; }
a:hover { color: var(--blue-deep); }

.muted, .meta { color: var(--ink-muted); }
small, .small { font-size: .875rem; }

/* Die Mono-Ebene zeigt, was das System weiss — nicht, was Menschen sagen. */
.mono, time, .eyebrow {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
.eyebrow {
  font-size: .72rem;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ------------------------------------------------------------------- Layout */

.skip-link {
  position: absolute;
  left: -9999px;
  background: var(--blue);
  color: var(--blue-ink);
  padding: .6rem 1rem;
  border-radius: 0 0 var(--radius-s) 0;
  font-weight: 650;
}
.skip-link:focus { left: 0; top: 0; z-index: 20; }

:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 6px; }

header.site {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
header.site .inner,
main,
footer.site .inner {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.1rem 1.25rem;
}
header.site .inner {
  display: flex;
  gap: .75rem;
  align-items: center;
  flex-wrap: wrap;
  padding: .7rem 1rem;
}
@media (min-width: 40rem) { header.site .inner { padding: 1.1rem 1.25rem; gap: 1rem; } }
.brandmark {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  font-family: var(--display);
  font-weight: 800;
  letter-spacing: -.03em;
  font-size: 1.1rem;
  color: var(--ink);
  text-decoration: none;
}
.brandmark svg { display: block; }

nav.site { margin-left: auto; }
nav.site ul {
  list-style: none;
  display: flex;
  gap: .15rem;
  margin: 0;
  padding: 0;
  align-items: center;
  flex-wrap: wrap;
}
nav.site a, nav.site button {
  text-decoration: none;
  color: var(--ink-muted);
  font-weight: 620;
  font-size: .82rem;
  padding: .3rem .5rem;
  border-radius: 999px;
}
@media (min-width: 40rem) { nav.site a, nav.site button { font-size: .92rem; padding: .4rem .7rem; } }
nav.site a:hover { background: var(--blue-tint); color: var(--blue-deep); }

main { padding-bottom: 4rem; }

/* -------------------------------------------------------------------- Karten */

.card, article.post, .panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  padding: 1.25rem;
  margin: 0 0 1rem;
  box-shadow: var(--shadow);
}
.card.flat, article.post { box-shadow: none; }

/* ------------------------------------------------------------------ Cluster */
/* Ein Raster aus Räumen, kein Fluss aus Beiträgen. Mobile zuerst: zwei Spalten
   ab dem kleinsten Gerät, damit die Übersicht auch in der Hand eine Übersicht
   bleibt und nicht zur Liste zerfällt. */

.cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .75rem;
  margin-bottom: 1.75rem;
}
@media (min-width: 40rem) { .cluster { grid-template-columns: repeat(3, 1fr); gap: 1rem; } }

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  padding: .9rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  text-decoration: none;
  color: var(--ink);
  min-height: 9.5rem;
  transition: border-color .18s ease, transform .18s ease;
}
.tile:hover { border-color: var(--blue); }
.tile:active { transform: scale(.985); }
.tile:focus-visible { box-shadow: var(--focus); border-color: var(--blue); }

.tile .sigil { display: block; margin: -.1rem 0 .2rem -.2rem; }
.tile-text { display: flex; flex-direction: column; gap: .25rem; }
.tile .label { font-family: var(--display); font-weight: 700; letter-spacing: -.015em; line-height: 1.25; }
.tile .sub { font-size: .78rem; color: var(--ink-muted); }
.tile .foot-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .5rem;
  margin-top: auto;
  padding-top: .5rem;
  flex-wrap: wrap;
}
.tile .kind {
  position: absolute;
  top: .75rem;
  right: .75rem;
  font-family: var(--mono);
  font-size: .6rem;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* Die Hero-Kachel: der Kreis, in dem gerade etwas passiert. Zwei Spalten breit,
   damit die Übersicht eine Blickrichtung hat statt gleichförmig zu flimmern. */
.tile.hero {
  grid-column: span 2;
  min-height: 10rem;
  padding: 1.1rem;
  background:
    radial-gradient(115% 85% at 88% 6%, var(--blue-tint) 0%, transparent 60%),
    var(--surface);
}
.tile.hero .sigil { position: absolute; top: .9rem; right: .9rem; margin: 0; opacity: .95; }
.tile.hero .tile-text { max-width: 62%; margin-top: .2rem; }
@media (min-width: 40rem) { .tile.hero .tile-text { max-width: 78%; } }
.tile.hero .label { font-size: 1.35rem; }
.tile.hero .why { font-size: .88rem; color: var(--ink-muted); line-height: 1.45; }
/* Beitragsvorschau statt Leerraum: Die Hero-Kachel zeigt, was dort gerade
   gesagt wurde — Beiträge mit Inhaltshinweis nie, die öffnet man bewusst. */
.tile.hero .preview {
  font-size: .9rem;
  line-height: 1.5;
  color: var(--ink);
  margin-top: .5rem;
  padding-left: .7rem;
  border-left: 2px solid var(--line);
}
.tile.hero .preview strong { font-weight: 650; }
@media (min-width: 40rem) { .tile.hero { grid-column: span 2; grid-row: span 2; min-height: 14rem; } }

/* Frisches wird markiert, nicht gezählt: ein Punkt, kein Dauerbadge. */
.tile .fresh {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-family: var(--mono);
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .06em;
  color: var(--ember-deep);
}
.tile .fresh::before {
  content: "";
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--ember);
}

.faces .more {
  background: var(--surface);
  color: var(--ink-muted);
  border-color: var(--line);
  font-size: .6rem;
}

/* Kreis-Kopfzeile auf der Raumseite */
.room {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}
.room .top { display: flex; align-items: flex-start; justify-content: space-between; gap: .6rem; }
.room h3 { font-size: 1rem; }
.room h3 a { text-decoration: none; color: var(--ink); }
.room h3 a:hover { color: var(--blue); }
.room .why { font-size: .88rem; color: var(--ink-muted); margin: 0; }
.room .foot { display: flex; align-items: center; justify-content: space-between; gap: .6rem; margin-top: auto; flex-wrap: wrap; }

/* ------------------------------------------------------------ Kreis-Kopfzeile */

.circle-head {
  display: flex;
  gap: .9rem;
  align-items: flex-start;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  padding: 1.1rem;
  margin-bottom: 1rem;
}
.circle-head .sigil { flex: none; margin-top: -.15rem; }
.circle-head-text { display: flex; flex-direction: column; gap: .35rem; min-width: 0; }
.circle-head h1 { font-size: 1.4rem; }
.circle-head p { margin: 0; }
.circle-actions { display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; margin-top: .5rem; }

/* Eingeklapptes Schreibfeld — nativ, ohne Skript. */
.compose-slot { margin-bottom: 1rem; }
.compose-slot > summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .8rem 1.1rem;
  background: var(--surface);
  border: 1px dashed var(--line);
  border-radius: var(--radius-l);
  font-weight: 640;
  color: var(--ink-muted);
}
.compose-slot > summary::-webkit-details-marker { display: none; }
.compose-slot > summary::before {
  content: "+";
  font-size: 1.1rem;
  line-height: 1;
  color: var(--blue);
  font-weight: 700;
}
.compose-slot > summary:hover { border-color: var(--blue); color: var(--ink); }
.compose-slot > summary:focus-visible { box-shadow: var(--focus); }
.compose-slot[open] > summary { margin-bottom: .6rem; border-style: solid; }

/* ------------------------------------------------------- Aktionsleiste unten */
/* In Daumenreichweite. Drei Ziele, mehr nicht — eine Leiste, die alles anbietet,
   hilft bei nichts. */

.dock {
  position: fixed;
  left: 50%;
  bottom: max(1rem, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .4rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 6px 28px -8px rgba(20, 23, 29, .28);
}
@media (prefers-color-scheme: dark) { .dock { box-shadow: 0 8px 30px -8px rgba(0, 0, 0, .8); } }

.dock a, .dock button {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem .9rem;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  font-weight: 640;
  font-size: .86rem;
  text-decoration: none;
}
.dock a:hover { background: var(--blue-tint); color: var(--blue-deep); }
.dock a[aria-current="page"] { color: var(--ink); }
.dock .compose {
  background: var(--blue);
  color: var(--blue-ink);
  width: 3rem;
  height: 3rem;
  padding: 0;
  justify-content: center;
  font-size: 1.4rem;
  line-height: 1;
}
.dock .compose:hover { background: var(--blue-deep); color: var(--blue-ink); }
.dock a:focus-visible { box-shadow: var(--focus); }

/* Platz, damit die Leiste nie den letzten Beitrag verdeckt. */
body.has-dock main { padding-bottom: 6.5rem; }

/* -------------------------------------------------------------------- Chips */

.chip {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-family: var(--mono);
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: .3rem .6rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink-muted);
}
.chip .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.chip.blue { background: var(--blue-tint); border-color: transparent; color: var(--blue-deep); }
.chip.ember { background: var(--ember-tint); border-color: transparent; color: var(--ember-deep); }

/* ------------------------------------------------------------------ Beitrag */

article.post { display: flex; flex-direction: column; gap: .7rem; }
article.post .who {
  display: flex;
  gap: .55rem;
  align-items: center;
  flex-wrap: wrap;
}
article.post .who .name { font-weight: 680; }
article.post .who .handle,
article.post .who time { font-size: .8rem; color: var(--ink-muted); }
article.post .body { white-space: pre-wrap; overflow-wrap: anywhere; }
article.post figure { margin: .5rem 0 0; }
article.post img { max-width: 100%; border-radius: var(--radius-m); display: block; }
article.post figcaption { font-size: .82rem; color: var(--ink-muted); margin-top: .35rem; }
article.post details summary {
  cursor: pointer;
  font-weight: 650;
  padding: .5rem .75rem;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
}
article.post details[open] summary { margin-bottom: .75rem; }
article.post .actions {
  display: flex;
  gap: .7rem;
  align-items: center;
  flex-wrap: wrap;
  padding-top: .7rem;
  border-top: 1px solid var(--line-soft);
}

/* Presence: Menschen als Ringe, Gruppe vor Zahl. */
.faces { display: flex; align-items: center; }
.faces span {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  margin-left: -8px;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: .64rem;
  font-weight: 700;
  color: var(--blue-ink);
  background: var(--blue);
}
.faces span:first-child { margin-left: 0; }

/* ------------------------------------------------------------------ Support */
/* Der einzige Ort im Produkt, an dem Ember erscheint. */

.support {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  font: inherit;
  font-weight: 650;
  font-size: .92rem;
  padding: .5rem 1rem .5rem .8rem;
  border-radius: 999px;
  border: 1.5px solid var(--ember);
  background: transparent;
  color: var(--ember-deep);
  cursor: pointer;
  transition: background .18s ease, transform .18s ease;
}
.support:hover { background: var(--ember-tint); }
.support:active { transform: scale(.97); }
.support:focus-visible { box-shadow: 0 0 0 3px var(--ember-tint); }
.support[aria-pressed="true"] {
  background: var(--ember);
  border-color: var(--ember);
  color: var(--ember-ink);
}
.support svg { width: 17px; height: 17px; flex: none; }
.support-note { font-size: .84rem; color: var(--ink-muted); }

/* ----------------------------------------------------------------- Buttons */

button, .button {
  font: inherit;
  font-weight: 650;
  font-size: .92rem;
  padding: .5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--blue);
  background: var(--blue);
  color: var(--blue-ink);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
button.secondary, .button.secondary {
  background: var(--surface);
  border-color: var(--line);
  color: var(--ink);
}
button.secondary:hover, .button.secondary:hover { border-color: var(--blue); color: var(--blue-deep); }
button.quiet {
  background: transparent;
  border-color: transparent;
  color: var(--ink-muted);
  padding: .4rem .6rem;
}

/* ----------------------------------------------------------------- Formulare */

form { margin: 0; }
fieldset {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  margin: 0 0 1rem;
  padding: .5rem 1.1rem 1.1rem;
}
legend { font-family: var(--display); font-weight: 700; padding: 0 .4rem; }
label { display: block; margin: .9rem 0 .3rem; font-weight: 640; }
label.inline { display: flex; gap: .6rem; align-items: flex-start; font-weight: 400; margin: .7rem 0; }
label.inline span { display: flex; flex-direction: column; }

input[type=text], input[type=password], textarea, select {
  width: 100%;
  max-width: var(--measure);
  padding: .6rem .75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  background: var(--surface-2);
  color: var(--ink);
  font: inherit;
}
textarea { min-height: 7.5rem; resize: vertical; }
input:focus-visible, textarea:focus-visible, select:focus-visible { border-color: var(--blue); }

.hint { font-size: .86rem; color: var(--ink-muted); margin-top: .25rem; font-weight: 400; }

/* --------------------------------------------------------------- Feed-Modus */

.feed-explainer {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--blue);
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
  padding: .9rem 1.1rem;
  margin-bottom: 1.25rem;
}
.feed-explainer p { margin-bottom: .6rem; }

.notice {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--warn);
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
  padding: .9rem 1.1rem;
  margin-bottom: 1rem;
}
.notice.ember { border-left-color: var(--ember); }
.error { color: var(--crit); font-weight: 650; }

/* Blaettern ist eine bewusste Handlung — es gibt keinen Scroll-Listener. */
.pager { margin: 1.5rem 0 0; text-align: center; }
.pager .end { color: var(--ink-muted); font-size: .9rem; }

/* ------------------------------------------------------------------ Tabellen */

.table-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-m); background: var(--surface); }
table { border-collapse: collapse; width: 100%; }
caption { text-align: left; padding: .8rem 1rem; font-weight: 650; }
th, td { text-align: left; padding: .7rem 1rem; border-bottom: 1px solid var(--line-soft); vertical-align: top; font-size: .92rem; }
th { font-family: var(--mono); font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-muted); font-weight: 600; }
tr:last-child td { border-bottom: 0; }
td .mono { font-variant-numeric: tabular-nums; }

footer.site { border-top: 1px solid var(--line); margin-top: 2.5rem; background: var(--surface); }
footer.site .inner { font-size: .88rem; color: var(--ink-muted); }
footer.site p { margin-bottom: .5rem; }
`;
