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
| **Ein Himmel statt eines Stroms** | `/kreise` ist eine Fläche, die größer ist als der Bildschirm. Kreise liegen darin als Wolken; man schiebt sie hin und her und entdeckt dabei welche, die man nicht gesucht hat. Eigene liegen links, unbekannte rechts jenseits des Randes. Positionen sind fest — ein Kreis liegt morgen dort, wo er heute lag. |
| **Der Weg gehört dir** | Die Startseite sind vier Rubriken: **Leute → Gespräch → Themen → Rückhalt**. Leute = wem du folgst und was sie schreiben. Gespräch = die Kommentar-Achse: was du kommentiert hast und was jemand bei dir. Themen = dieselbe Form auf der Support-Achse: wofür du eingestanden bist und wofür jemand bei dir. Rückhalt = die geschützten Räume. Reden ist nicht Einstehen — deshalb zwei Achsen statt einer Liste. |
| **Gewischt, nicht geladen** | Die vier Rubriken liegen als Bahnen nebeneinander; seitliches Wischen rastet auf die nächste ein. Die Leiste oben gehört zur Bahn: Zeichen, die vier Wörter, zwei Knöpfe — und das Wort der eigenen Bahn ist das kräftige. Beim Wischen wandert sie mit, also folgt die Betonung dem Finger, ohne dass ein Skript zusieht. Alles Bedienbare liegt als Milchglas über dem Inhalt, der darunter durchzieht. |
| **Rückhalt ist ein Ort** | Stehen zwei Menschen im selben Kreis jeweils hinter etwas vom anderen, können sie einen **Rückhalt-Raum** öffnen: einen privaten Kreis für genau zwei, in dem beide moderieren. Nie einseitig, nie durch Einladung — nur aus zwei Handlungen, die vorher im Kreis sichtbar waren. Er verlässt diesen Server nie und existiert für alle anderen nicht. |
| **Der Kreis ist ein Chatfenster** | Ein Kreis ist nur noch das Gespräch: jede Nachricht eine Kugel mit Text daneben, versetzt und in wechselnder Größe. Die Streuung kommt aus dem Beitrag — sieht zufällig aus, ist jedes Mal dieselbe; die Farbe gehört dem Menschen. |
| **Die Kugel ist das Bedienelement** | Antippen öffnet, wer da spricht, wie der Rückhalt steht und wie man antwortet. Keine Knopfreihe unter jedem Text — und trotzdem kein Skript: Aufklappen ist ein `<details>`. Kugeln zur Zierde gibt es nicht: jede steht für einen Menschen, ein Thema, eine Nachricht oder einen Rückhalt. |
| **Eine Navigation, nicht zwei** | Oben das Zeichen (nach Hause) und zwei Knöpfe: Nachrichten, Einstellungen. Unten genau eine feste Leiste, und darin steht das Schreibfeld — in einem Kreis das des Kreises, sonst der Weg zur Kreiswahl. Die fünfteilige Tab-Leiste ist weg. |
| **Auskunft ohne Klick** | Jede Wolke nennt Art, Größe und Zustand von sich aus; bei Zeiger oder Tastaturfokus klappt Zweck und letzter Beitrag auf. Aus der Wolke führt ein Weg direkt ins Schreibfeld — nicht über zwei Seiten. |
| **Zeichen, die etwas aussagen** | Jeder Kreis trägt ein aus seiner Adresse erzeugtes Presence-Ring-Zeichen: Punkte wachsen mit der Mitgliederzahl, private Kreise tragen eine geschlossene zweite Schale. Man sieht der Kachel an, wie groß und wie offen ein Kreis ist, bevor man liest. |
| **Kühler Grund, frische Farben** | Heller Lavendelgrund, Marineblau statt Schwarz, und die Akzente aus der Referenz: Jupiterblau, Uranusviolett, Sonnenorange. Zeichen und Knöpfe oben sind violett mit weißem Piktogramm, das Zeichen mit versetztem Ring wie ein Planet. Orange bleibt dem Support vorbehalten, Grün kommt in der Marke nicht vor. |
| **„Wo willst du das sagen?"** | Das „+" führt nicht zu einem Textfeld, sondern zur Frage nach dem Kreis. Wer schreibt, weiß, wer mitliest, bevor die ersten Worte da sind. |
| **Support statt Like** | Die Kernreaktion sagt „ich stehe dahinter“, nicht „finde ich gut“ — und wird als Menschen angezeigt: „Mira, Jonas und 2 weitere stehen dahinter“. Eine nackte Zahl gibt es nirgends, eine Rangliste erst recht nicht. |
| **Rückhalt bleibt im Kreis** | Wer unterstützt hat, sieht nur die Autor:in — bis sie es freigibt. Auch über das Protokoll, nicht nur im Interface. |
| **Support führt weiter** | Wer einen Beitrag mit Inhaltshinweis unterstützt, bekommt danach angeboten zu antworten. Rückhalt soll in Zuwendung münden, nicht im Klick enden. |
| **Neueste zuerst** | Der Standard ist streng chronologisch. Andere Sortierungen sind Plugins, müssen gewählt werden und sich auf dem Bildschirm erklären. Keine nutzt Reaktionsdaten. |
| **Kein Nachladen beim Scrollen** | Blättern ist ein Link. Das Ende steht in Worten da. Die Anwendung liefert null Client-JavaScript aus, und die CSP verbietet es (`script-src 'none'`). Einzige Ausnahme ist die abgemeldete Startseite, wo Kugeln geschoben werden — sie lädt nichts, misst nichts, merkt sich nichts, und ohne Skript funktioniert sie vollständig. |
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

