/**
 * Das Aussehen von mono, als eine Datei ausgeliefert.
 *
 * Vorbild ist die Referenz: iOS-Standard, sehr zurueckhaltend. Ein Titel oben,
 * eine Flaeche in der Mitte, ein schwarzer Knopf unten. Was schwebt, ist Glas —
 * unscharfer Hintergrund, duenne Kante, weicher Schatten; der Inhalt zieht
 * darunter durch. Kein Kasten um Dinge, die auch ohne Kasten zusammengehoeren:
 * Listen sind eine Flaeche mit Haarlinien, nicht eine Karte je Zeile.
 */

export const STYLESHEET = `
:root {
  --grund: #f2f2f7;
  --flaeche: #ffffff;
  --tinte: #000000;
  --leise: #8e8e93;
  --linie: rgba(60, 60, 67, .18);
  --glas: rgba(249, 249, 249, .72);
  --glas-kante: rgba(255, 255, 255, .5);
  --knopf: #000000;
  --knopf-schrift: #ffffff;
  --blau: #007aff;
  --radius: 14px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --grund: #000000;
    --flaeche: #1c1c1e;
    --tinte: #ffffff;
    --leise: #8e8e93;
    --linie: rgba(84, 84, 88, .5);
    --glas: rgba(30, 30, 32, .72);
    --glas-kante: rgba(255, 255, 255, .12);
    --knopf: #ffffff;
    --knopf-schrift: #000000;
    --blau: #0a84ff;
  }
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--grund);
  color: var(--tinte);
  font: 17px/1.47 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  letter-spacing: -.01em;
}

/* Die Flaeche liegt zwischen zwei schwebenden Leisten; der Abstand haelt den
   Inhalt frei von ihnen, ohne dass etwas abgeschnitten wird. */
.seite {
  max-width: 34rem;
  margin: 0 auto;
  padding:
    calc(3.4rem + env(safe-area-inset-top))
    1rem
    calc(6.5rem + env(safe-area-inset-bottom));
}

/* — Glas —————————————————————————————————————————————————— */

.leiste, .fuss {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--glas);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
}

/* Oben: nur der Titel, mittig, wie eine Navigationsleiste. */
.leiste {
  top: 0;
  padding: calc(.7rem + env(safe-area-inset-top)) 1rem .7rem;
  text-align: center;
  font-size: 1.0625rem;
  font-weight: 600;
  border-bottom: .5px solid var(--linie);
}
.leiste a { color: inherit; text-decoration: none; }
.leiste .zurueck {
  position: absolute;
  left: .9rem;
  bottom: .7rem;
  color: var(--blau);
  font-weight: 400;
}

/* Unten: die Leiste schwebt als Pille ueber dem Inhalt, mit Luft ringsum. */
.fuss {
  bottom: 0;
  background: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  padding: 0 1rem calc(.7rem + env(safe-area-inset-bottom));
  pointer-events: none;
}
.fuss > * { pointer-events: auto; }

.reiter {
  display: flex;
  max-width: 32rem;
  margin: 0 auto;
  border-radius: 22px;
  padding: .3rem;
  background: var(--glas);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: .5px solid var(--glas-kante);
  box-shadow: 0 6px 24px rgba(0, 0, 0, .12);
}
.reiter a {
  flex: 1;
  text-align: center;
  padding: .5rem .25rem;
  border-radius: 18px;
  color: var(--leise);
  text-decoration: none;
  font-size: .8125rem;
  letter-spacing: -.005em;
}
.reiter a[aria-current] { color: var(--tinte); font-weight: 600; }
.reiter a:focus-visible { outline: 2px solid var(--blau); outline-offset: 1px; }

/* — Flaechen —————————————————————————————————————————————— */

.flaeche {
  background: var(--flaeche);
  border-radius: var(--radius);
  overflow: hidden;
}
.flaeche.polster { padding: 1rem 1.05rem; }

/* Eine Liste ist eine Flaeche mit Haarlinien — nicht eine Karte je Zeile.
   Die Linie muss die Rahmen-Regeln der Formularfelder schlagen, sonst
   verschwindet sie zwischen genau den Zeilen, die sie trennen soll. */
.liste > * + *,
.flaeche > * + * { border-top: .5px solid var(--linie) !important; }
.zeile { padding: .85rem 1.05rem; }

a { color: var(--blau); text-decoration: none; }
a:hover { text-decoration: underline; }

/* — Schreiben ————————————————————————————————————————————— */

textarea {
  display: block;
  width: 100%;
  /* Das Feld füllt die Fläche bis kurz über den Knopf — wie in der Referenz,
     wo die Notiz den Bildschirm einnimmt und nicht in einer Kachel sitzt.
     Hängt ein Foto dran, tritt es zurück: dann ist das Bild der Beitrag. */
  min-height: calc(100vh - 19rem);
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 1rem 1.05rem;
  resize: none;
}
textarea:focus { outline: none; }
.mit-medium textarea { min-height: 5.5rem; }
::placeholder { color: var(--leise); }

input[type="text"], input[type="password"] {
  width: 100%;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: .8rem 1.05rem;
}
input:focus { outline: none; }

/* Der Datei-Wähler des Browsers ist nicht gestaltbar — also wird sein Label
   die Zeile, und das echte Feld bleibt unsichtbar bedienbar. */
label.datei {
  display: block;
  padding: .8rem 1.05rem;
  color: var(--blau);
  cursor: pointer;
}
label.datei:focus-within { background: rgba(0, 122, 255, .08); }
label.datei input[type="file"] {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* — Knöpfe ———————————————————————————————————————————————— */

.knopf {
  display: block;
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;
  background: var(--knopf);
  color: var(--knopf-schrift);
  border: 0;
  border-radius: 22px;
  padding: .9rem 1rem;
  font: inherit;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(0, 0, 0, .18);
}
.knopf.klar {
  background: var(--glas);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: .5px solid var(--glas-kante);
  color: var(--blau);
  font-weight: 400;
  box-shadow: 0 6px 24px rgba(0, 0, 0, .1);
}
.knopf.klar.warnend { color: #ff3b30; }

/* — Beiträge —————————————————————————————————————————————— */

.beitrag .wer {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  margin-bottom: .2rem;
}
.beitrag .wer a { color: inherit; text-decoration: none; font-weight: 600; font-size: .9375rem; }
.beitrag .wann { color: var(--leise); font-size: .8125rem; margin-left: auto; }
.beitrag p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.beitrag img, .beitrag video {
  display: block;
  width: 100%;
  border-radius: 10px;
  margin-top: .55rem;
  background: var(--grund);
}
.beitrag .alt { color: var(--leise); font-size: .8125rem; margin-top: .35rem; }

/* — Kleinkram ————————————————————————————————————————————— */

.leer { color: var(--leise); text-align: center; padding: 22vh 1rem; }
.hinweis { color: var(--leise); font-size: .8125rem; text-align: center; margin: .7rem 0 0; }
.warnung {
  color: #ff3b30;
  font-size: .8125rem;
  text-align: center;
  margin: 0 0 .7rem;
}
.titel {
  font-size: 2.125rem;
  line-height: 1.1;
  letter-spacing: -.03em;
  font-weight: 700;
  margin: 2.5rem 0 .5rem;
}
.vorspann { color: var(--leise); margin: 0 0 2rem; }
form { margin: 0; }
`;
