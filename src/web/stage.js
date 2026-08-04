/**
 * Die Bühne — die Welt vom Plakat, weitergeführt in die Inhaltsseiten.
 *
 * Wer auf der Startseite sucht, soll nicht in ein anderes Produkt fallen: Der
 * Himmel bleibt, die Kugeln bleiben, nur der Inhalt wechselt. Über dem Himmel
 * liegen helle Karten — Kreisname mit Kugel oben, darunter Beiträge, Kommentare
 * und Support.
 *
 * Anders als auf dem Plakat sind die Kugeln hier reine Dekoration: kein Skript,
 * also nichts zu schieben. Sie liegen hinter den Karten und schauen zwischen
 * ihnen durch.
 */

/** Dieselbe Streuung wie überall, damit ein Kreis seine Farbe behält. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < String(text).length; i += 1) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Die Bänder der Vorlage, in ihrer Reihenfolge.
const PALETTE = [
  ['#8878C3', '#3A2E6B'],
  ['#A99AD6', '#463A80'],
  ['#0F8C8C', '#0A4444'],
  ['#3FBFB6', '#12544F'],
  ['#97C93D', '#3E5A15'],
  ['#F9CE00', '#6B5600'],
  ['#F9A61A', '#7A4A05'],
  ['#F47B20', '#75330A'],
];

/**
 * Streut Kugeln über die Bühne. `seedText` bestimmt Lage und Farbe — dieselbe
 * Seite sieht bei jedem Aufruf gleich aus.
 */
export function stageOrbs(seedText, count = 5) {
  const seed = hash(seedText);
  const orbs = [];

  for (let i = 0; i < count; i += 1) {
    const s = hash(`${seedText}#${i}`);
    const links = i % 2 === 0;
    orbs.push({
      id: `s${i}`,
      // An den Rändern, damit die Karten in der Mitte lesbar bleiben.
      x: links ? -10 + (s % 12) : 96 - (s % 12),
      y: 6 + (i * 88) / Math.max(count - 1, 1) + (((s >>> 9) % 10) - 5),
      d: 18 + ((s >>> 4) % 16),
      colors: PALETTE[(seed + i) % PALETTE.length],
      drift: 32 + (s % 20),
      delay: -((s >>> 6) % 26),
    });
  }
  return orbs;
}

export const stageOrbsHtml = (orbs) =>
  `<div class="orbfield stage-orbs" aria-hidden="true">${orbs
    .map((o) => `<div class="f-orb" id="${o.id}"><span class="f-body"></span></div>`)
    .join('')}</div>`;

export const stageOrbsCss = (orbs) =>
  orbs
    .map(
      (o) => `#${o.id}{--c1:${o.colors[0]};--c2:${o.colors[1]};--d:${o.d}vmin;` +
        `left:${o.x}%;top:${o.y}%;--ox:${34 + (o.d % 16)}%;--oy:${28 + (o.d % 14)}%;` +
        `--drift:${o.drift}s;--delay:${o.delay}s}`,
    )
    .join('\n');
