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

  /* Korn für alle Kugeln — als Daten-URI, also ohne eine einzige Anfrage.
     Erzeugt mit feTurbulence, damit die Flächen nach Farbe auf Papier aussehen
     statt nach gerendertem Glas. */
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E");

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
h1 { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.034em; }
h2 {
  font-size: 1.22rem;
  font-weight: 780;
  letter-spacing: -.022em;
  margin-top: 2rem;
  margin-bottom: .75rem;
}
h3 { font-size: 1.02rem; font-weight: 700; }
p, li, label { max-width: var(--measure); }
.lede { font-size: 1.02rem; }
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

/* ---------------------------------------------------------------- App-Leiste */
/* Links zurück, in der Mitte wo man ist, rechts eine Handlung. */

.appbar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: grid;
  grid-template-columns: 3rem 1fr 3rem;
  align-items: center;
  gap: .5rem;
  padding: .55rem .75rem;
  background: color-mix(in oklab, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.appbar .slot { display: flex; align-items: center; }
.appbar .slot.right { justify-content: flex-end; }
.appbar-title {
  font-family: var(--display);
  font-size: 1.02rem;
  font-weight: 750;
  letter-spacing: -.02em;
  text-align: center;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brandmark { display: inline-flex; align-items: center; padding-left: .4rem; }
.brandmark svg { display: block; }

/* Runde Icon-Schaltfläche — die zweite, leisere Handlung neben der Hauptsache. */
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
  flex: none;
  cursor: pointer;
  padding: 0;
}
.icon-btn:hover { border-color: var(--blue); color: var(--blue-deep); }
.icon-btn:focus-visible { box-shadow: var(--focus); }
.icon { display: block; }

/* Inhaltsbreite und Innenabstand — beim Umbau auf die App-Leiste war das
   verloren gegangen, und der Text klebte am linken Rand. */
main,
footer.site .inner {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.15rem 1.25rem;
}
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

/* ------------------------------------------------------------------- Plakat */
/* Die abgemeldete Startseite. Bewusst einfarbig gedacht: Diese eine Seite folgt
   nicht dem hell/dunkel-Wechsel, sondern bleibt der abendliche Himmel. Eine
   Entscheidung, kein Versäumnis — überall sonst gilt weiter beides. */

body.landing {
  margin: 0;
  min-height: 100svh;
  background: linear-gradient(178deg, #0E1A33 0%, #16294B 42%, #1E3A63 100%);
  color: #F3F5F9;
  overflow-x: hidden;

  /* Eine Serifenschrift für die eine große Zeile — wie im Vorbild. Keine
     Webschrift: die CSP lädt nichts von fremden Servern, und eine eingebettete
     Datei wöge mehr als die halbe Seite. Der Systemstapel trifft die Anmutung
     nah genug. */
  --serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
    "Times New Roman", serif;
}

/* Die Fläche ist höher als der Bildschirm: erst der Inhalt, darunter offener
   Himmel. Das gibt dem Scrollen ein Ziel — und beim Scrollen treiben weitere
   Kugeln herein. Die Höhe ist begrenzt; unendlich wäre genau das Muster, das
   dieses Produkt sonst ablehnt. */
.stage {
  position: relative;
  min-height: 190svh;
  display: grid;
  grid-template-rows: 100svh auto;
  isolation: isolate;
}
.stage-content { align-self: center; justify-self: center; }

/* Ganz unten eine Zeile, die sagt, dass hier Schluss ist. */
.stage-end {
  position: relative;
  z-index: 1;
  align-self: end;
  justify-self: center;
  padding: 0 1.5rem 3rem;
  text-align: center;
  font-size: .85rem;
  color: rgba(226, 232, 244, .6);
}

/* Die Kugeln liegen davor. Ohne Skript treiben sie nur; mit Skript kann man
   sie anfassen und beim Scrollen kommen weitere dazu. */
/* Das Feld liegt über dem Inhalt, nimmt selbst aber keine Eingaben an — sonst
   fängt es jeden Klick ab und Suchfeld und Links sind unbedienbar. Nur die
   Kugeln selbst sind anfassbar. */
.orbfield {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}
.f-orb {
  position: absolute;
  width: var(--d, 200px);
  height: var(--d, 200px);
  margin: calc(var(--d, 200px) / -2);
  cursor: grab;
  pointer-events: auto;
  animation: drift var(--drift, 40s) ease-in-out var(--delay, 0s) infinite alternate;
  touch-action: none;
}
.f-orb.is-held { cursor: grabbing; z-index: 3; }
/* Die Kugeln sind körnig und zum Rand hin verblassend — wie Farbe auf Papier,
   nicht wie gerendertes Glas. Zwei Schichten: der Farbverlauf, darüber ein
   Rauschen aus feTurbulence als Daten-URI (kein Bild vom Server, keine Anfrage).
   Die weiche Maske nimmt der Kugel die harte Kante zurück. */
.f-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-image:
    var(--grain),
    radial-gradient(circle at var(--ox, 34%) var(--oy, 28%),
      color-mix(in oklab, var(--c1) 82%, white) 0%,
      var(--c1) 26%,
      color-mix(in oklab, var(--c1) 58%, var(--c2)) 56%,
      var(--c2) 92%);
  /* Feste Korngröße, unabhängig vom Durchmesser: sonst wird das Rauschen auf
     großen Kugeln zu Flecken und auf kleinen zu Staub. */
  background-size: 160px 160px, cover;
  background-blend-mode: overlay, normal;
  /* Kein Weichzeichner mehr — er bügelt genau das Korn weg, um das es geht.
     Die weiche Kante macht die Maske. */
  filter: saturate(.9) contrast(1.02);
  opacity: .86;
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 38%, rgba(0, 0, 0, .58) 64%, rgba(0, 0, 0, .18) 84%, transparent 97%);
  mask-image: radial-gradient(circle at 50% 50%, #000 38%, rgba(0, 0, 0, .58) 64%, rgba(0, 0, 0, .18) 84%, transparent 97%);
  pointer-events: none;
}
/* Ein blasser Hof, der die Kugel in den Himmel einbettet. */
.f-orb::after {
  content: "";
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--c1) 20%, transparent) 0%, transparent 64%);
  pointer-events: none;
}
.f-orb.is-new { animation: auftauchen .9s ease-out forwards, drift 44s ease-in-out .9s infinite alternate; }

