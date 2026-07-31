# lamb — der Kreis, der um dich herum steht

Ein lauffähiges, föderierendes soziales Netz für 15- bis 24-Jährige in Europa, gebaut entlang
der EU-Ausschreibung **PPPA-2026-YOUTH-SOCIAL-MEDIA-DESIGN — Youth-Driven Social Media Design:
Safe, Inclusive, and Publicly-Owned Social Media** (DG CONNECT, Unit I.4).

Das Repository enthält drei Dinge: den **Prototypen** (`src/`, `tests/`), das **Design- und
Markensystem** (`design/`, `docs/lamb/`) und den **Antrag**, zu dem beides gehört (`proposal/`).

## Was es tut

Es föderiert. Ein echter ActivityPub-Server — WebFinger, Actor-Dokumente, signierte
Inbox/Outbox, Folgen, Beiträge, Support, Löschen — ein Konto hier ist von Mastodon aus
folgbar und umgekehrt. Was es zu einem *jugendzentrierten* Dienst macht, sind die
Eigenschaften darunter:

| Eigenschaft | Was das im Produkt heißt |
| --- | --- |
| **Kreise statt globaler Timeline** | Private Kreise, Themen- und lokale Kreise sind echte Räume mit Mitgliedschaft. Die Art des Kreises bestimmt die Sichtbarkeit — wer in einem privaten Kreis schreibt, kann das nicht versehentlich öffentlich tun. Private Kreise verlassen diesen Server nie und existieren für Nichtmitglieder nicht einmal als Seite. |
| **Cluster statt Strom** | Die Startseite ist eine Übersicht über Kreise, kein Fluss aus Beiträgen. Gezählt wird nur, was seit dem letzten Öffnen dazukam — eigene Beiträge nie. |
| **Support statt Like** | Die Kernreaktion sagt „ich stehe dahinter“, nicht „finde ich gut“ — und wird als Menschen angezeigt: „Mira, Jonas und 2 weitere stehen dahinter“. Eine nackte Zahl gibt es nirgends, eine Rangliste erst recht nicht. |
| **Rückhalt bleibt im Kreis** | Wer unterstützt hat, sieht nur die Autor:in — bis sie es freigibt. Auch über das Protokoll, nicht nur im Interface. |
| **Support führt weiter** | Wer einen Beitrag mit Inhaltshinweis unterstützt, bekommt danach angeboten zu antworten. Rückhalt soll in Zuwendung münden, nicht im Klick enden. |
| **Neueste zuerst** | Der Standard ist streng chronologisch. Andere Sortierungen sind Plugins, müssen gewählt werden und sich auf dem Bildschirm erklären. Keine nutzt Reaktionsdaten. |
| **Kein Nachladen beim Scrollen** | Blättern ist ein Link. Das Ende steht in Worten da. Das Produkt liefert null Client-JavaScript aus, und die CSP verbietet es. |
| **Antworten nur mit Einverständnis** | Die Autor:in entscheidet, wer antworten darf; die Regel greift beim Schreiben — lokal wie föderiert. 30 Sekunden Abkühlung bremsen Nachtreten. |
| **Bildbeschreibung ist Pflicht** | Ein Beitrag mit unbeschriebenem Bild wird abgelehnt. Unbeschriebene Bilder von anderen Servern werden verworfen statt angezeigt. |
| **Pause statt Löschen** | Ein Klick blendet Profil und Beiträge aus und stoppt die Föderation. Nichts wird gelöscht, der Kreis bleibt, ein Klick holt alles zurück. |
| **Schutzboden für Minderjährige** | Konten unter 18 behalten eingeschränkte Antworten, DMs aus, keine Vorschläge, privaten Rückhalt — Einstellungen können das nicht abschalten. |
| **KI sortiert, Menschen entscheiden** | Automatische Erkennung ordnet die Meldeliste und meldet ihre eigene Schwäche je Sprache. Es gibt keinen Codepfad von einem Klassifikator zur Löschung. |
| **Du kannst gehen** | Vollständiger Export von Profil, Beiträgen und beiden Seiten des Kreises als JSON, jederzeit. |
| **Kein Überwachungs-Datenmodell** | Leseverhalten wird nie erfasst. Keine Impressions, keine Verweildauer, keine abgeleiteten Interessen. |

