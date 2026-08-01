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

## D26 — Warmes Papier statt nächtlichem Blau

**Chosen:** Plakat, Suche und Kreisseiten stehen auf warmem, hellem Papier (`#F7F4EE`) mit
dunkler Serifenschrift, weißen Karten ohne Kontur und feinen Bogenlinien im Hintergrund.
Die eine Handlung ist dunkel gefüllt. Die Farbe kommt von den Kugeln, nicht vom Grund.
Auch der App-Grund ist von kühlem Grau auf denselben warmen Ton gewechselt.

**Why:** Angleichung an die Referenz, auf ausdrücklichen Wunsch. Das kehrt zwei frühere
Entscheidungen um, und das gehört gesagt: D18/D22 hatten das Plakat als nächtlichen Himmel
festgelegt, und die Markendoku hatte warmes Creme ausdrücklich ausgeschlossen, weil es als
Klischee gilt. Die Referenz des Auftraggebers schlägt meine Vorsichtsregel — und der
Unterschied zum Klischee liegt ohnehin woanders: nicht Terrakotta als Akzent, sondern
körnige blau-violette Kugeln.

**Was dabei nicht aufgeweicht wurde:** Ember bleibt die Farbe des Supports. Die Palette der
Kugeln ist um Gold und Türkis erweitert, damit die Referenzkomposition aus warm und kühl
aufgeht — beide sind deutlich von Ember abgesetzt, und ein Test prüft, dass Ember in keiner
Kugeldatei vorkommt.

**Die Bogenlinien** sind ein Daten-URI, also ohne Anfrage, liegen ganz hinten und behaupten
nichts — sie geben dem Papier nur Bewegung.

**Enforced by:** `src/web/style.js`, die Paletten in `landing.js`, `stage.js`, `orb.js`,
`sky.js`; `tests/ui.test.js`.

## D25 — Die Bühne: eine Welt vom Plakat bis in den Kreis

**Chosen:** wer auf der Startseite sucht, bleibt in derselben Welt. Suchergebnisse und
Kreisseiten stehen auf demselben Himmel, mit denselben körnigen Kugeln im Hintergrund;
darüber liegen helle Karten. Oben der gesuchte Kreis mit seiner Kugel als Bild und dem
Namen in der Serifenschrift, darunter die Beiträge — jeder mit Support-Button und den
ersten Kommentaren **in derselben Karte**.

**Why:** ein Suchfeld, das in ein optisch anderes Produkt führt, bricht das Versprechen der
Startseite. Und ein Gespräch, das man erst aufklappen muss, ist keins: Deshalb liefert der
Kreisverlauf die ersten Antworten gleich mit, statt nur eine Zahl zu zeigen.

**Gäste dürfen mitlesen.** Öffentliche Kreise sind öffentlich; ohne Konto fehlen nur
Support und Antworten, und die Seite sagt das in einem Satz, statt eine Anmeldewand zu
bauen.

**Die Kugeln sind hier Dekoration**, kein Spielzeug: keine Skripte auf Inhaltsseiten, also
nichts zu schieben. Sie liegen an den Rändern und hinter den Karten.

**Zwei Fehler, die erst der Browser gezeigt hat:** Die Kugeln lagen zuerst *vor* den Karten
— ein positioniertes Element malt über statischen Inhalt, auch bei `z-index: 0`, also
brauchen die Karten auf der Bühne ausdrücklich eine eigene Ebene. Und beim Auftrennen von
`postArticle` blieb das schließende `</article>` im Inneren stehen, wodurch die Kommentare
außerhalb ihrer Karte landeten.

**Enforced by:** `src/web/stage.js`, `circlePage()`, `discoverPage()`, `circleTimeline()`;
`tests/ui.test.js` prüft die fortgeführte Welt, den Kreiskopf, Beitrag + Support + Kommentar
in einer Karte, den Gastzugang und die Skriptfreiheit.

## D23 — Körnig und verblassend, nicht glatt

**Chosen:** alle Kugeln — auf dem Plakat, auf den Kacheln, am Himmel — tragen dieselbe
Körnung und verblassen zum Rand hin. Das Korn ist ein `feTurbulence`-Rauschen als
Daten-URI in einer einzigen CSS-Variablen.

**Why:** glatt gerenderte Verläufe sehen nach Glas aus. Körnig und mit weicher Kante sehen
sie nach Farbe auf Papier aus, und genau das war gemeint. Die weiche Kante macht dabei
mehr als hübsch zu sein: Eine Kugel mit harter Kante liegt *auf* dem Himmel, eine
verblassende liegt *in* ihm.

