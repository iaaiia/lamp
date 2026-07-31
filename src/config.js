/**
 * Runtime configuration.
 *
 * Every default here is a product decision from the Youth Design Charter
 * (see docs/design-decisions.md). Operators can loosen them, but the shipped
 * defaults are the well-being ones — that is the point of the project.
 */

const env = process.env;

export const config = {
  /** Public origin of this instance, used to mint ActivityPub ids. */
  origin: (env.LAMP_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, ''),
  port: Number(env.LAMP_PORT ?? 3000),
  databaseFile: env.LAMP_DB ?? 'lamp.db',
  instanceName: env.LAMP_NAME ?? 'Huddle',

  /** Seed a demo account + posts on boot (development only). */
  seed: env.LAMP_SEED === '1',

  /** Outbound federation delivery. Disabled in tests. */
  federation: {
    enabled: env.LAMP_FEDERATION !== '0',
    userAgent: 'LAMP/0.1 (+https://github.com/iaaiia/lamp)',
    deliveryTimeoutMs: 8000,
    maxAttempts: 5,
  },

  /**
   * Well-being defaults. Applied to every new account; each is user-changeable
   * except where the call's minor-protection logic pins it (see accounts.js).
   */
  defaults: {
    feed: 'chronological',       // never an engagement-optimised feed by default
    showMetrics: false,          // like/boost counts visible to the author only
    replyPolicy: 'followers',    // who may reply to a new post
    dmFrom: 'followers',
    reducedMotion: false,
    lowStimulus: false,
    plainLanguage: false,
    sessionLimitMinutes: 0,      // 0 = off; user-declared session shape
    quietHoursStart: null,       // e.g. 22 — no notification digest during quiet hours
    quietHoursEnd: null,
    discoverable: true,
  },

  /** Defaults that are pinned harder for accounts registered as minors. */
  minorDefaults: {
    replyPolicy: 'followers',
    dmFrom: 'nobody',
    discoverable: false,
    showMetrics: false,
  },

  limits: {
    postLength: 2000,
    pageSize: 20,                // explicit paging; there is no infinite scroll
    displayNameLength: 60,
    bioLength: 500,
  },
};

export default config;