Jede Zeile ist durch Tests abgedeckt. Warum jede Entscheidung so fiel und wo sie erzwungen
wird, steht in `docs/design-decisions.md`; was auf welches Ausschreibungsziel einzahlt —
inklusive ehrlicher Lückenliste — in `docs/call-traceability.md`.

## Starten

Braucht Node.js ≥ 22.5 (nutzt das eingebaute SQLite). **Keine Abhängigkeiten, kein Build.**

```bash
npm run dev     # legt zwei Demo-Konten an, läuft auf http://localhost:3000
npm test        # 75 Tests
```

Demo-Konten: `mira` und `jonas` (Konto unter 18), Passwort `lamb-demo-password`.

Konfiguration über Umgebungsvariablen — `LAMB_ORIGIN`, `LAMB_PORT`, `LAMB_DB`, `LAMB_NAME`,
`LAMB_SEED`, `LAMB_FEDERATION`, siehe `src/config.js`.

## Aufbau

```
src/
  config.js              die Wellbeing-Voreinstellungen, an einer Stelle
  db.js                  Schema — beachte, was es bewusst nicht speichern kann
  lib/                   HTTP Signatures, Passwort-Hashing, Routing
  domain/                Kreise, Konten, Beiträge, Sicherheit, Sortierungen, Moderation
  federation/            AS2-Dokumente, Inbox-Verarbeitung, signierte Zustellung
  web/                   servergerendertes HTML + lamb-Designsystem
tests/                   75 Tests: Kreise, Wellbeing, Sicherheit, Föderation, HTTP-Ende-zu-Ende
design/                  lamb.html (gerendertes System), lamb-tokens.css
docs/                    Designentscheidungen, Ausschreibungs-Traceability, docs/lamb/
proposal/                der Antrag, zu dem der Prototyp gehört
```

## Endpunkte

| Pfad | Zweck |
| --- | --- |
| `/` | Deine Kreise — die Cluster-Übersicht (oder Anmeldung, wenn abgemeldet) |
| `/stream` | Folge-Strom: was Menschen öffentlich unter eigenem Namen schreiben |
| `/c/:slug` | ein Kreis; `/circles/new` legt einen an |
| `/@name` | Profil als HTML — oder das Actor-Dokument bei `Accept: application/activity+json` |
| `/@name/inbox`, `/inbox` | signierte ActivityPub-Zustellung |
| `/@name/outbox`, `/followers`, `/following` | AS2-Collections |
| `/.well-known/webfinger`, `/nodeinfo/2.1` | Discovery; NodeInfo veröffentlicht die Wellbeing-Haltung |
| `/posts/:id/support` | Support geben oder zurücknehmen |
| `/settings`, `/settings/export` | Einstellungen, Pause, Datenexport |
| `/moderation` | Menschliche Moderationsliste mit Trefferquote je Sprache |

## Was noch fehlt

Youth Panels mit Phasenlogik und Protokoll (der Kreistyp `panel` steht im Datenmodell, das
Verfahren fehlt), die Onboarding-Strecke, Medien-Upload, Direktnachrichten, AT-Protocol-
Brücke, Mehrsprachigkeit. Reihenfolge und Aufwand in `docs/lamb/produkt.md`, Abschnitt 8.

## Lizenz

EUPL-1.2. Die Ausschreibung verlangt Open Source unter der am besten geeigneten Lizenz; die
EUPL ist die der Kommission selbst und ist mit AGPL-3.0 für Upstream-Beiträge kompatibel.