**Zwei Dinge, die beim Bauen zu lernen waren:** Ein Weichzeichner auf der Kugel bügelt
genau das Korn weg, um das es geht — die Weichheit muss aus der Maske kommen, nicht aus
`blur`. Und die Korngröße muss fest sein (`background-size`), sonst wird das Rauschen auf
großen Kugeln zu Flecken und auf kleinen zu Staub.

**Als Daten-URI**, also ohne eine einzige Anfrage: kein Bild vom Server, nichts, was ein
Zählpixel sein könnte.

**Enforced by:** `--grain` in `src/web/style.js`; `tests/ui.test.js` prüft, dass alle drei
Stellen dieselbe Variable benutzen und dass die Kugeln eine Maske tragen.

## D24 — Eine Serifenschrift für die eine große Zeile

**Chosen:** die Überschrift der Startseite steht in einer Serifenschrift aus dem
Systemstapel, groß, zweizeilig, tiefer als die Bildmitte. Die Anwendung selbst bleibt bei
der Sans.

**Why:** so sieht die Vorlage aus, und der Kontrast trägt: eine ruhige, klassische Zeile
über einer Oberfläche, die sonst nüchtern gesetzt ist. Keine Webschrift — die CSP lädt
nichts von fremden Servern, und eine eingebettete Schriftdatei wöge mehr als die halbe
Seite.

**Enforced by:** `--serif` auf `body.landing`, `.stage-title`.

## D31 — Rückhalt ist ein Ort, kein Gefühl: der geschützte Raum

**Chosen:** wenn zwei Menschen im selben Kreis jeweils hinter einem Beitrag der anderen
stehen, können sie einen **Rückhalt-Raum** öffnen: einen privaten Kreis für genau zwei, in
dem beide moderieren. Er ist die letzte Stufe des Wegs (D30). Er entsteht nie einseitig, und
er entsteht nie durch eine Einladung — nur aus zwei Handlungen, die vorher im Kreis sichtbar
waren. Zweimal Öffnen führt in denselben Raum; die Adresse ist aus den beiden Konten
gebildet.

**Warum ein privater Kreis und keine neue Sache:** für private Kreise gilt schon alles, was
hier gelten muss — sie verlassen diesen Server nie, existieren für Nichtmitglieder nicht
einmal als Seite, und ihre Sichtbarkeit hängt an der Art des Kreises statt an einer
Einstellung, die man versehentlich umstellt. Ein zweiter Mechanismus daneben wäre ein
zweiter Ort, an dem dieselben Zusicherungen neu bewiesen werden müssten.

**Warum das den Schutzboden für Minderjährige (D9) nicht aushebelt:** `dmFrom` schützt davor,
dass Fremde privat anschreiben können. Hier gibt es keine Fremden — beide Seiten haben
vorher, im Kreis und sichtbar, etwas füreinander getan. Ohne die zweite Handlung entsteht
der Raum für niemanden, auch nicht für Erwachsene, auch nicht für die Moderation.

**Grenze:** Rückhalt aus einem anderen Kreis öffnet hier keine Tür. Sonst wäre der Kreis
nicht mehr die Grenze, die er sein soll.

**Enforced by:** `src/domain/rueckhalt.js` (`mutualSupporters`, `openRaum`), die Route
`POST /c/:slug/rueckhalt` in `src/server.js`; `tests/circles.test.js` prüft, dass einseitiger
Rückhalt keinen Raum öffnet, dass beide Seiten im selben Raum landen, dass Dritte den Raum
weder sehen noch seine Beiträge irgendwo sonst zu Gesicht bekommen, dass er nicht föderiert
und dass Rückhalt aus anderen Kreisen nicht zählt. `tests/ui.test.js` prüft die Absage über
HTTP.

## D30 — Die vier Ansichten sind ein Weg, kein Menü

**Chosen:** ein Kreis hat vier Ansichten, und sie stehen in dieser Reihenfolge:
**Leute — Gespräch — Themen — Rückhalt**. Das ist der Weg durch die Plattform: man
verbindet sich mit Menschen (Leute), fängt an zu reden (Gespräch), aus Zuwendung werden
Themen (ein Beitrag wird erst zum Thema, wenn jemand geantwortet hat oder dahintersteht),
und daraus wird Rückhalt — der persönlichste Ort im Kreis. Ein Klick tauscht **nur die
Kugeln im Inhaltsfenster**; Kopfleiste, Kreiskopf, Ansichtszeile und Schreibfeld bleiben
stehen. Nach rechts wird es sichtbar dichter: die Kugeln wachsen (`--od-scale` 0,82 → 1,24)
und rücken zusammen. Jede Stufe sagt in einem Satz, wofür sie da ist.

