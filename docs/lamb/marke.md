# lamb — Marke und Designsystem

Visuelles Referenzdokument: `design/lamb.html` (gerendert), Tokens: `design/lamb-tokens.css`.

## 1. Positionierung in einem Satz

**lamb ist der Kreis, der um dich herum steht** — ein dezentrales soziales Netz für
15- bis 24-Jährige in Europa, in dem Rückhalt der soziale Grundcode ist und Debatte eine
Form hat.

Die Marke muss zwei Dinge gleichzeitig können, und dieser Spagat ist die eigentliche
Designaufgabe:

| Sie muss sich anfühlen wie … | Und aussehen wie … |
| --- | --- |
| Freund:innen, die zu einem stehen | eine Institution, der man ein Youth Panel anvertraut |
| ein Raum, in dem man offen reden kann | ein Ort, den eine Schule oder Kommune ernst nimmt |

Alles, was nur eines von beidem bedient, fällt raus. Deshalb kein Wellness-Register
(bedient nur links), kein Behörden-Deutsch (bedient nur rechts).

## 2. Markenkern

| Prinzip | Bedeutung |
| --- | --- |
| **Rückhalt** | Der soziale Grundcode ist Unterstützung, nicht Bewertung. Support kostet Haltung. |
| **Überschaubarkeit** | Räume mit Namen und Gesichtern statt anonymer Reichweite. Man weiß immer, vor wem man spricht. |
| **Fairness** | Debatte hat ein Verfahren: Standpunkte, Nachfragen, Abwägen, Ergebnis. Moderation ist sichtbar. |
| **Portabilität** | Offene Protokolle. Wer geht, nimmt Profil, Beiträge und Kontakte mit. |

## 3. Abgrenzung (das Anti-Briefing)

Die Ausschreibung verlangt Neutralität — überparteilich, nicht „öko“, nicht spirituell.
Das ist keine Geschmacksfrage, sondern Voraussetzung dafür, dass ein Youth Panel als
legitimes Verfahren gilt. Konkret verboten:

| Nicht das | Sondern das |
| --- | --- |
| Achtsamkeit, Healing, Journey, Awakening | Mitreden, Rückhalt, Ergebnis |
| Blätter, Sonnen, Mandalas, Handlettering | Kreise, Cluster, Ringe, klares Raster |
| Dominantes Grün, Erdtöne, Aquarellverläufe | Ziviles Blau, ein warmer Akzent, ruhige Flächen |
| Likes, Streaks, Bestenlisten, Trophäen | Support, Räume, Panel-Protokolle |
| Politische Signalfarben und -symbole | Eine Palette, die keiner Seite gehört |

**Grün kommt in der Marke nicht vor** — auch nicht als „Erfolg“. Bestätigte Zustände tragen
Blau. Das entzieht der Plattform die stärkste „Öko“-Assoziation an der Wurzel, statt sie
nachträglich zu dosieren.

## 4. Farbe

Eine laute Farbe, und die gehört dem Support.

| Rolle | Wert | Verwendung |
| --- | --- | --- |
| lamb-Blau | `#2B4C9B` | Primärfarbe: Navigation, Struktur, Buttons, bestätigte Zustände |
| Ember | `#DC6B45` | **ausschließlich** Support-Elemente |
| Forum | `#5B57C4` | **ausschließlich** Youth-Panel-Kontexte |
| Slate Ink | `#14171D` | Text |
| Fog | `#F2F3F5` | Grundfläche (kühl, blaustichig — kein Creme) |
| Muted | `#5E636E` | Sekundärtext |
| Hinweis / Meldung | `#A96613` / `#A8322A` | semantisch, nie Akzent |

Die Neutralen sind bewusst blaustichig gewählt, damit sie unter dem Primärblau „gewählt“
und nicht geerbt wirken. Ein reines Mittelgrau würde die Palette zufällig aussehen lassen.

Weil Ember nur an genau einer Stelle im Produkt vorkommt, bekommt die Support-Geste
visuelles Gewicht im gesamten Interface, ohne dass irgendwo geschrien wird. Das ist der
Kern der Farbstrategie: Knappheit erzeugt Bedeutung.

Kontrastwerte sind in `design/lamb-tokens.css` nachgerechnet dokumentiert; alle
Textkombinationen erfüllen WCAG 2.2 AA, die meisten AAA. Ember als Fläche trägt nur das
Button-Label, nie Kleintext.

## 5. Typografie

Drei Rollen, klar getrennt:

| Rolle | Charakter | Einsatz |
| --- | --- | --- |
| **Display** | eng gesetzt, `-0.038em` Tracking, Gewicht 750–800 | Überschriften, Raumnamen |
| **Body** | luftig, 1.6 Zeilenhöhe, max. 64 Zeichen Zeilenlänge | Beiträge, Fließtext |
| **Utility (Mono)** | `tabular-nums`, versal, `0.1em` Tracking | Raum-IDs, Phasen, Zeiten, Zähler |

Die Mono-Ebene ist die eigentliche Designentscheidung. Sie zeigt an, was das *System* weiß
(Phase 03 · noch 6 Min · 128 Mitglieder) im Unterschied zu dem, was *Menschen* sagen. Das
gibt lamb eine sachliche, zivile Kante — und trennt es von jedem Wellness-Look, ohne kalt
zu wirken, weil daneben Ember und die runden Formen stehen.

Empfehlung für die Produktion: *Inter Tight* (Display) und *Inter* (Body), beide OFL, damit
das Open-Source-Versprechen auch für die Schrift gilt.

## 6. Formsprache

Die visuelle Metapher ist der Kreis, der jemanden umschließt.

- **Presence Ring** — das Signature-Element: Avatar-Punkte auf einem Bogen um eine Person
  oder eine Raumkarte. Es erscheint im Logo, im Onboarding und als Support-Icon
  (ein Bogen, der sich über einen Punkt legt).
- **Radien**: 10 / 16 / 24 px, Pillen für alle Aktionen. Nichts hat scharfe Ecken.
- **Cluster statt Strom**: Raumkarten in einem Raster, nicht Beiträge in einer Spalte.
- **Avatare als Ringe**, überlappend, mit `+125` als Abschluss — Gruppe vor Zahl.

## 7. Logo

Ein Kreis (Blue, 2px Kontur) mit einem gefüllten Kern (Ember). Gelesen: die Gruppe außen,
die Person innen. Funktioniert ab 16 px, einfarbig, und als Favicon. Keine Wortmarke nötig,
wenn der Kreis steht — die Wortmarke setzt daneben in Display 750.

## 8. Nutzung im Prototypen

`design/lamb-tokens.css` ist direkt einsetzbar. Die Tokens sind mit `--hd-` präfixiert,
damit sie neben dem bestehenden System in `src/web/style.js` laufen können, statt es zu
überschreiben.
