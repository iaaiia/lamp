# Design decisions

Each decision records what was chosen, why, and where it is enforced. The
`Enforced by` column matters more than the prose: a design commitment that is
not in a test is a slogan, not a property.

## D1 — ActivityPub as the base protocol, AT Protocol via a bridge

**Chosen:** federate natively over ActivityPub; interoperate with AT Protocol
through a bridge; model the feed-generator interface on AT Protocol semantics.

**Why:** ActivityPub is a W3C Recommendation with the largest deployed European
instance base, so a pilot reaches real users on day one. AT Protocol's feed
generators are the better primitive for user-chosen ranking, so lamb adopts the
*shape* of that interface without splitting a pilot budget across two full
stacks.

**Enforced by:** `src/federation/`, `tests/federation.test.js`.

## D2 — Chronological by default, and every feed explains itself

**Chosen:** the default feed is strictly time-ordered. Alternative feeds are
registered plugins that must declare an `explanation`, shown above the timeline.
No feed may use engagement data.

**Why:** engagement ranking is the mechanism most directly implicated in the
harms the call describes. Making ranking opt-in, named and explained keeps user
agency real rather than buried in settings.

**Enforced by:** `registerFeed()` refuses a generator without an explanation
(`src/domain/feeds.js`); `tests/wellbeing.test.js` asserts the default.

## D3 — No infinite scroll, anywhere

**Chosen:** paging is an explicit link. The end of a timeline is stated in
words. There is no client-side JavaScript in the product at all.

**Why:** the strongest guarantee that nothing loads, re-orders or autoplays
under the reader is that no code exists to do it. This also makes the product
work on old devices and under assistive technology.

**Enforced by:** `tests/http.test.js` asserts no `<script>` tag is served and
that the CSP sets `script-src 'none'`.

## D4a — Support statt Like: Menschen statt Zahl

