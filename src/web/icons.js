/**
 * Icons — als Inline-SVG, weil es kein Skript und keine Icon-Schrift gibt.
 *
 * Alle auf demselben 24er-Raster, gleiche Strichstärke, runde Enden. Sie tragen
 * nie allein die Bedeutung: In der Tab-Leiste steht immer ein Wort daneben, und
 * überall sonst haben sie ein `aria-label`. Ein Icon, das man raten muss, ist
 * eine Zumutung — besonders für Leute, die diese Bildsprache nicht gewohnt sind.
 */

const svg = (paths, { size = 24, fill = false } = {}) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
    stroke="currentColor" stroke-width="${fill ? 0 : 1.8}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

/** Der Himmel: die Wolke aus Kreisen, die auch das Logo trägt. */
export const iconSky = (o) =>
  svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>', o);

export const iconSearch = (o) => svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>', o);

export const iconPlus = (o) => svg('<path d="M12 5.5v13M5.5 12h13"/>', { ...o });

/** Der Strom: was Menschen unter eigenem Namen schreiben. */

export const iconProfile = (o) =>
  svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>', o);

export const iconBack = (o) => svg('<path d="M14.5 5 8 12l6.5 7"/>', o);

export const iconMore = (o) =>
  svg('<circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>', o);

export const iconSettings = (o) =>
  svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2"/>', o);

export const iconShield = (o) =>
  svg('<path d="M12 3.5 5 6.2v5.4c0 4 2.9 7.6 7 8.9 4.1-1.3 7-4.9 7-8.9V6.2Z"/>', o);

/** Der Support-Bogen: ein Kreis, der sich über eine Person legt. */
export const iconSupport = (o) =>
  svg('<path d="M3.5 15a9 9 0 0 1 17 0" stroke-width="2.2"/><circle cx="12" cy="19" r="2.4" fill="currentColor" stroke="none"/>', o);

export const iconWrite = (o) =>
  svg('<path d="M4.5 19.5h15M6 15.4 15.6 5.8a1.7 1.7 0 0 1 2.4 0l.2.2a1.7 1.7 0 0 1 0 2.4L8.6 18H6Z"/>', o);
