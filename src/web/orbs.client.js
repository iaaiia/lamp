/**
 * Die einzige Stelle in lamb, an der Skript im Browser läuft: die Startseite.
 *
 * Warum hier eine Ausnahme: Kugeln mit dem Finger schieben und beim Scrollen
 * weitere auftauchen lassen — dafür hat CSS keinen Weg. Alles andere im Produkt
 * bleibt skriptfrei, und das ist geprüft.
 *
 * Was dieses Skript ausdrücklich nicht tut:
 *
 *   - nichts nachladen (keine Netzwerkanfrage, keine Bilder, keine Zählpixel)
 *   - nichts messen und nichts merken (kein Speicher, keine Kennung, kein Ping)
 *   - nichts unendlich erzeugen: die Zahl der Kugeln ist gedeckelt
 *
 * Ohne dieses Skript liegen die Kugeln still da, und die Seite funktioniert
 * vollständig — Überschrift, Suche, Anmeldung.
 */
(() => {
  const field = document.querySelector('[data-orbs]');
  if (!field) return;

  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = 14;

  // Dieselbe Streuung wie auf dem Server, damit Farben zur Marke passen.
  const PALETTE = [
    ['#6E8FDF', '#22356B'],
    ['#8A86E4', '#37347E'],
    ['#5F82AB', '#243C55'],
    ['#7377C4', '#2E3170'],
    ['#4E90AE', '#1E4356'],
    ['#8778B4', '#3A2F63'],
  ];

  const orbs = () => field.querySelectorAll('.f-orb');

  function machKugel(x, y, groesse) {
    if (orbs().length >= MAX) return null;

    const [hell, dunkel] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const el = document.createElement('div');
    el.className = 'f-orb is-new';
    el.style.setProperty('--c1', hell);
    el.style.setProperty('--c2', dunkel);
    el.style.setProperty('--d', `${groesse}px`);
    el.style.setProperty('--ox', `${30 + Math.random() * 24}%`);
    el.style.setProperty('--oy', `${26 + Math.random() * 22}%`);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = '<span class="f-body"></span>';
    field.append(el);
    if (ruhig) el.classList.remove('is-new');
    return el;
  }

  /* ------------------------------------------------------------- Schieben */

  let gezogen = null;
  let versatzX = 0;
  let versatzY = 0;

  field.addEventListener('pointerdown', (e) => {
    const orb = e.target.closest('.f-orb');
    if (!orb) return;
    gezogen = orb;
    const r = orb.getBoundingClientRect();
    const f = field.getBoundingClientRect();
    versatzX = e.clientX - (r.left - f.left);
    versatzY = e.clientY - (r.top - f.top);
    orb.setPointerCapture(e.pointerId);
    orb.classList.add('is-held');
    // Beim Anfassen hört das Treiben auf — sonst kämpft man gegen die Animation.
    orb.style.animation = 'none';
  });

  field.addEventListener('pointermove', (e) => {
    if (!gezogen) return;
    gezogen.style.left = `${e.clientX - versatzX}px`;
    gezogen.style.top = `${e.clientY - versatzY}px`;
    e.preventDefault();
  });

  const loslassen = () => {
    if (!gezogen) return;
    gezogen.classList.remove('is-held');
    gezogen = null;
  };
  field.addEventListener('pointerup', loslassen);
  field.addEventListener('pointercancel', loslassen);

  /* ------------------------------------------------- Beim Scrollen mehr */

  let letzte = window.scrollY;
  let gesammelt = 0;

  window.addEventListener(
    'scroll',
    () => {
      const jetzt = window.scrollY;
      gesammelt += Math.abs(jetzt - letzte);
      letzte = jetzt;
      if (gesammelt < 260) return;
      gesammelt = 0;

      const b = field.getBoundingClientRect();
      const groesse = 120 + Math.random() * 180;
      // Neue Kugeln treiben von den Rändern herein, nicht aus der Mitte —
      // sonst stehen sie sofort auf der Überschrift.
      const vonLinks = Math.random() < 0.5;
      machKugel(
        vonLinks ? -groesse * 0.4 : b.width - groesse * 0.6,
        Math.random() * (b.height - groesse * 0.5),
        groesse,
      );
    },
    { passive: true },
  );
})();