**Chosen:** die Kernreaktion heisst Support ("ich stehe dahinter", nicht "ich finde das
gut") und wird als Satz aus Namen angezeigt — "Mira, Jonas und 2 weitere stehen dahinter".
Eine nackte Gesamtzahl existiert nirgends im Produkt. Wer einen Beitrag mit Inhaltshinweis
unterstuetzt, bekommt danach angeboten, tatsaechlich zu antworten.

**Why:** ein umbenannter Like waere Kosmetik. Rueckhalt ist konkret oder er ist nichts —
und er soll in Zuwendung muenden, nicht im Klick enden.

**Enforced by:** `supportSentence()` (`src/domain/posts.js`), das Folgeangebot in
`postArticle()`; getestet in `tests/wellbeing.test.js` und `tests/http.test.js`.

Ueber ActivityPub wird Support als `Like` uebertragen, damit fremde Server es verstehen.
Die Semantik und die Anzeigeregeln liegen bei lamb; was andere Server daraus machen,
laesst sich nicht kontrollieren — deshalb ist die Nicht-Vergleichbarkeit im eigenen Produkt
verankert, nicht im Protokoll.

## D4 — Public metrics off by default

**Chosen:** who supported a post is visible to the author only. The author — not the
viewer — opts in to making them public. Follower collections stay empty over
ActivityPub while counts are private.

**Why:** public scoreboards are the feature young participants most consistently
name as harmful. Privacy that leaks over the protocol is not privacy.

**Enforced by:** `metricsVisible()` (`src/domain/posts.js`), the followers and
following collection routes, `tests/wellbeing.test.js`, `tests/http.test.js`.

## D5 — Reply permission is a write-time gate, not a UI hint

**Chosen:** `canReply()` is the single gate. Local composer and federated inbox
both pass through it. `followers` means *the author follows you* — stricter than
the Fediverse norm, where being a follower is enough.

**Why:** anyone can follow you; being followed should not buy the right to speak
in your thread. A gate that only exists in the UI is bypassed by any other
client or server.

**Enforced by:** `src/domain/safety.js`, `createPost()`, `handleCreate()` in
`src/federation/inbox.js`; tested from both directions.

## D6 — Reply cool-down

**Chosen:** the same account cannot post repeated replies into one thread within
30 seconds.

**Why:** rapid repeated replies are the shape of a pile-on. A small amount of
friction changes the dynamic without removing anyone's voice.

**Enforced by:** `replyCooldownRemaining()`, `tests/safety.test.js`.

## D7 — Alt text is mandatory

**Chosen:** a post with an image and no description is rejected. Remote
attachments without a description are dropped rather than displayed.

**Why:** accessibility is an acceptance criterion in this project. An
unlabelled image is not content for a screen-reader user; showing it anyway
would be a worse outcome than not showing it.

**Enforced by:** `createPost()`, `handleCreate()`, both tested.

## D8 — Pause instead of delete

**Chosen:** pausing hides the profile and posts and stops all federation.
Nothing is deleted, followers are kept, one step restores everything.

**Why:** the choice between "stay" and "destroy your account" is a false one.
Leaving for a while must be cheap, and returning must be cheaper.

**Enforced by:** `pauseAccount()`/`resumeAccount()`, the paused checks in the
timeline query, delivery queue and inbox handlers; `tests/wellbeing.test.js`.

## D9 — Minor protections cannot be switched off

**Chosen:** for accounts registered as under 18, `updatePreferences()` re-applies
the protective floor after every write: replies limited, DMs off, not listed in
discovery, counts private. Posts default to followers-only.

**Why:** a protection that a dark pattern, a friend or a bad day can switch off
is not a protection. Comfort settings stay fully user-controlled.

**Enforced by:** `updatePreferences()`, `tests/wellbeing.test.js`.

## D10 — Automated classification routes; humans decide

**Chosen:** `triage()` returns a severity hint and opens a queue item. There is
no code path from a classifier's output to `deleted_at`. Only `decideReport()`
removes content, and it records the moderator and the note.

**Why:** the call asks for responsible AI in moderation. The defensible line is
that automation may allocate human attention, never restrict legal speech.

**Enforced by:** `src/domain/moderation.js`; `tests/safety.test.js` asserts a
flagged post survives classification.

## D11 — The classifier reports its own language limits

**Chosen:** triage output carries `languageSupported` and a lowered confidence
outside evaluated languages. `triageAgreementStats()` reports human agreement
per language.

**Why:** a moderation model that works in English and not in Estonian will
quietly under-protect Estonian users. Measuring per language is the only way
that failure becomes visible.

**Enforced by:** `defaultClassifier()`, `triageAgreementStats()`, tested.

## D12 — No data model for behavioural advertising

**Chosen:** reading behaviour is not recorded. There is no impressions table, no
dwell time, no interest inference. The timeline is computed from follows and
time only.

**Why:** the surveillance business model cannot be adopted later by accident if
the data to run it was never collected.

**Enforced by:** the schema in `src/db.js` — and by its absence.

## D13 — Export is a first-class feature

**Chosen:** any signed-in user can download their profile, posts and both sides
of their social graph as JSON, without asking anyone.

**Why:** portability is the property that makes well-being competitive rather
than charitable. Leaving must be a supported action.

**Enforced by:** `exportAccount()`, `/settings/export`, tested.

## D14 — Kreise: ein Beitrag gehört dem Raum, in dem er steht

**Chosen:** lamb hat keine globale Timeline, sondern Kreise — privat, thematisch, lokal,
Youth Panel. Die Startseite ist eine Übersicht über Kreise, kein Fluss aus Beiträgen. Die
Art des Kreises bestimmt die Sichtbarkeit seiner Beiträge; die einzelne Person kann sie
nicht überschreiben. Private Kreise verlassen diesen Server nie und existieren für
Nichtmitglieder nicht einmal als "kein Zutritt"-Seite.

**Why:** die strukturelle Antwort auf Kontextkollaps. Wer schreibt, muss wissen, wer
mitliest — und darf nicht versehentlich öffentlich werden, weil ein Schalter falsch stand.
"Was hier gesagt wird, bleibt hier" ist sonst ein Appell; hier ist es eine Eigenschaft.

**Enforced by:** `src/domain/circles.js`, die Kreisprüfung in `createPost()` und
`isVisibleTo()`, `federates()` in `fanOut()`, der 404 für nicht lesbare Kreise;
`tests/circles.test.js` (17 Tests).

**Nebeneffekt, bewusst:** Kreisbeiträge tauchen weder im Folge-Strom noch im Profil auf.
Der Strom zeigt, was jemand öffentlich unter eigenem Namen schreibt — Kreise haben ihre
eigenen Seiten. Ohne diese Trennung wäre die Startseite wieder ein Fluss.

**Frische statt Ungelesen:** gezählt wird, was seit dem letzten Öffnen eines Kreises
dazukam, und eigene Beiträge zählen nie mit. Ein Badge, das nie auf null geht, ist ein
Zugmechanismus, kein Informationsdienst.

## D21 — Eine Bildsprache: dieselbe Kugel im Himmel wie auf den Kacheln

**Chosen:** Kreise erscheinen überall als weiche Kugel — im Himmel groß und driftend, auf
den Inhaltsseiten in Kachelgröße. Die kleinen Ringzeichen fallen damit als zweite Sprache
weg (sie leben nur noch als Profil-Avatar weiter).

**Why:** vorher war derselbe Kreis am Himmel eine Kugel und auf der Suchseite ein
Ringzeichen. Wer eine Wolke wiedererkennen will, musste den Kreis zweimal lernen. Eine
Sprache genügt, wenn sie dieselbe Information trägt.

**Die Kugel bleibt Auskunft, nicht Dekoration:** Durchmesser wächst mit der
Mitgliederzahl (gedeckelt), private Kreise tragen die geschlossene zweite Schale, die
Farbe steht fest aus dem Slug. Der Kern sitzt je nach Kreis anders im Hof, damit nicht
alle dasselbe Gesicht haben. Ember kommt nie vor.

**Enforced by:** `src/web/orb.js`, `circleTile()`, `tileGrid()`; die Farben kommen wie am
Himmel über den nonce-signierten Style-Block, damit Inline-Styles verboten bleiben.

## D20 — App-Zuschnitt: Leiste oben, Tabs unten, Pillen dazwischen

**Chosen:** oben eine App-Leiste (links zurück, in der Mitte wo man ist, rechts eine
Handlung), unten eine Tab-Leiste mit vier Zielen und der einen Handlung erhöht in der
Mitte, dazwischen große gefüllte Pillen-Schaltflächen mit klarer Rangfolge. Das Profil
bekommt großen Avatar, Handle und eine Zahlenzeile.

**Why:** die alte Kopfzeile war eine Linkliste, die auf dem Handy drei Zeilen fraß und
trotzdem nicht sagte, wo man ist. Der App-Zuschnitt beantwortet beides in einer Zeile und
gibt dem Daumen unten feste Ziele. Vier statt bisher drei, weil Strom und Profil sonst nur
über Umwege erreichbar waren.

**Was dabei nicht mitgekommen ist:** die Zahlenzeile zeigt nur, was ein Konto freigegeben
hat. Wo nichts freigegeben ist, steht das als Satz da — statt einer Null, die eine Aussage
über den Menschen vortäuscht. Der Support-Button bleibt Ember und wird nie zur gefüllten
Hauptsache; die Hauptsache ist immer Blau.

**Icons stehen nie allein.** In der Tab-Leiste steht unter jedem ein Wort, überall sonst
tragen sie ein `aria-label`. Ein Icon, das man raten muss, ist eine Zumutung — besonders
für Leute, die diese Bildsprache nicht gewohnt sind.

**Enforced by:** `src/web/icons.js`, `layout()`, `profilePage()`; `tests/ui.test.js` prüft
die vier Ziele plus Handlung, dass jedes Icon ein Wort hat, den aktiven Zustand, den Weg
zurück, genau eine Überschrift erster Ordnung je Seite, und dass die Beitragszahl aus dem
Konto stammt statt aus der gerade gezeigten Seite.

## D18 — Der Himmel: eine Fläche zum Schieben statt eines Rasters zum Abklicken

**Chosen:** die Startseite ist eine Fläche, die größer ist als der Bildschirm. Kreise
liegen darin als weiche Wolken; man schiebt sie mit Finger, Trackpad oder Pfeiltasten
und findet dabei Dinge, die man nicht gesucht hat. Eigene Kreise liegen links, wo die
Fläche beginnt, unbekannte rechts jenseits des Randes.

**Why:** das Kachelraster (D15) war korrekt und zu starr — jede Auskunft kostete einen
Klick. Auf einer Fläche gibt jede Wolke von sich aus Auskunft (Name, Art, Größe, Zustand),
und sobald Zeiger oder Tastaturfokus sie erreicht, klappt die Vorschau mit Zweck und
letztem Beitrag auf. Der Klick ist erst nötig, wenn man wirklich hineingeht — und aus der
Wolke führt ein zweiter Weg direkt ins Schreibfeld statt über zwei Seiten.

**Warum nicht radial:** eine Fläche ohne Skript startet immer oben links. Dort soll das
Eigene liegen, nicht Leere. Deshalb Bänder statt Ringe.

**Positionen sind fest:** aus dem Slug abgeleitet. Ein Kreis liegt morgen dort, wo er
heute lag. Ein Himmel, der sich bei jedem Laden neu sortiert, wäre kein Ort, sondern ein
Spielautomat.

**Weiterhin ohne JavaScript.** Das Schieben macht der Browser selbst. Die Drift der Wolken
ist CSS und hält sich an `prefers-reduced-motion`; im reizarmen Modus werden aus den Wolken
ruhige Scheiben ohne Verlauf. Dieselben Kreise stehen zusätzlich als schlichte Liste unter
der Fläche — für Tastatur, Screenreader und alle, denen das gerade zu viel ist.

**Enforced by:** `src/web/sky.js`, `skyPage()`; `tests/ui.test.js` prüft Determinismus,
die Bänder, die Größendeckelung, die Ränder und dass keine Wolke Links verschachtelt.

## D19 — Erzeugte Styles brauchen einen Nonce, Inline-Styles bleiben verboten

**Chosen:** `style-src 'self' 'nonce-…'` erlaubt genau einen erzeugten `<style>`-Block pro
Seite — für Dinge, die sich erst zur Laufzeit ergeben, etwa die Wolkenpositionen.
`style="…"`-Attribute bleiben verboten.

**Why:** beim Bau des Himmels fiel auf, dass sieben vorhandene Inline-Styles von der CSP
längst verworfen wurden — sie waren still wirkungslos. Genau deshalb bleibt das Verbot: ein
Fehler, den man sieht, ist besser als eine Regel, die heimlich nichts tut. Die Styles
wurden in Klassen überführt.

**Enforced by:** `sendHtml()`; `tests/ui.test.js` prüft Nonce, Header und die Abwesenheit
von Inline-Styles.

## D15 — Kachelraster statt Liste, und ein Zeichen, das etwas aussagt

*(Überholt durch D18 für die Startseite. Die Kacheln und das Kreiszeichen leben in der
Suche weiter.)*

**Chosen:** die Startseite ist ein Bento-Raster aus Kreiskacheln, ab dem kleinsten Gerät
zweispaltig. Die große Kachel gehört dem Kreis, in dem gerade etwas passiert — erst
Frisches, dann zuletzt Geschriebenes — und zeigt eine Vorschau des letzten Beitrags
(nie eines mit Inhaltshinweis, den öffnet man bewusst). Jeder Kreis trägt ein
deterministisch aus seinem Slug erzeugtes Zeichen.

**Why:** die Vorlage für dieses Raster arbeitet mit glänzenden 3D-Kugeln als
Kachelidentität. Für lamb wäre das falsch: Airbrush-Orbs sind Dekoration, die nichts über
den Raum aussagt, und sie ziehen die Marke ins Verspielte. Stattdessen ist das Zeichen eine
Variante des Presence Rings und **lesbar**: Punkte auf dem Ring wachsen mit der
Mitgliederzahl (gedeckelt, weil ab einer Größe mehr Punkte nichts mehr sagen), private
Kreise tragen eine geschlossene zweite Schale. Man sieht der Kachel an, ob ein Kreis groß
und ob er zu ist, bevor man den Text liest.

**Reichweite bestimmt hier nichts:** der größte Kreis bekommt keinen Platzvorteil, nur der
aktivste. Und Frisches wird markiert, nicht dauerhaft gezählt — eine Null erscheint nie.

**Enforced by:** `src/web/sigil.js`, `circleTile()`/`clusterPage()`; `tests/ui.test.js`
prüft Determinismus, die Deckelung, die private Schale und dass Ember im Zeichen nie
vorkommt.

## D16 — Aktionsleiste mit genau drei Zielen

**Chosen:** eine schwebende Leiste in Daumenreichweite: Kreise · + · Finden. Das „+" führt
nicht zu einem Textfeld, sondern zu der Frage **„Wo willst du das sagen?"** mit den eigenen
Kreisen als Kacheln.

**Why:** bei lamb schreibt man immer in einen bestimmten Kreis. Wenn die Frage nach dem
Publikum erst nach dem Text kommt, hat man den Text schon für ein imaginäres Publikum
geschrieben. Sie gehört davor. Und die Leiste bleibt bei drei Zielen — eine, die alles
anbietet, hilft bei nichts.

**Enforced by:** `layout()`, `composePage()`; `tests/ui.test.js` prüft die Zahl der Ziele
und dass auf der Compose-Seite noch kein Textfeld steht.

## D17 — Das Schreibfeld im Kreis ist eingeklappt

**Chosen:** ein Kreis öffnet mit dem, was andere gesagt haben; das Schreibfeld liegt
darüber als zusammengeklapptes `<details>` und geht bei einem Fehler von selbst auf.

**Why:** ein leeres Feld ganz oben ist eine Aufforderung zu senden, bevor man gelesen hat.
Nativ eingeklappt heißt außerdem: kein JavaScript — die Oberfläche kann weiterhin nichts
einblenden, nachladen oder sich merken.

**Enforced by:** `circlePage()`; `tests/ui.test.js` prüft die Reihenfolge und dass keine
Seite ein Skript ausliefert.

## Open questions for co-creation

These are deliberately unresolved in code — they belong to WP2, not to the
engineers:

- Should the reply cool-down scale with thread heat, or stay a flat 30 seconds?
- Is "quiet voices first" the right second feed, or should the slot go to a
  topic feed?
- Should a paused account show a tombstone to followers, or nothing at all?
- What is the right default for `sessionLimitMinutes` — off, or a suggested value?
