# Huddle — Produktkonzept

## 1. Raumtypen

Huddle hat keine globale Timeline. Es hat Räume, und jeder Raum hat einen Typ, der sein
Verhalten bestimmt — nicht nur sein Label.

| Typ | Beispiel | Sichtbarkeit | Beitritt | Besonderheit |
| --- | --- | --- | --- | --- |
| **Privater Kreis** | Freundeskreis, Familie | nur Mitglieder | Einladung | Screenshots sind Regelverstoß; föderiert nicht nach außen |
| **Themen-Huddle** | Abi & danach, Gaming, Kultur | öffentlich lesbar oder geschlossen | offen oder auf Anfrage | Feed-Modus wählbar |
| **Mental-Health-Huddle** | Moderierter Themenraum | geschlossen | auf Anfrage | Peer-Moderation als Anwesenheit sichtbar; Inhaltshinweise Standard; keine Zitierfunktion |
| **Lokaler Huddle** | Leipzig 15–24 | öffentlich | offen, an Ort gebunden | Brücke zu Angeboten vor Ort |
| **Youth Panel** | Handys an Schulen | öffentlich, Protokoll zitierbar | Platz sichern, begrenzte Teilnehmendenzahl | Verfahren mit fünf Phasen, feste Moderation |

**Die Regel dahinter:** Ein Mensch ist nie in „dem Netzwerk“, sondern immer in einem
konkreten Raum mit bekannter Öffentlichkeit. Das ist die strukturelle Antwort auf
Kontextkollaps — die Mechanik, die auf großen Plattformen dazu führt, dass ein Satz für
Freund:innen plötzlich vor 40.000 Fremden steht.

## 2. Support statt Like

Ein Like sagt „cool“. Support sagt „ich stehe dahinter“. Damit das kein umbenannter Button
ist, verhält es sich anders:

1. **Namen statt Zahlen.** Im Raum steht „Mira, Jonas und 4 weitere stehen dahinter“.
   Eine nackte Gesamtzahl gibt es nirgends im Produkt.
2. **Keine Bestenliste.** Support ist nie raumübergreifend vergleichbar. Es existiert kein
   Ort, an dem Menschen nach Support sortiert werden.
3. **Sichtbarkeit mit Halbwertszeit.** Support hebt einen Beitrag im eigenen Raum um wenige
   Plätze an; der Effekt klingt über 48 Stunden ab. Nichts bleibt oben, weil es einmal gut lief.
4. **Support an schweren Beiträgen führt weiter.** Wer einen Beitrag mit Inhaltshinweis
   unterstützt, bekommt danach „Antworten“ und „Nur nachfragen, wie es geht“ angeboten.
   Rückhalt soll in Zuwendung münden, nicht im Klick enden.
5. **Nie automatisch.** Weiterleiten, Zitieren oder Verlinken löst niemals Support aus.

Föderation: Support wird als `Like` über ActivityPub übertragen, damit andere Server es
verstehen — die Semantik („steht dahinter“) und die Anzeigeregeln liegen bei Huddle. Was
fremde Server daraus machen, kann Huddle nicht kontrollieren; deshalb ist die
Nicht-Vergleichbarkeit im eigenen Produkt verankert, nicht im Protokoll.

## 3. Feed-Modi

Pro Raum wählbar. Jeder Modus erklärt sich in einem Satz über dem Raum.

| Modus | Was er tut | Verfügbar |
| --- | --- | --- |
| **Chronologisch** (Standard) | Neueste zuerst, keine Gewichtung | überall |
| **Themen** | Nach Gesprächsfäden gruppiert statt nach Zeit | Räume ab ~50 Mitgliedern |
| **Balanced** | Hält die weniger vertretene Seite einer Diskussion sichtbar | Panels und Themenräume |

Für alle drei gilt: kein Modus nutzt Verweildauer, Scrollverhalten oder abgeleitete
Interessen — diese Daten werden gar nicht erst erhoben. Und keiner lädt beim Scrollen nach;
Weiterblättern ist immer eine bewusste Handlung mit einem klaren Ende („Das war alles. Es
lädt nichts von allein nach.“).

## 4. Youth Panels

Ein Panel ist kein Kommentarbereich, sondern ein Verfahren.

| # | Phase | Dauer | Was passiert |
| --- | --- | --- | --- |
| 01 | Frage klären | 5 Min | Die Frage wird im Wortlaut festgelegt; wer sie einbrachte, ist genannt |
| 02 | Standpunkte | 15 Min | Positionen werden gesammelt, **paarweise nebeneinander** dargestellt |
| 03 | Nachfragen | 10 Min | Nachfragen richten sich an den Standpunkt, nicht an die Person |
| 04 | Abwägen | 10 Min | Was trägt, was nicht, wo bleibt Uneinigkeit |
| 05 | Ergebnis | 5 Min | Protokoll wird festgehalten und veröffentlicht |

**Gestalterisch entscheidend:** Standpunkte stehen zweispaltig und gleich groß. Zustimmung
und Widerspruch bekommen exakt dieselbe Fläche — Überparteilichkeit als Layoutregel, nicht
als Absichtserklärung. Wer schon zweimal nachgefragt hat, wartet, bis andere dran waren.

**Das Panel-Protokoll** ist das eigentliche Produkt: ein Dokument mit fester Adresse, das
die Frage, alle Standpunkte unverkürzt, die Einigkeiten *und ausdrücklich die
Nicht-Einigkeiten*, offene Fragen und die Moderation nennt. Es lässt sich zitieren und an
eine Schulkonferenz, einen Jugendrat oder eine Kommune weitergeben. Damit bekommt
Beteiligung einen Adressaten — der Punkt, an dem die meisten Jugendbeteiligungsformate
scheitern.

