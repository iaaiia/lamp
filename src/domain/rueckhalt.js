/**
 * Rückhalt — der geschützte Raum am Ende des Wegs.
 *
 * Der Weg durch einen Kreis ist Freunde → Kreise → Support (D30, D38).
 * Die letzte Stufe war bisher nur eine Ansicht: sie zeigte, wo Rückhalt gegeben
 * wurde. Ein Safe Space ist sie damit nicht — dafür braucht es einen Ort, den
 * nur die betreffenden Menschen betreten können.
 *
 * Wie er entsteht: **gegenseitig**. Wenn zwei Menschen im selben Kreis jeweils
 * hinter einem Beitrag der anderen stehen, können sie einen Rückhalt-Raum
 * öffnen. Niemand kann ihn einseitig aufmachen, niemand kann hineingebeten
 * werden, der nicht selbst schon Rückhalt gegeben hat.
 *
 * Warum das kein Schlupfloch neben dem Schutzboden für Minderjährige (D9) ist:
 * `dmFrom` schützt davor, dass Fremde privat anschreiben können. Hier gibt es
 * keine Fremden. Beide Seiten haben vorher, im Kreis und sichtbar, eine
 * Handlung füreinander gemacht. Der Raum ist die Folge dieser beiden
 * Handlungen, nicht der Wunsch einer Seite — und ohne die zweite Handlung
 * entsteht er nicht, für niemanden.
 *
 * Der Raum ist technisch ein privater Kreis. Das ist keine Bequemlichkeit,
 * sondern der Punkt: für private Kreise gilt bereits alles, was gelten soll —
 * sie verlassen diesen Server nie, existieren für Nichtmitglieder nicht einmal
 * als Seite, und ihre Sichtbarkeit hängt an der Art des Kreises, nicht an einer
 * Einstellung, die jemand versehentlich umstellt.
 */

import { all, get, now, run } from '../db.js';
import { DomainError } from './accounts.js';
import { findById } from './circles.js';

/**
 * Menschen aus diesem Kreis, mit denen der Rückhalt gegenseitig ist: ich stehe
 * hinter etwas von ihnen, sie stehen hinter etwas von mir. Beides in diesem
 * Kreis — Rückhalt aus einem anderen Raum zählt hier nicht, sonst wäre der
 * Kreis nicht mehr die Grenze.
 */
export function mutualSupporters(circleId, accountId) {
  return all(
    `SELECT a.*,
            (SELECT MAX(r.created_at) FROM reactions r
               JOIN posts p ON p.id = r.post_id
              WHERE p.circle_id = :circle AND r.account_id IN (:me, a.id)) AS last_support
     FROM accounts a
     WHERE a.id <> :me
       AND a.paused_at IS NULL
       -- ich stehe hinter etwas von ihnen
       AND EXISTS (SELECT 1 FROM reactions r JOIN posts p ON p.id = r.post_id
                    WHERE r.account_id = :me AND p.account_id = a.id
                      AND p.circle_id = :circle AND p.deleted_at IS NULL)
       -- und sie hinter etwas von mir
       AND EXISTS (SELECT 1 FROM reactions r JOIN posts p ON p.id = r.post_id
                    WHERE r.account_id = a.id AND p.account_id = :me
                      AND p.circle_id = :circle AND p.deleted_at IS NULL)
     ORDER BY last_support DESC`,
    { circle: circleId, me: accountId },
  );
}

/** Steht der Rückhalt zwischen diesen beiden in diesem Kreis auf beiden Seiten? */
export const isMutual = (circleId, a, b) =>
  mutualSupporters(circleId, a).some((person) => person.id === b);

/** Die Adresse ist aus den Beteiligten gebildet — für dieselben zwei immer dieselbe. */
export const raumSlug = (circle, a, b) =>
  `rueckhalt-${circle.slug}-${Math.min(a, b)}-${Math.max(a, b)}`;

/** Der Raum, falls er schon existiert. */
export function findRaum(circle, a, b) {
  return get('SELECT * FROM circles WHERE slug = ?', raumSlug(circle, a, b));
}

/**
 * Den Raum öffnen — oder den bestehenden zurückgeben. Beim ersten Mal entsteht
 * ein privater Kreis mit genau zwei Mitgliedern. Beide moderieren ihn: hier ist
 * niemand Gast, und niemand kann die andere hinauswerfen.
 */
export function openRaum(circle, viewer, otherId) {
  if (viewer.id === otherId) {
    throw new DomainError('Ein Rückhalt-Raum braucht zwei.', 'account_id');
  }
  if (!isMutual(circle.id, viewer.id, otherId)) {
    throw new DomainError(
      'Ein Rückhalt-Raum entsteht nur, wenn ihr beide hinter etwas vom anderen steht.',
      'account_id',
    );
  }

  const vorhanden = findRaum(circle, viewer.id, otherId);
  if (vorhanden) return vorhanden;

  const other = get('SELECT * FROM accounts WHERE id = ?', otherId);
  if (!other || other.paused_at) throw new DomainError('Dieses Konto ist gerade nicht da.', 'account_id');

  const zeit = now();
  const id = run(
    `INSERT INTO circles (slug, name, purpose, kind, joining, place, created_by, created_at)
     VALUES (?, ?, ?, 'private', 'invite', NULL, ?, ?)`,
    raumSlug(circle, viewer.id, otherId),
    `Rückhalt · ${circle.name}`,
    'Entstanden, weil ihr beide hintereinander steht. Nur ihr zwei seid hier.',
    viewer.id,
    zeit,
  );
  for (const accountId of [viewer.id, otherId]) {
    run(
      "INSERT INTO memberships (circle_id, account_id, role, state, created_at) VALUES (?, ?, 'moderator', 'member', ?)",
      id,
      accountId,
      zeit,
    );
  }
  return findById(id);
}

/** Die eigenen Rückhalt-Räume — für die Übersicht, nicht für Fremde. */
export const raeumeFor = (accountId) =>
  all(
    `SELECT c.* FROM circles c JOIN memberships m ON m.circle_id = c.id
     WHERE m.account_id = ? AND m.state = 'member' AND c.slug LIKE 'rueckhalt-%'
     ORDER BY c.created_at DESC`,
    accountId,
  );