**Und:** die Kugeln, die nur zur Zierde im Hintergrund lagen, sind weg — auf der Kreisseite
wie auf der Suche. Eine Kugel steht jetzt für einen Menschen, ein Thema, eine Nachricht oder
einen Rückhalt. Für nichts sonst. Auf dem abgemeldeten Plakat bleiben sie, dort *sind* sie
das Bedienelement.

**Why:** die Reihenfolge ist die Produktthese. Wenn sie nur in der Dokumentation steht und
die Oberfläche vier gleichrangige Reiter zeigt, ist sie nicht gebaut. Die Tiefe entsteht
nicht durch mehr Fläche, sondern durch mehr Nähe — deshalb wächst die Kugel, statt dass eine
Ebene mehr Ornament bekommt. Wie persönlich es wird, entscheidet ohnehin niemand im Design,
sondern die Interaktion: Themen und Rückhalt existieren nur, soweit Menschen sie erzeugt
haben.

**Enforced by:** `ANSICHTEN`/`TIEFE` und `orbRow()` in `src/web/views.js`, `circleThreads()`
in `src/domain/circles.js` (die Bedingung „Antwort oder Rückhalt“), `.tiefe-1…4` in
`src/web/style.js`; `tests/ui.test.js` prüft die Reihenfolge der vier Wörter, die Stufe je
Ansicht, dass jede Ansicht eigene Kugeln trägt, dass Unbeantwortetes kein Thema ist — und
dass keine Deko-Kugeln mehr ausgeliefert werden.

## D29 — Die Kugel ist der Inhalt, nicht die Verzierung

**Chosen:** im Gespräch ist jede Nachricht eine Kugel mit Text daneben — und die Kugel ist
das interaktive Stück: sie klappt auf und zeigt, wer da spricht (mit Weg zum Profil), wie
der Rückhalt steht und wie man antwortet. Die Kugeln liegen nicht in einer Flucht: Größe,
seitlicher Versatz und Höhe streuen. Die Farbe gehört dem Menschen — daran erkennt man ihn
über den ganzen Verlauf wieder —, Größe und Versatz gehören dem Beitrag.

**Why:** „verspielt“ und „vorhersehbar“ sind kein Widerspruch, wenn die Streuung erzeugt
statt gewürfelt ist: aus dem Beitrag gerechnet sieht sie zufällig aus und ist bei jedem
Aufruf dieselbe. Ein Gespräch, das jedes Mal anders aussieht, wäre nicht verspielt, sondern
unbrauchbar. Und die Handlungen gehören an die Kugel, weil sie sonst als Knopfreihe unter
jedem Text stehen — das ist das Kartenlayout, aus dem wir gerade herausgegangen sind.

**Enforced by:** `personOrbCss()` in `src/web/orb.js`, `chatMessage()` in `src/web/views.js`
(Aufklappen ist ein `<details>` — weiterhin ohne Skript); `tests/ui.test.js` prüft, dass die
Kugeln verschieden liegen, dass dieselbe Person dieselbe Farbe behält und dass zwei Aufrufe
dieselbe Anordnung ergeben.

## D28 — Eine Navigation, eine Leiste, eine Spalte

**Chosen:** die Skizze aus der Werkstatt gilt. Oben: das Zeichen mit dem Wort „lamb“ (führt
nach Hause), in der Mitte, wo man ist, rechts zwei Knöpfe — Nachrichten und Einstellungen.
Unten: **genau eine feste Leiste**, und darin steht das Schreibfeld — in einem Kreis das
Feld dieses Kreises, sonst der Weg zur Kreiswahl plus die Suche. Dazwischen: eine Spalte
aus Kugeln unterschiedlicher Größe mit Text daneben.

**Was dafür weggefallen ist:** die fünfteilige Tab-Leiste unten (D20), der Zurück-Pfeil
oben, das Kreis-Plakat mit Kugel und Serifen-Namen, die vier bunten Ansichtskugeln (jetzt
eine Zeile Wörter), Chat-Blasen als Karten und die Rechts-Ausrichtung eigener Nachrichten.
Für angemeldete Menschen fällt auch die Fußzeile weg — was dort stand, steht in den
Einstellungen.

**Why:** jedes einzelne dieser Elemente war für sich begründbar, und zusammen waren sie zu
viel: zwei Navigationen für eine App, in der man eigentlich immer nur an einem Ort ist, und
drei Bildsprachen (Kugel, Gesicht, Karte) für dieselbe Sache. Die Skizze hat nichts Neues
eingeführt — sie hat entschieden, was bleibt. Der Kreisname steht jetzt einmal statt zweimal,
der erste Bildschirm beginnt mit dem Gespräch, und die Kugel ist die einzige Bildsprache:
sie trägt jetzt auch Menschen, mit Größe und Farbe aus dem Namen.

