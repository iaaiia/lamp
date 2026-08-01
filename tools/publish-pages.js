/**
 * Legt den gebauten Rundgang dorthin, wo GitHub Pages ihn findet.
 *
 * Warum das nötig ist: Pages ist in diesem Repository auf „Deploy from a
 * branch" gestellt. Dann baut GitHub selbst mit Jekyll aus dem Wurzelverzeichnis
 * des Branches — und ohne index.html dort zeigt es die README statt der
 * Anwendung. Der Workflow in .github/workflows/pages.yml (actions/deploy-pages)
 * läuft in dieser Einstellung gar nicht.
 *
 * Sobald die Pages-Quelle in den Repository-Einstellungen auf „GitHub Actions"
 * steht, ist dieses Skript überflüssig: dann veröffentlicht der Workflow direkt
 * aus site/, und die erzeugten Dateien müssen nicht mehr eingecheckt werden.
 *
 * Alles hier Kopierte ist erzeugt. Die Quelle ist src/ — nichts davon von Hand
 * bearbeiten.
 */

import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = join(wurzel, 'site');
const ziel = join(wurzel, 'rundgang');

// Nur das eigene Ausgabeverzeichnis wird geleert — nie etwas anderes.
rmSync(ziel, { recursive: true, force: true });
mkdirSync(ziel, { recursive: true });

const dateien = readdirSync(quelle);
for (const datei of dateien) cpSync(join(quelle, datei), join(ziel, datei));

// Ohne diese Datei schiebt Pages alles durch Jekyll.
writeFileSync(join(wurzel, '.nojekyll'), '');

// Die Wurzel des Branches ist das, was Pages ausliefert: von dort geht es in
// den Rundgang. Ein <meta refresh> genügt — ein Skript wäre hier das erste im
// ganzen Projekt.
writeFileSync(
  join(wurzel, 'index.html'),
  `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>lamb</title>
<meta http-equiv="refresh" content="0; url=rundgang/index.html">
<link rel="canonical" href="rundgang/index.html">
</head>
<body>
<p>lamb öffnet sich gleich. Falls nicht: <a href="rundgang/index.html">zum Rundgang</a>.</p>
</body>
</html>
`,
);

console.log(`${dateien.length} Dateien nach ${ziel} kopiert.`);