@keyframes auftauchen {
  from { opacity: 0; transform: scale(.7); }
  to   { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .f-orb, .f-orb.is-new { animation: none; }
}

/* Der Inhalt liegt dahinter — Text und Suche bleiben aber bedienbar, deshalb
   nimmt das Kugelfeld nur dort Eingaben an, wo eine Kugel liegt.
   Der Satz sitzt tiefer als die Mitte, wie im Vorbild: oben bleibt Himmel. */
.stage-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 1.5rem 2rem;
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  margin-top: 22svh;
}
.stage-title {
  font-family: var(--serif);
  font-size: clamp(3.4rem, 17vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -.02em;
  line-height: .96;
  margin: 0 0 .3rem;
  text-wrap: balance;
}

.stage-search {
  display: flex;
  align-items: center;
  gap: .4rem;
  width: min(27rem, 100%);
  background: #FFFFFF;
  border-radius: 999px;
  padding: .45rem .45rem .45rem 1.4rem;
  box-shadow: 0 20px 60px -22px rgba(0, 0, 0, .75);
  margin-top: .5rem;
}
.stage-search input[type=text] {
  flex: 1;
  min-width: 0;
  max-width: none;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: .85rem 0;
  font: inherit;
  font-size: 1.02rem;
  color: #14171D;
}
.stage-search input::placeholder { color: #6B7180; }
.stage-search input:focus { outline: none; }
.stage-search:focus-within { box-shadow: 0 0 0 3px rgba(255, 255, 255, .55), 0 18px 50px -20px rgba(0, 0, 0, .7); }
.stage-search button {
  border: 0;
  background: #16294B;
  color: #FFFFFF;
  min-height: 3rem;
  padding: .75rem 1.5rem;
  font-size: .98rem;
}
.stage-search button:hover { background: #14263F; border-color: transparent; }

.stage-links { display: flex; gap: .7rem; margin: .2rem 0 0; font-size: .9rem; }
.stage-links a { color: #DCE4F2; text-decoration-color: rgba(220, 228, 242, .5); }
.stage-links a:hover { color: #FFFFFF; }
.stage-links span { color: rgba(220, 228, 242, .45); }

.stage-note {
  margin: .25rem 0 0;
  font-size: .88rem;
  line-height: 1.6;
  color: rgba(226, 232, 244, .72);
  max-width: 26rem;
}

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* -------------------------------------------------------------------- Bühne */
/* Der Himmel vom Plakat, weitergeführt in die Inhaltsseiten: dieselbe Welt,
   nur mit Karten darauf. Die Kugeln sind hier Dekoration — kein Skript, also
   nichts zu schieben; sie liegen hinter den Karten und schauen durch. */

body.on-stage {
  background: linear-gradient(178deg, #0E1A33 0%, #16294B 46%, #1E3A63 100%);
  background-attachment: fixed;
  color: #EEF2F8;
}
body.on-stage .appbar {
  background: color-mix(in oklab, #0E1A33 78%, transparent);
  border-bottom-color: rgba(255, 255, 255, .1);
  color: #EEF2F8;
}
body.on-stage .appbar .icon-btn {
  background: rgba(255, 255, 255, .08);
  border-color: rgba(255, 255, 255, .16);
  color: #EEF2F8;
}
body.on-stage main { position: relative; z-index: 1; }
body.on-stage footer.site { background: transparent; border-top-color: rgba(255, 255, 255, .1); }
body.on-stage footer.site .inner { color: rgba(226, 232, 244, .6); }
body.on-stage footer.site a { color: #C9D8F2; }

/* Hinter den Karten, nicht davor. Ein positioniertes Element malt über
   statischen Inhalt, auch bei z-index 0 — deshalb bekommen die Karten auf der
   Bühne ausdrücklich eine eigene Ebene. */
.orbfield.stage-orbs { position: fixed; z-index: 0; }
.stage-orbs .f-orb { cursor: default; }
.stage-orbs .f-body { opacity: .62; }

body.on-stage main > *,
body.on-stage .space-head,
body.on-stage article.post,
body.on-stage .card,
body.on-stage .compose-slot,
body.on-stage .cluster,
body.on-stage .pager,
body.on-stage h2 {
  position: relative;
  z-index: 1;
}
body.on-stage .orbfield.stage-orbs { z-index: 0; }

/* Die leise Handlung auf dunklem Grund: umrandet statt grau gefüllt. */
body.on-stage .space-actions button.secondary,
body.on-stage .space-actions .button.secondary {
  background: transparent;
  border-color: rgba(255, 255, 255, .35);
  color: #EEF2F8;
}
body.on-stage .space-actions button.secondary:hover { border-color: #FFFFFF; color: #FFFFFF; background: rgba(255, 255, 255, .08); }

/* Der gesuchte Kreis: Kugel als Bild, Name in der Serifenschrift. */
.space-head {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
  padding: 1.5rem 0 2rem;
}
.space-orb {
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  margin-bottom: .3rem;
}
.space-orb .orb-mark { --od: 7rem; width: 7rem; height: 7rem; }
.space-name {
  font-family: var(--serif, ui-serif, Georgia, serif);
  font-size: clamp(2rem, 9vw, 3rem);
  font-weight: 400;
  letter-spacing: -.02em;
  line-height: 1.05;
  margin: 0;
}
.space-meta { font-size: .74rem; color: rgba(226, 232, 244, .66); margin: 0; letter-spacing: .08em; text-transform: uppercase; }
.space-purpose { margin: .4rem 0 0; color: rgba(232, 238, 248, .86); max-width: 30ch; }
.space-actions { display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; justify-content: center; margin-top: .8rem; }
.stage-hint { font-size: .84rem; color: rgba(226, 232, 244, .6); margin: .6rem 0 0; max-width: 34ch; }
.stage-hint a { color: #C9D8F2; }

/* Karten liegen hell auf dem Himmel. */
body.on-stage .card,
body.on-stage article.post,
body.on-stage .compose-slot > summary {
  background: rgba(255, 255, 255, .96);
  color: #14171D;
  border-color: rgba(255, 255, 255, .5);
  box-shadow: 0 20px 48px -26px rgba(0, 0, 0, .8);
}
body.on-stage article.post { border-radius: var(--radius-l); padding: 1.15rem; }
body.on-stage .card a, body.on-stage article.post a { color: var(--blue); }
body.on-stage .meta, body.on-stage .muted, body.on-stage .support-note { color: #5E636E; }
body.on-stage .pager .end { color: rgba(226, 232, 244, .6); }
body.on-stage .compose-slot > summary { border-style: dashed; color: #5E636E; }

/* Das Suchfeld wandert vom Plakat mit — dieselbe weiße Pille. */
.stage-search.find { margin: .5rem auto 1.5rem; position: relative; z-index: 1; }
h2.on-sky { color: #EEF2F8; position: relative; z-index: 1; margin-top: 1.5rem; }
.stage-hint.centered { margin-left: auto; margin-right: auto; text-align: center; max-width: none; }
body.on-stage .tile {
  background: rgba(255, 255, 255, .96);
  color: #14171D;
  border-color: rgba(255, 255, 255, .5);
  box-shadow: 0 18px 44px -26px rgba(0, 0, 0, .8);
}
body.on-stage .tile .sub, body.on-stage .tile .kind, body.on-stage .tile .why { color: #5E636E; }
body.on-stage .cluster { position: relative; z-index: 1; }

/* Kommentare unter dem Beitrag: leicht abgesetzt, nicht als eigene Karte. */
.comments {
  margin-top: .9rem;
  padding-top: .85rem;
  border-top: 1px solid var(--line-soft);
  display: flex;
  flex-direction: column;
  gap: .8rem;
}
.comment { display: flex; gap: .6rem; align-items: flex-start; }
.comment .faces span { width: 24px; height: 24px; font-size: .6rem; }
.comment .c-head { margin: 0; font-size: .85rem; display: flex; gap: .45rem; align-items: baseline; flex-wrap: wrap; }
.comment .c-body { margin: .1rem 0 0; font-size: .92rem; line-height: 1.5; overflow-wrap: anywhere; }
.more-comments { margin: 0; font-size: .85rem; }

/* -------------------------------------------------------------------- Himmel */
/* Eine Fläche, die größer ist als der Bildschirm. Geschoben wird sie vom Browser
   selbst — Finger, Trackpad, Pfeiltasten. Dafür braucht es kein Skript. */

.sky-intro { margin-bottom: .9rem; }
.sky-intro h1 { margin-bottom: .3rem; }

.sky {
  position: relative;
  overflow: auto;
  overscroll-behavior: contain;
  height: min(74vh, 40rem);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background:
    radial-gradient(90% 70% at 22% 12%, color-mix(in oklab, var(--blue) 9%, transparent), transparent 70%),
    radial-gradient(80% 60% at 84% 82%, color-mix(in oklab, var(--forum) 9%, transparent), transparent 70%),
    var(--surface);
  cursor: grab;
  touch-action: pan-x pan-y;
  scrollbar-width: none;
}
.sky::-webkit-scrollbar { display: none; }
.sky:active { cursor: grabbing; }
.sky:focus-visible { box-shadow: var(--focus); }

/* Die eigentliche Fläche: knapp doppelt so breit wie das Fenster, damit es
   wirklich etwas zu schieben gibt — aber nicht endlos. Der Himmel hat Ränder. */
.field {
  position: relative;
  /* Reichlich Fläche: Wolken brauchen Abstand, sonst überlagern sich ihre
     Beschriftungen. Und es soll wirklich etwas zu schieben geben. */
  width: 210%;
  height: 200%;
  min-width: 40rem;
  min-height: 44rem;
}
/* Auf breiten Schirmen passt mehr ins Bild, also braucht die Fläche weniger
   Übergröße — sonst schiebt man lange durch Leere. */
@media (min-width: 60rem) {
  .field { width: 145%; height: 135%; }
  .sky { height: min(68vh, 34rem); }
}

.cloud {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: max(var(--d), 7.5rem);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  text-decoration: none;
  color: var(--ink);
  animation: drift var(--drift, 30s) ease-in-out var(--delay, 0s) infinite alternate;
}

/* Der Körper: ein heller Hof mit dunklerem Kern, weich gezeichnet. Kein
   Glanzlicht, keine Spiegelung — die Wolke ist Atmosphäre, kein Objekt.
   Die Beschriftung liegt darunter, nicht darin: Text im Unschärfefeld ist
   hübsch und unlesbar. */
/* Der Durchmesser skaliert mit vmin, wird aber gedeckelt: auf einem breiten
   Schirm dürfen Wolken nicht zu Planeten werden. */
.cloud .orb {
  width: clamp(4.5rem, var(--d), 9.5rem);
  height: clamp(4.5rem, var(--d), 9.5rem);
  position: relative;
  display: block;
  flex: none;
}
.cloud .body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-size: 160px 160px, cover, cover;
  background-blend-mode: overlay, normal, normal;
  background-image:
    var(--grain),
    radial-gradient(circle at 38% 32%, var(--c2) 0%, transparent 48%),
    radial-gradient(circle at 52% 55%, var(--c1) 0%, color-mix(in oklab, var(--c1) 50%, transparent) 54%, transparent 76%);
  filter: blur(5px);
  opacity: .95;
  transition: transform .35s ease, opacity .35s ease, filter .35s ease;
}
.cloud.far .body { filter: blur(10px); opacity: .55; }

/* Private Kreise tragen dieselbe geschlossene zweite Schale wie ihr Zeichen. */
.cloud.closed .orb::before {
  content: "";
  position: absolute;
  inset: 16%;
  border-radius: 50%;
  border: 1.5px solid color-mix(in oklab, var(--c1) 75%, transparent);
  opacity: .85;
  z-index: 1;
}

.cloud .tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .1rem;
  text-align: center;
  max-width: 11rem;
  padding: .25rem .5rem;
  border-radius: var(--radius-m);
  background: color-mix(in oklab, var(--surface) 92%, transparent);
}
.cloud .name {
  font-family: var(--display);
  font-weight: 750;
  font-size: .9rem;
  letter-spacing: -.015em;
  line-height: 1.2;
  color: var(--ink);
  text-decoration: none;
}
/* Der Namenslink deckt die ganze Wolke ab — man trifft sie überall. */
.cloud .name::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.cloud .name:hover { color: var(--blue-deep); }

/* Die Aktion liegt darüber, damit sie eigenständig anklickbar bleibt. */
.cloud .act .over { position: relative; z-index: 2; }
.cloud.far .name { opacity: .9; }
.cloud .line, .cloud .when {
  font-family: var(--mono);
  font-size: .6rem;
  letter-spacing: .04em;
  color: var(--ink-muted);
}
.cloud .fresh {
  font-family: var(--mono);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .06em;
  color: var(--blue-deep);
}

/* Die Vorschau klappt bei Zeiger oder Tastaturfokus auf — ohne Klick. Der Klick
   ist erst nötig, wenn man wirklich hineingeht. Das äußere Element ist ein
   einzeiliges Grid, dessen einzige Zeile von 0fr auf 1fr wächst; deshalb liegt
   der ganze Inhalt in genau einem Kind. */
.cloud .peek {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .3s ease, opacity .25s ease;
  opacity: 0;
  width: 100%;
}
.cloud .peek-inner {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: .25rem;
  font-size: .76rem;
  line-height: 1.45;
  text-align: left;
}
.cloud:hover .peek, .cloud:focus-within .peek { grid-template-rows: 1fr; opacity: 1; }
.cloud:hover, .cloud:focus-within { z-index: 3; }
.cloud:hover .tag, .cloud:focus-within .tag {
  background: var(--surface);
  box-shadow: var(--shadow);
  max-width: 15.5rem;
  width: max-content;
}
.cloud:hover .body, .cloud:focus-within .body { transform: scale(1.1); opacity: 1; filter: blur(3px); }
.cloud:focus-within .tag { box-shadow: var(--focus); }

.cloud .peek .purpose { color: var(--ink-muted); }
.cloud .peek .quote { color: var(--ink); }
.cloud .peek .act { font-weight: 640; color: var(--blue-deep); margin-top: .15rem; }
.cloud .peek .sep { opacity: .5; margin: 0 .3rem; }

@keyframes drift {
  from { transform: translate3d(-.7vmin, .5vmin, 0); }
  to   { transform: translate3d(.7vmin, -.6vmin, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .cloud { animation: none; }
  .cloud .body, .cloud .peek { transition: none; }
}
body.reduced-motion .cloud { animation: none; }
body.reduced-motion .cloud .body, body.reduced-motion .cloud .peek { transition: none; }

/* Reizarm: die Wolken werden zu ruhigen Scheiben ohne Farbverlauf. */
body.low-stimulus .cloud .body {
  background: color-mix(in oklab, var(--ink-muted) 22%, transparent);
  filter: blur(3px);
}
body.low-stimulus .cloud { animation: none; }

.sky-list { margin-top: 1rem; }
.sky-list > summary {
  cursor: pointer;
  font-weight: 640;
  color: var(--ink-muted);
  padding: .5rem 0;
}
.sky-list ul { list-style: none; padding: 0; margin: .5rem 0 0; display: flex; flex-direction: column; gap: .5rem; }
.sky-list li { display: flex; gap: .5rem; align-items: baseline; flex-wrap: wrap; }

/* -------------------------------------------------------------------- Profil */

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: .35rem;
  padding: 1.5rem 1.25rem 1.75rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  margin-bottom: 1rem;
}
.profile .avatar {
  display: grid;
  place-items: center;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--line);
  margin-bottom: .4rem;
}
.profile-name { font-family: var(--display); font-size: 1.4rem; font-weight: 780; letter-spacing: -.025em; margin: 0; }
.profile-handle { font-size: .82rem; color: var(--ink-muted); margin: 0; }
.profile-bio { margin: .5rem 0 0; max-width: 30ch; }
.profile-actions { width: 100%; max-width: 22rem; margin-top: 1rem; justify-content: center; }
.profile-actions form { display: contents; }
.profile-actions .grow button, .profile-actions .grow { width: 100%; }

/* Zahlen groß, Bezeichnung leise darunter — und wo nichts freigegeben ist,
   steht das da, statt eine Null zu behaupten. */
.stats {
  display: flex;
  gap: 1.75rem;
  margin-top: .9rem;
  justify-content: center;
}
.stat { display: flex; flex-direction: column; align-items: center; gap: .1rem; }
.stat .num {
  font-family: var(--display);
  font-size: 1.15rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.02em;
}
.stat .lbl { font-size: .72rem; color: var(--ink-muted); }
.stats-private { margin-top: .9rem; }

/* Reiter: der aktive kräftig, die anderen leise. */
.tabs {
  display: flex;
  gap: 1.2rem;
  align-items: baseline;
  padding: 0 .25rem .75rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 1rem;
}
.tab-item {
  font-family: var(--display);
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -.015em;
  color: var(--ink-muted);
  text-decoration: none;
  position: relative;
  padding-bottom: .75rem;
  margin-bottom: -.75rem;
}
.tab-item.is-active { color: var(--ink); }
.tab-item.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--blue);
}
.tab-item:hover { color: var(--ink); }

/* --------------------------------------------------------- Hilfsklassen */
.flush { margin: 0; }
.tight { margin: .7rem 0 0; }
.spaced { margin-top: 1rem; }
.profile-head { display: flex; gap: .6rem; align-items: center; margin-bottom: .6rem; }
.request-row { display: flex; gap: .6rem; align-items: center; margin-bottom: .5rem; }

/* ------------------------------------------------------------------ Cluster */
/* Ein Bento-Raster: gleiche Bildsprache wie im Himmel, nur geordnet. Die erste
   Kachel darf groß sein, wenn sie etwas zu zeigen hat. */

.cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .8rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 46rem) { .cluster { grid-template-columns: repeat(3, 1fr); gap: 1rem; } }

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .55rem;
  padding: 1rem .9rem .9rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  text-decoration: none;
  color: var(--ink);
  overflow: hidden;
  transition: border-color .2s ease, transform .2s ease;
}
.tile:hover { border-color: var(--blue); }
.tile:active { transform: scale(.985); }
.tile:focus-visible { box-shadow: var(--focus); border-color: var(--blue); }

/* Die Kugel: derselbe weiche Körper wie am Himmel, nur in Kachelgröße. */
.tile-orb {
  display: grid;
  place-items: center;
  height: 7rem;
  margin: -.3rem 0 .1rem;
}
.orb-mark {
  position: relative;
  display: block;
  width: var(--od, 64px);
  height: var(--od, 64px);
}
/* Aufbau wie im Vorbild: ein leuchtender Hof, darin ein versetzter dunkler
   Kern, beides weich auslaufend. Zwei Verläufe genügen — mehr wird Matsch. */
.orb-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-size: 160px 160px, cover;
  background-blend-mode: overlay, normal;
  background-image:
    var(--grain),
    radial-gradient(circle at var(--ox, 36%) var(--oy, 30%),
      var(--c2) 0%,
      color-mix(in oklab, var(--c2) 70%, transparent) 22%,
      transparent 52%),
    radial-gradient(circle at 50% 52%,
      color-mix(in oklab, var(--c1) 92%, white) 0%,
      var(--c1) 38%,
      color-mix(in oklab, var(--c1) 45%, transparent) 62%,
      transparent 78%);
  filter: saturate(.94);
  opacity: .92;
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 42%, rgba(0, 0, 0, .6) 68%, transparent 94%);
  mask-image: radial-gradient(circle at 50% 50%, #000 42%, rgba(0, 0, 0, .6) 68%, transparent 94%);
  transition: transform .25s ease, opacity .25s ease;
}
.tile:hover .orb-body { transform: scale(1.06); opacity: 1; }

/* Private Kreise tragen die geschlossene zweite Schale — wie überall sonst. */
.tile.closed .orb-mark::after {
  content: "";
  position: absolute;
  inset: 17%;
  border-radius: 50%;
  border: 1.5px solid color-mix(in oklab, var(--c1) 75%, transparent);
  opacity: .85;
}

.tile-text { display: flex; flex-direction: column; gap: .25rem; }
.tile .label {
  font-family: var(--display);
  font-weight: 750;
  font-size: .98rem;
  letter-spacing: -.018em;
  line-height: 1.25;
}
.tile .why { font-size: .86rem; color: var(--ink-muted); line-height: 1.45; }
.tile .sub { font-size: .76rem; color: var(--ink-muted); }
.tile .foot-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .5rem;
  margin-top: auto;
  padding-top: .55rem;
  flex-wrap: wrap;
}
.tile .kind {
  position: absolute;
  top: .8rem;
  right: .85rem;
  font-family: var(--mono);
  font-size: .58rem;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink-muted);
  z-index: 1;
}
.tile .fresh {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  font-family: var(--mono);
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .06em;
  color: var(--blue-deep);
}
.tile .fresh::before {
  content: "";
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--blue);
}

/* Die große Kachel: zwei Spalten breit, Kugel links, Text rechts. */
.tile.hero {
  grid-column: span 2;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas: "orb text" "orb foot";
  align-items: center;
  gap: .2rem 1rem;
  padding: 1.1rem;
  background:
    radial-gradient(110% 80% at 12% 20%, var(--blue-tint) 0%, transparent 62%),
    var(--surface);
}
.tile.hero .tile-orb { grid-area: orb; height: auto; margin: 0; }
.tile.hero .tile-text { grid-area: text; }
.tile.hero .foot-line { grid-area: foot; padding-top: .4rem; }
.tile.hero .label { font-size: 1.15rem; }
.tile.hero .preview {
  font-size: .85rem;
  line-height: 1.5;
  margin-top: .4rem;
  padding-left: .65rem;
  border-left: 2px solid var(--line);
  color: var(--ink);
}
.tile.hero .preview strong { font-weight: 660; }
@media (min-width: 46rem) { .tile.hero { grid-column: span 2; } }

/* Reizarm: die Kugeln werden zu ruhigen Scheiben. */
body.low-stimulus .orb-body {
  background: color-mix(in oklab, var(--ink-muted) 24%, transparent);
  filter: blur(2px);
}

.search-card { margin-bottom: 1.5rem; }
.search-card .actions-row { margin-top: .9rem; }

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
  justify-content: center;
  gap: .5rem;
  font: inherit;
  font-weight: 680;
  font-size: .95rem;
  line-height: 1.2;
  min-height: 2.9rem;
  padding: .8rem 1.4rem .8rem 1.15rem;
  border-radius: 999px;
  border: 1.5px solid var(--ember);
  background: var(--ember-tint);
  color: var(--ember-deep);
  cursor: pointer;
  transition: background .18s ease, transform .18s ease;
}
.support:hover { background: color-mix(in oklab, var(--ember) 22%, var(--surface)); }
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

/* Schaltflächen sind volle Pillen: groß genug für den Daumen, mit klarer
   Rangfolge — eine gefüllte Hauptsache, alles andere umrandet oder leise. */
button, .button {
  font: inherit;
  font-weight: 680;
  font-size: .95rem;
  line-height: 1.2;
  padding: .8rem 1.5rem;
  border-radius: 999px;
  border: 1.5px solid var(--blue);
  background: var(--blue);
  color: var(--blue-ink);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-height: 2.9rem;
  transition: transform .15s ease, background .2s ease;
}
button:hover, .button:hover { background: var(--blue-deep); border-color: var(--blue-deep); }
button:active, .button:active { transform: scale(.97); }
button.secondary, .button.secondary {
  background: var(--surface);
  border-color: var(--line);
  color: var(--ink);
}
button.secondary:hover, .button.secondary:hover {
  background: var(--surface);
  border-color: var(--blue);
  color: var(--blue-deep);
}
button.quiet, .button.quiet {
  background: transparent;
  border-color: transparent;
  color: var(--ink-muted);
  padding: .5rem .8rem;
  min-height: 0;
  font-weight: 640;
}
button.quiet:hover { background: var(--blue-tint); color: var(--blue-deep); }
/* Eine Hauptsache soll auf dem Handy die Breite bekommen, die ihr zusteht. */
.actions-row { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
.actions-row .grow { flex: 1 1 10rem; }

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
