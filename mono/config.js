/**
 * mono — Konfiguration.
 *
 * Die eine Regel des Dienstes steht hier nicht als Schalter: dass ein Konto
 * genau einen Beitrag hat, ist nicht konfigurierbar. Es ist das Produkt.
 */

const env = process.env;

export const config = {
  origin: (env.MONO_ORIGIN ?? 'http://localhost:3100').replace(/\/$/, ''),
  port: Number(env.MONO_PORT ?? 3100),
  databaseFile: env.MONO_DB ?? 'mono.db',
  instanceName: env.MONO_NAME ?? 'mono',

  /** Demo-Konten beim Start anlegen (nur Entwicklung). */
  seed: env.MONO_SEED === '1',

  limits: {
    /** Kurz, weil es nur einen gibt — nicht kurz, um Tempo zu erzwingen. */
    monoLength: 700,
    displayNameLength: 40,
    handleLength: 20,
    /** Ein Bild oder ein Video, 25 MB. Mehr braucht ein einzelner Beitrag nicht. */
    mediaBytes: 25 * 1024 * 1024,
    /** Bildbeschreibung ist Pflicht, also hat sie auch eine Obergrenze. */
    altLength: 400,
  },

  media: {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
};

export default config;
