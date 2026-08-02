/**
 * Das Aussehen von mono, als eine Datei ausgeliefert.
 *
 * Aus mononote uebernommen: heller Grund, eine weisse Flaeche in der Mitte,
 * ein schwarzer Knopf darunter, sonst nichts. Keine Farbe, die etwas bewerben
 * will, keine Zahl, die etwas belohnen will.
 */

export const STYLESHEET = `
:root {
  --grund: #f2f2f7;
  --flaeche: #ffffff;
  --tinte: #111113;
  --leise: #8a8a8f;
  --linie: #e3e3e8;
  --knopf: #111113;
  --radius: 18px;
  --breite: 34rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --grund: #000000;
    --flaeche: #151517;
    --tinte: #f5f5f7;
    --leise: #8a8a8f;
    --linie: #2a2a2e;
    --knopf: #f5f5f7;
  }
  .knopf { color: #111113; }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--grund);
  color: var(--tinte);
  font: 17px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-text-size-adjust: 100%;
}

.seite {
  max-width: var(--breite);
  margin: 0 auto;
  padding: max(1rem, env(safe-area-inset-top)) 1rem calc(2rem + env(safe-area-inset-bottom));
}

header.kopf {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .25rem 0 1rem;
}
header.kopf a { color: var(--leise); text-decoration: none; font-size: .92rem; }
header.kopf a:hover, header.kopf a:focus { color: var(--tinte); }
.wortmarke {
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--tinte) !important;
  font-size: 1.05rem;
}

.karte {
  background: var(--flaeche);
  border-radius: var(--radius);
  padding: 1rem 1.1rem;
  margin-bottom: .85rem;
}

textarea, input[type="text"], input[type="password"], input[type="file"] {
  width: 100%;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  resize: none;
}
textarea:focus, input:focus { outline: none; }
textarea { min-height: 9rem; }
input[type="text"], input[type="password"] {
  border-bottom: 1px solid var(--linie);
  padding: .5rem 0;
  margin-bottom: .9rem;
}
::placeholder { color: var(--leise); }

.knopf {
  display: block;
  width: 100%;
  background: var(--knopf);
  color: var(--grund);
  border: 0;
  border-radius: 14px;
  padding: .85rem 1rem;
  font: inherit;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.knopf.leise {
  background: transparent;
  color: var(--leise);
  font-weight: 400;
}

/* Der Datei-Wähler des Browsers ist nicht gestaltbar — also versteckt man ihn
   und macht sein Label zum Knopf. Klick und Tastatur gehen weiter über das
   echte Feld, es ist nur nicht zu sehen. */
label.datei {
  display: block;
  border: 1px dashed var(--linie);
  border-radius: 12px;
  padding: .75rem 1rem;
  margin: .4rem 0 1rem;
  color: var(--leise);
  text-align: center;
  cursor: pointer;
}
label.datei:hover { border-color: var(--leise); }
label.datei:focus-within { border-style: solid; border-color: var(--tinte); color: var(--tinte); }
label.datei input[type="file"] {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.hinweis { color: var(--leise); font-size: .85rem; margin: .6rem 0 0; }
.warnung {
  background: var(--flaeche);
  border-left: 3px solid #d0342c;
  border-radius: 10px;
  padding: .7rem .9rem;
  margin-bottom: .85rem;
  font-size: .92rem;
}

.beitrag { position: relative; }
.beitrag .wer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .6rem;
  margin-bottom: .45rem;
}
.beitrag .wer a { color: var(--tinte); text-decoration: none; font-weight: 600; }
.beitrag .wann { color: var(--leise); font-size: .8rem; white-space: nowrap; }
.beitrag p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.beitrag img, .beitrag video {
  display: block;
  width: 100%;
  border-radius: 12px;
  margin-top: .7rem;
  background: var(--grund);
}
.beitrag .alt { color: var(--leise); font-size: .8rem; margin-top: .4rem; }

.leer { color: var(--leise); text-align: center; padding: 2.5rem 1rem; }

.gross {
  font-size: 2rem;
  line-height: 1.15;
  letter-spacing: -.03em;
  font-weight: 700;
  margin: 1.5rem 0 .6rem;
}
.vorspann { color: var(--leise); margin: 0 0 1.6rem; }

form + form { margin-top: .5rem; }
fieldset { border: 0; padding: 0; margin: 0; }
label { display: block; font-size: .85rem; color: var(--leise); margin-bottom: .3rem; }
`;