**Enforced by:** `layout()` (Kopfleiste, `writebar`), `chatMessage()`, `viewSwitch()` in
`src/web/views.js`, `personOrbCss()` in `src/web/orb.js`; `tests/ui.test.js` prüft, dass es
keine Tab-Leiste mehr gibt, dass die Schreibleiste überall dieselbe ist, dass der Kreisname
nur einmal vorkommt und dass jede Nachricht ihre eigene Kugel bekommt.

## D27 — Ein Kreis ist ein Chatfenster, und die Ansichten sind eine Zeile Wörter

**Chosen:** ein Kreis öffnet als Gespräch: Nachrichten laufen von alt nach neu, jede in
einer Blase neben dem Gesicht der Sprecherin, eigene rechts. Support und Antworten stehen
in der Blase, die ersten Antworten darunter. Das Schreibfeld liegt fest am unteren Rand
über der Fußleiste. Über dem Gespräch liegt eine Reihe aus vier Kugeln — Gespräch, Themen,
Leute, Rückhalt —, die dieselbe Fläche umschalten (`?ansicht=…`), serverseitig auf diese
vier begrenzt, mit Gespräch als Rückfall. (Die Reihe war zuerst aus vier bunten Kugeln; seit
D28 ist sie eine Zeile Wörter.)

**Why:** die Zielgruppe schreibt in Chats, nicht in Feeds; ein Kreis ist ohnehin ein Raum
mit bekannter Mitgliedschaft, also soll er sich auch so anfühlen. Die vier Ansichten machen
aus derselben Unterhaltung vier Fragen — worüber wird geredet, wer ist hier, was wird
getragen —, ohne dass man den Raum verlässt. „Rückhalt“ sortiert bewusst nach letzter
Unterstützung, nicht nach Menge: eine Liste nach Menge wäre wieder eine Rangliste, und die
gibt es hier nicht (D6).

**Enforced by:** `circleThreads`/`circlePeople`/`circleSupported` in `src/domain/circles.js`,
`circlePage()`/`orbRail()` in `src/web/views.js`, die Ansichts-Whitelist in `src/server.js`;
`tests/ui.test.js`, Block „Chatfenster“.

**Zwei Fallen, die dabei zugeschnappt sind:** die Fußleiste wurde ausgeliefert, aber nie
gestaltet — fünf nackte Links untereinander, im Code unsichtbar, im Bild sofort. Und ein
`position: sticky` mit Abstand zum unteren Rand zieht das Schreibfeld *nach oben in den
Inhalt*, sobald die Seite kürzer ist als der Bildschirm; es liegt jetzt fest. Beides prüft
`tests/ui.test.js` gegen das Stylesheet.

## D22 — Die Startseite ist die eine Ausnahme von der Skriptfreiheit

**Chosen:** die abgemeldete Startseite ist ein Plakat: „lamb ist hier“, darunter ein
Suchfeld, davor Kugeln, die man mit dem Finger schieben kann und von denen beim Scrollen
weitere hereintreiben. Dafür lädt genau diese eine Seite ein Skript. Überall sonst bleibt
`script-src 'none'`.

**Why:** Ziehen und Erzeugen sind Dinge, für die CSS keinen Weg hat — das war nicht
verhandelbar. Die Frage war nur, wie weit die Ausnahme reicht. Sie reicht bis zu dieser
Seite und keinen Schritt weiter, und ein Test hält die Grenze fest, damit sie nicht leise
wächst.

**Was das Skript nicht tut**, und was ebenfalls geprüft wird: nichts nachladen, nichts
messen, nichts merken — kein `fetch`, kein Speicher, keine Kennung. Und die Zahl der
Kugeln ist gedeckelt; unendlich nachlegen wäre genau das Muster, das dieses Produkt sonst
ablehnt.

**Ohne Skript** liegen die fünf Kugeln still an ihrem Platz, und Überschrift, Suche und
Anmeldung funktionieren vollständig.

**Zwei Regeln aus dem Bau:** Die Kugeln liegen an den Rändern, nie über der Mittelbahn —
eine Seite, deren Suchfeld von einer Kugel verdeckt wird, ist hübsch und unbenutzbar. Und
das Kugelfeld nimmt selbst keine Eingaben an (`pointer-events: none`), nur die Kugeln; sonst
fängt es jeden Klick ab. Beides ist beim Ausprobieren im Browser aufgefallen, nicht beim
Schreiben.

**Diese Seite folgt bewusst nicht dem Hell/Dunkel-Wechsel.** Sie ist ein Plakat und bleibt
der abendliche Himmel — eine Entscheidung, kein Versäumnis; überall sonst gilt weiter beides.

**Enforced by:** `src/web/landing.js`, `src/web/orbs.client.js`, `sendHtml({ allowScript })`;
`tests/http.test.js` und `tests/ui.test.js`.

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
