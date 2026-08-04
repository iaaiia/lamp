/**
 * Der Himmel — die räumliche Startseite.
 *
 * Statt eines Rasters, das man Kachel für Kachel abklickt, liegen die Kreise als
 * Wolken in einer Fläche, die größer ist als der Bildschirm. Man schiebt sie mit
 * dem Finger hin und her und findet dabei Dinge, die man nicht gesucht hat.
 *
 * Drei Regeln, aus denen sich die Anordnung ergibt:
 *
 *   Nähe    — eigene Kreise liegen links im Bild, wo der Himmel beginnt; offene
 *             Kreise zum Beitreten liegen rechts jenseits des Randes. Entdecken
 *             heißt: weiterschieben. (Bewusst nicht radial um die Mitte: eine
 *             Fläche ohne Skript startet immer oben links, und dort soll das
 *             Eigene liegen, nicht Leere.)
 *   Größe   — der Durchmesser wächst mit der Mitgliederzahl, gedeckelt.
 *   Tiefe   — was weiter außen liegt, ist blasser und weicher gezeichnet.
 *
 * Die Position ist deterministisch aus dem Slug abgeleitet: Ein Kreis liegt
 * morgen dort, wo er heute lag. Ein Himmel, der sich bei jedem Laden neu sortiert,
 * wäre kein Ort, sondern ein Spielautomat.
 *
 * Alles hier ist reines HTML und CSS. Das Schieben macht der Browser selbst —
 * es gibt weiterhin kein Client-JavaScript, das etwas nachladen, umsortieren
 * oder mitschreiben könnte.
 */

/** Dieselbe Streuung wie in sigil.js, damit Wolke und Zeichen dieselbe Farbe tragen. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Blau bis Violett über Schiefer. Ember fehlt: die Farbe gehört dem Support. */
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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Legt die Wolken an. `near` sind eigene Kreise, `far` welche zum Entdecken.
 * @returns {{clouds: Array, css: string}}
 */
export function layoutSky(near, far) {
  const clouds = [];

  const place = (circle, index, count, band) => {
    const seed = hash(circle.slug);

    // Senkrecht gleichmäßig verteilen, waagerecht im Zickzack — eine exakte
    // Spalte sähe aus wie ein Menü, reiner Zufall verklumpt. Der Wechsel füllt
    // die Fläche und lässt die Anordnung trotzdem gewachsen aussehen.
    const lane = count > 1 ? index / (count - 1) : 0.5;
    const jitterY = (((seed % 1000) / 1000) - 0.5) * (0.6 / Math.max(count, 1)) * 100;
    const zigzag = index % 2 === 0 ? 0.28 : 0.72;
    const jitterX = zigzag + ((((seed >>> 10) % 1000) / 1000) - 0.5) * 0.24;

    const members = Number(circle.member_count ?? 1);
    const size = clamp(15 + Math.log2(members + 1) * 5, 15, 32);

    return {
      circle,
      near: band.near,
      x: clamp(band.left + jitterX * (band.right - band.left), 5, 95),
      y: clamp(6 + lane * 86 + jitterY, 5, 93),
      size,
      colors: PALETTE[seed % PALETTE.length],
      // Drift: lange, unterschiedliche Dauern, damit nichts im Gleichtakt zieht.
      drift: 26 + (seed % 22),
      delay: -((seed >>> 5) % 30),
    };
  };

  near.forEach((circle, i) => clouds.push(place(circle, i, near.length, { left: 4, right: 46, near: true })));
  far.forEach((circle, i) => clouds.push(place(circle, i, far.length, { left: 54, right: 96, near: false })));

  // Positionen und Farben kommen als eigener, signierter Style-Block: pro Wolke
  // ein paar Custom Properties. Inline-Styles bleiben damit weiterhin verboten.
  const css = clouds
    .map(
      (cloud, i) => `#cloud-${i}{--x:${cloud.x.toFixed(2)}%;--y:${cloud.y.toFixed(2)}%;` +
        `--d:${cloud.size.toFixed(1)}vmin;--c1:${cloud.colors[0]};--c2:${cloud.colors[1]};` +
        `--drift:${cloud.drift}s;--delay:${cloud.delay}s}`,
    )
    .join('\n');

  return { clouds, css };
}