Rollen: **Moderation** (geschult, namentlich sichtbar), **Teilnehmende** (begrenzte Zahl,
Platz vorher gesichert), optional **Gast-Expert:in** (nur in Phase 03 sprechberechtigt).

## 5. Fair Play und Moderation

Fünf Regeln, die man nach einmal Lesen wiedergeben kann. Sie stehen dort, wo gehandelt wird
— nicht in einer verlinkten Nutzungsordnung:

1. Rede zur Sache, nicht über die Person.
2. Ein Nein beendet ein Thema. Auch mitten im Gespräch.
3. Was hier gesagt wird, bleibt hier. Screenshots aus privaten Huddles sind ein Regelverstoß.
4. Kein Nachtreten.
5. Bei Gefahr holen wir Menschen dazu.

### Was Technik darf — und was nicht

| Automatische Erkennung | Entscheidung trifft |
| --- | --- |
| sortiert die Meldeliste nach Dringlichkeit | Mensch |
| erkennt Muster von Nachtreten und verlangsamt | Mensch prüft nach |
| schlägt einen Inhaltshinweis vor | Autor:in |
| meldet ihre eigene Trefferschwäche je Sprache | Moderationsteam |
| **entfernt Beiträge selbstständig** | **nie** |

Jede Entfernung trägt einen Namen und eine Begründung; Betroffene sehen beides und können
widersprechen. Diese Linie ist im bestehenden Prototypen bereits implementiert und durch
Tests abgesichert (`src/domain/moderation.js`) — es gibt dort keinen Codepfad von einem
Klassifikator zur Löschung.

## 6. Onboarding — der Willkommenskreis

Drei Schritte, danach steht ein Kreis. Niemand landet in einem leeren Feed.

1. **Wer bist du hier?** Handle, Stadt (optional), Altersangabe. Die Altersangabe setzt den
   Schutzboden für unter 18 — nicht abschaltbar.
2. **Was interessiert dich?** Interessen als Chips, mindestens drei. Keine Persönlichkeits-
   oder Stimmungsabfrage.
3. **Dein Kreis steht.** Drei vorgeschlagene Räume: ein lokaler, ein thematischer, ein Youth
   Panel — **jeweils mit Begründung**, warum er vorgeschlagen wurde („weil du Leipzig als
   deine Stadt angegeben hast“). Empfehlungen ohne Begründung gibt es nicht.

Zum Abschluss die eine Erklärung, die diese Plattform ausmacht: „Bei uns gibt es kein
Gefällt mir. Es gibt Support — du gibst ihn, wenn du hinter jemandem stehst, nicht wenn du
etwas nett findest.“ Direkt daran anschließend die erste echte Support-Geste an der
Begrüßung der Moderation.

## 7. Microcopy-Prinzipien

Jedes Bedienelement sagt, was passiert. Kein Wellness-Register, kein Behörden-Deutsch.

| Kontext | Deutsch | English | Nie |
| --- | --- | --- | --- |
| Raum betreten | Huddle öffnen | Open huddle | Deinen Raum betreten |
| Beitragen | Mitreden | Join in | Deine Stimme teilen |
| Kernaktion | Support geben | Back this | Gefällt mir |
| Aktiv | Du stehst dahinter | You're backing this | Unterstützt ✓ |
| Rückhalt | Mira und 4 weitere stehen dahinter | Mira and 4 others are backing this | 5 Supports |
| Panel | Youth Panel starten | Start a youth panel | Dialograum eröffnen |
| Regeln | Fair-Play-Regeln | Fair play rules | Community-Richtlinien |
| Hinweis | Inhaltshinweis: Prüfungsdruck | Heads-up: exam stress | Trigger-Warnung |
| Pause | Kreis ruhen lassen | Put your circle on hold | Digital Detox |
| Listenende | Das war alles. Es lädt nichts von allein nach. | That's everything. Nothing loads on its own. | Du bist auf dem Laufenden ✨ |
| Meldung | Melden — ein Mensch schaut drauf | Report — a person will look at this | Verstoß einreichen |
| Weggehen | Konto mitnehmen | Take your account with you | Daten exportieren |

## 8. Verhältnis zum bestehenden Prototypen

Der Prototyp in `src/` implementiert bereits die Substanz, auf der Huddle aufsetzt:
ActivityPub-Föderation, chronologischer Standard-Feed, private Zähler, Antwortrechte am
Write-Path, Pause statt Löschen, Minderjährigen-Schutzboden, Moderation ohne
Automatik-Löschung, vollständiger Export.

Was für Huddle zusätzlich zu bauen wäre, in Reihenfolge:

| Schritt | Umfang |
| --- | --- |
| Support-Umbenennung inkl. Namensanzeige statt Zähler | klein — betrifft `reactions`, Views, AS2-Mapping |
| Räume als eigenes Konzept (Typ, Mitgliedschaft, Sichtbarkeit) | mittel — neues Datenmodell zwischen Konto und Beitrag |
| Cluster-Startseite statt globaler Timeline | mittel — Feed-Logik existiert, Navigation ändert sich |
| Youth Panels mit Phasenlogik und Protokoll | groß — eigenes Verfahren, Rollen, Zeitsteuerung |
| Huddle-Designsystem im Client | klein — Tokens liegen vor |
| Onboarding-Strecke | mittel |

Die Reihenfolge ist bewusst so gewählt, dass nach Schritt 1 und 3 bereits etwas
Vorzeigbares existiert, das sich in Co-Creation-Workshops testen lässt — die
Panel-Mechanik ist die aufwendigste und profitiert am meisten davon, vorher mit
Jugendlichen durchgespielt worden zu sein.
