/**
 * Kugeln — die Bildsprache für Kreise, überall dieselbe.
 *
 * Im Himmel liegen Kreise als weiche Kugeln. Auf den Inhaltsseiten lagen sie
 * bisher als kleine Ringzeichen — zwei Sprachen für dieselbe Sache. Hier ist
 * die eine: dieselbe Farbe aus derselben Streuung, dieselbe weiche Zeichnung,
 * nur in Kachelgröße.
 *
 * Was die Kugel weiterhin aussagt (Dekoration wäre zu wenig):
 *
 *   Durchmesser        — wächst mit der Mitgliederzahl, gedeckelt
 *   Geschlossener Ring — der Kreis ist privat
 *   Farbe              — fest aus dem Slug, damit ein Kreis wiedererkennbar ist
 *
 * Ember kommt nie vor: die Farbe gehört dem Support.
 */

/** Dieselbe Streuung wie in sky.js und sigil.js. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const PALETTE = [
  ['#6E8FDF', '#22356B'],
  ['#8A86E4', '#37347E'],
  ['#5F82AB', '#243C55'],
  ['#7377C4', '#2E3170'],
  ['#4E90AE', '#1E4356'],
  ['#8778B4', '#3A2F63'],
  ['#D9A250', '#5C3E13'],
  ['#5FAFAD', '#153E3E'],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Markup für eine Kugel. Die Farben kommen über den erzeugten Style-Block,
 * damit keine Inline-Styles nötig sind.
 */
export function orbHtml(id) {
  return `<span class="orb-mark" id="${id}" aria-hidden="true"><span class="orb-body"></span></span>`;
}

/**
 * Eine Kugel für einen Menschen statt für einen Kreis. Im Gespräch soll sie
 * verspielt liegen: unterschiedlich groß, seitlich und in der Höhe versetzt —
 * wie in der Skizze, statt einer Reihe gleicher Punkte.
 */
export function personOrbCss(personSeed, postSeed, id, index = 0) {
  // Die Farbe gehört dem Menschen — daran erkennt man ihn wieder. Größe und
  // Versatz gehören dem Beitrag, damit die Kugeln nicht in Reih und Glied
  // liegen. Beides ist erzeugt, also jedes Mal gleich.
  const person = hash(personSeed ?? '');
  const seed = hash(postSeed ?? '');
  const [light, dark] = PALETTE[person % PALETTE.length];
  // Größe, seitlicher Versatz und Höhe streuen — die Kugeln sollen nicht in
  // einer Flucht liegen, sondern verspielt versetzt. Aus dem Beitrag erzeugt:
  // sieht zufällig aus, ist aber jedes Mal dieselbe Anordnung.
  const size = 52 + (seed % 6) * 11;
  const inset = (seed >>> 4) % 5;
  const lift = ((seed >>> 12) % 5) - 2;
  const shiftX = 30 + (seed % 24);
  const shiftY = 26 + ((seed >>> 8) % 22);
  return `#${id}{--c1:${light};--c2:${dark};--od:${size}px;--ox:${shiftX}%;--oy:${shiftY}%;` +
    `--mx:${inset * 0.7 + (index % 2) * 1.1}rem;--my:${lift * 0.35}rem}`;
}

/** Die Custom Properties für eine Kugel. */
export function orbCss(circle, id) {
  const seed = hash(circle.slug ?? '');
  const [light, dark] = PALETTE[seed % PALETTE.length];
  const members = Number(circle.member_count ?? 1);
  const size = clamp(68 + Math.log2(members + 1) * 9, 68, 108);
  // Der Kern sitzt versetzt im Hof — mal weiter oben, mal weiter zur Seite,
  // damit nicht alle Kugeln dasselbe Gesicht haben.
  const shiftX = 32 + (seed % 22);
  const shiftY = 28 + ((seed >>> 8) % 20);

  return `#${id}{--c1:${light};--c2:${dark};--od:${size}px;--ox:${shiftX}%;--oy:${shiftY}%}`;
}
