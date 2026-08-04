/**
 * Kreiszeichen — jedes Kreises eigenes Mark, deterministisch aus seiner Adresse.
 *
 * Die Vorlage für dieses Raster arbeitet mit glänzenden 3D-Kugeln als Kachel-
 * Identität. Für lamb wäre das falsch: Airbrush-Orbs sind Dekoration, die nichts
 * über den Raum aussagt, und sie ziehen die Marke ins Verspielte. Stattdessen
 * bekommt jeder Kreis eine Variante des Presence Rings — der Bogen aus Menschen,
 * der jemanden umschließt. Gleiches Zeichen, andere Belegung:
 *
 *   Punkte auf dem Ring  = Größe des Kreises (4–12, wächst mit den Mitgliedern)
 *   Farbe                = deterministisch aus dem Slug, aus einer engen
 *                          Blau-Violett-Schiefer-Palette
 *   Innerer Ring         = nur bei privaten Kreisen (geschlossene zweite Schale)
 *
 * Damit ist das Mark lesbar statt bloß hübsch: Man sieht der Kachel an, ob ein
 * Kreis groß und ob er geschlossen ist, bevor man den Text liest.
 *
 * Ember kommt hier nie vor — die Farbe gehört dem Support.
 */

/** FNV-1a: klein, stabil, ohne Abhängigkeit. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Enge, überparteiliche Palette: Blau bis Violett über Schiefer. Kein Grün. */
// Dunkel und hell aus denselben Bändern wie überall sonst.
const PALETTE = [
  ['#0E5560', '#3FBFB6'],
  ['#3A2E6B', '#8878C3'],
  ['#0A4444', '#0F8C8C'],
  ['#463A80', '#A99AD6'],
  ['#3E5A15', '#97C93D'],
  ['#75330A', '#F9A61A'],
];

/**
 * @param {{slug: string, kind: string, member_count?: number}} circle
 * @param {{size?: number, id: string}} options `id` muss pro Seite eindeutig sein.
 */
export function circleSigil(circle, { size = 64, id }) {
  const seed = hash(circle.slug);
  const [dark, light] = PALETTE[seed % PALETTE.length];

  const members = Number(circle.member_count ?? 1);
  const dots = Math.min(12, Math.max(4, 3 + Math.round(Math.log2(members + 1) * 2)));
  const start = (seed >>> 8) % 360;
  const r = 34;

  const points = Array.from({ length: dots }, (_, i) => {
    const angle = ((start + (i * 360) / dots) * Math.PI) / 180;
    const cx = 50 + r * Math.cos(angle);
    const cy = 50 + r * Math.sin(angle);
    // Ein Punkt ist größer als die anderen: die Person, um die es gerade geht.
    const radius = i === 0 ? 7 : 5;
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius}" fill="url(#${id}-g)"></circle>`;
  }).join('');

  // Private Kreise tragen eine zweite, geschlossene Schale — sichtbar zu, bevor
  // man das Etikett liest.
  const shell = circle.kind === 'private'
    ? `<circle cx="50" cy="50" r="23" fill="none" stroke="url(#${id}-g)" stroke-width="2.5" opacity=".55"></circle>`
    : '';

  return `<svg class="sigil" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${light}"></stop>
      <stop offset="100%" stop-color="${dark}"></stop>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="${r}" fill="none" stroke="url(#${id}-g)" stroke-width="1.5" opacity=".28"></circle>
  ${shell}
  ${points}
</svg>`;
}