## Rundgang ansehen

**[iaaiia.github.io/lamp](https://iaaiia.github.io/lamp/)** — ein Rundgang durch echte,
mit Demodaten gefüllte Seiten: der Himmel lässt sich schieben, Wolken öffnen sich, alle
Seiten sind verlinkt.

Was dort **nicht** geht: anmelden, schreiben, Support geben, föderieren. GitHub Pages
liefert Dateien aus und führt kein Node aus — es gibt dort keine Datenbank und keine
Sitzungen. Der Rundgang wird mit `npm run build:pages` nach `site/` erzeugt — aus demselben Code,
den auch der Server benutzt.

**Veröffentlichen:** Die Pages-Quelle steht auf **GitHub Actions**; `.github/workflows/pages.yml`
baut bei jedem Push auf den Standard-Branch die Tests, dann den Rundgang, und veröffentlicht `site/`.
Erzeugte Dateien liegen deshalb nicht im Repository.

## Selbst starten

Braucht Node.js ≥ 22.5 (nutzt das eingebaute SQLite). **Keine Abhängigkeiten, kein Build.**

```bash
npm run dev     # legt zwei Demo-Konten an, läuft auf http://localhost:3000
npm test        # 142 Tests
```

Demo-Konten: `mira` und `jonas` (Konto unter 18), Passwort `lamb-demo-password`.

Konfiguration über Umgebungsvariablen — `LAMB_ORIGIN`, `LAMB_PORT`, `LAMB_DB`, `LAMB_NAME`,
`LAMB_SEED`, `LAMB_FEDERATION`, siehe `src/config.js`.

### Öffentlich betreiben

```bash
docker build -t lamb .
docker run -p 8080:8080 -v lamb-data:/data \
  -e LAMB_ORIGIN=https://deine-adresse.example lamb
```

`LAMB_ORIGIN` muss auf die öffentliche Adresse zeigen: Daraus werden die
ActivityPub-Kennungen gebildet, und wenn die nicht stimmen, kann kein anderer Server
antworten. Das Abbild braucht keine weiteren Dienste — Node bringt SQLite mit. Ein
Volume auf `/data` genügt, damit die Daten einen Neustart überleben.

## Aufbau

```
src/
  config.js              die Wellbeing-Voreinstellungen, an einer Stelle
  db.js                  Schema — beachte, was es bewusst nicht speichern kann
  lib/                   HTTP Signatures, Passwort-Hashing, Routing
  domain/                Kreise, Konten, Beiträge, Sicherheit, Sortierungen, Moderation
  federation/            AS2-Dokumente, Inbox-Verarbeitung, signierte Zustellung
  web/                   servergerendertes HTML, Designsystem, Kreiszeichen, Himmel
tests/                   142 Tests: Kreise, Himmel, Wellbeing, Sicherheit, Föderation, HTTP
design/                  lamb.html (gerendertes System), lamb-tokens.css
docs/                    Designentscheidungen, Ausschreibungs-Traceability, docs/lamb/
site/                    erzeugter Rundgang für Pages (nicht eingecheckt)
proposal/                der Antrag, zu dem der Prototyp gehört
```

## Endpunkte

| Pfad | Zweck |
| --- | --- |
| `/` | Abgemeldet das Plakat mit den Kugeln, angemeldet dein Weg — vier Bahnen zum Wischen (`#leute`, `#gespraech`, `#themen`, `#rueckhalt`) |
| `/kreise` | der Himmel: deine Kreise als Fläche, die man schiebt |
| `/stream` | Folge-Strom: was Menschen öffentlich unter eigenem Namen schreiben |
| `/c/:slug` | ein Kreis als Chatfenster; `?ansicht=chat\|themen\|leute\|support` schaltet die Fläche um, `/circles/new` legt einen an |
| `/compose` | „Wo willst du das sagen?" — Kreiswahl vor dem Schreiben |
| `/discover` | Kreise suchen und finden (private nie) |
| `/@name` | Profil als HTML — oder das Actor-Dokument bei `Accept: application/activity+json` |
| `/@name/inbox`, `/inbox` | signierte ActivityPub-Zustellung |
| `/@name/outbox`, `/followers`, `/following` | AS2-Collections |
| `/.well-known/webfinger`, `/nodeinfo/2.1` | Discovery; NodeInfo veröffentlicht die Wellbeing-Haltung |
| `/posts/:id/support` | Support geben oder zurücknehmen |
| `/c/:slug/rueckhalt` | den geschützten Raum öffnen — nur bei gegenseitigem Rückhalt |
| `/settings`, `/settings/export` | Einstellungen, Pause, Datenexport |
| `/moderation` | Menschliche Moderationsliste mit Trefferquote je Sprache |

## Was noch fehlt

Youth Panels mit Phasenlogik und Protokoll (der Kreistyp `panel` steht im Datenmodell, das
Verfahren fehlt), die Onboarding-Strecke, Medien-Upload, allgemeine Direktnachrichten (den
Rückhalt-Raum gibt es, den freien DM nicht), AT-Protocol-Brücke, Mehrsprachigkeit. Reihenfolge und Aufwand in `docs/lamb/produkt.md`, Abschnitt 8.

## Lizenz

EUPL-1.2. Die Ausschreibung verlangt Open Source unter der am besten geeigneten Lizenz; die
EUPL ist die der Kommission selbst und ist mit AGPL-3.0 für Upstream-Beiträge kompatibel.
