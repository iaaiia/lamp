/**
 * Der Weg — die drei Rubriken, und zwar meine, nicht die eines Raums.
 *
 *   Freunde  wem ich folge — was sie schreiben, liefert der Feed-Mechanismus
 *            (src/domain/feeds.js), damit die gewählte Sortierung auch hier gilt
 *   Kreise   Beiträge, hinter die ich mich gestellt habe — und meine, hinter die sich jemand gestellt hat
 *   Support  die geschützten Chats, die daraus entstanden sind
 *
 * Die Reihenfolge ist die These: man folgt Menschen, merkt dabei, wofür man
 * einsteht — und aus manchem davon wird ein Ort, an dem zwei Menschen
 * aufeinander zählen. Die Support-Achse zeigt beide Richtungen, denn eine
 * Zuwendung ist erst dann etwas wert, wenn sie auch ankommt.
 *
 * Alles hier ist **die eigene Sicht**. Diese Abfragen laufen nie für jemand
 * anderen als die anfragende Person, und keine von ihnen zeigt einer dritten
 * Person, wer wen unterstützt hat — dafür gilt weiter D4.
 */

import { all } from '../db.js';

/** Wem ich folge — der Anfang von allem. */
export const meineLeute = (accountId) =>
  all(
    `SELECT a.* FROM follows f JOIN accounts a ON a.id = f.target_id
     WHERE f.follower_id = ? AND f.state = 'accepted' AND a.paused_at IS NULL
     ORDER BY a.display_name, a.username`,
    accountId,
  );

/**
 * Kreise — die Support-Achse in beide Richtungen: Beiträge, hinter die **ich**
 * mich gestellt habe, und Beiträge von **mir**, hinter die sich jemand
 * gestellt hat. Alles, womit ich zu tun habe.
 *
 * Themen sind damit nicht das, was viele gut finden, sondern das, wofür in
 * meiner Umgebung eingestanden wurde. Es steht keine Zahl daran und keine
 * Rangliste dahinter — die Reihenfolge ist die Zeit (D2, D4a).
 */
export const meineThemen = (accountId, limit = 40) =>
  all(
    `SELECT * FROM (
       -- wofür ich eingestanden bin
       SELECT p.id, p.content, p.content_warning, p.circle_id,
              r.created_at AS wann, 'meine' AS art,
              a.username, a.domain, a.display_name
         FROM reactions r
         JOIN posts p ON p.id = r.post_id
         JOIN accounts a ON a.id = p.account_id
        WHERE r.account_id = :me AND p.deleted_at IS NULL AND a.paused_at IS NULL
       UNION ALL
       -- wofür jemand bei mir eingestanden ist
       SELECT p.id, p.content, p.content_warning, p.circle_id,
              r.created_at AS wann, 'fremde' AS art,
              a.username, a.domain, a.display_name
         FROM reactions r
         JOIN posts p ON p.id = r.post_id
         JOIN accounts a ON a.id = r.account_id
        WHERE p.account_id = :me AND r.account_id <> :me
          AND p.deleted_at IS NULL AND a.paused_at IS NULL
     )
     ORDER BY wann DESC
     LIMIT :grenze`,
    { me: accountId, grenze: limit },
  );

/**
 * Die eigenen Rückhalt-Räume, mit der Person auf der anderen Seite und dem
 * letzten Wort darin. Mehr als zwei Menschen sind in so einem Raum nie.
 */
export const meineRaeume = (accountId) =>
  all(
    `SELECT c.*,
            (SELECT a.display_name FROM memberships m2 JOIN accounts a ON a.id = m2.account_id
              WHERE m2.circle_id = c.id AND m2.account_id <> ? LIMIT 1) AS gegenueber_name,
            (SELECT a.username FROM memberships m2 JOIN accounts a ON a.id = m2.account_id
              WHERE m2.circle_id = c.id AND m2.account_id <> ? LIMIT 1) AS gegenueber,
            (SELECT p.content FROM posts p
              WHERE p.circle_id = c.id AND p.deleted_at IS NULL
              ORDER BY p.created_at DESC LIMIT 1) AS letztes,
            (SELECT MAX(p.created_at) FROM posts p
              WHERE p.circle_id = c.id AND p.deleted_at IS NULL) AS zuletzt
     FROM circles c JOIN memberships m ON m.circle_id = c.id
     WHERE m.account_id = ? AND m.state = 'member' AND c.slug LIKE 'rueckhalt-%'
     ORDER BY COALESCE(zuletzt, c.created_at) DESC`,
    accountId,
    accountId,
    accountId,
  );

/**
 * Wo ein Rückhalt-Raum entstehen könnte: Menschen, mit denen der Rückhalt in
 * irgendeinem Kreis gegenseitig ist und mit denen es den Raum noch nicht gibt.
 * Die Tür stand vorher im Kreis; sie gehört dorthin, wo auch die Räume stehen.
 */
export const moeglicheRaeume = (accountId) =>
  all(
    `SELECT a.id, a.username, a.domain, a.display_name,
            c.id AS circle_id, c.slug AS circle_slug, c.name AS circle_name
     FROM accounts a
     JOIN circles c ON c.slug NOT LIKE 'rueckhalt-%'
     WHERE a.id <> :me AND a.paused_at IS NULL
       AND EXISTS (SELECT 1 FROM reactions r JOIN posts p ON p.id = r.post_id
                    WHERE r.account_id = :me AND p.account_id = a.id
                      AND p.circle_id = c.id AND p.deleted_at IS NULL)
       AND EXISTS (SELECT 1 FROM reactions r JOIN posts p ON p.id = r.post_id
                    WHERE r.account_id = a.id AND p.account_id = :me
                      AND p.circle_id = c.id AND p.deleted_at IS NULL)
       AND NOT EXISTS (
         SELECT 1 FROM circles raum
          WHERE raum.slug = 'rueckhalt-' || c.slug || '-' ||
                MIN(:me, a.id) || '-' || MAX(:me, a.id))
     GROUP BY a.id, c.id
     ORDER BY c.name, a.display_name`,
    { me: accountId },
  );
