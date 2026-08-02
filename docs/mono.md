# mono — ein Beitrag pro Mensch

`mono/` ist ein zweiter, eigenständiger Prototyp neben lamb. Er teilt sich nichts mit ihm
außer den Krypto-Helfern und dem Router (`src/lib/`); Datenbank, Domäne, Ansichten und
Server sind eigene Dateien, damit die beiden Ansätze sich nicht gegenseitig verformen.

## Die Idee

[Mononote](https://apps.apple.com/de/app/mononote-one-note/id6788222857) ist eine Notiz-App
mit genau einer Notiz. Man öffnet sie, schreibt, und was vorher dastand, ist weg. Kein
Verlauf, keine Ordner, keine Entscheidung darüber, wohin etwas gehört.

mono ist dieselbe Bewegung als soziales Netz: **Jeder Mensch hat genau einen Beitrag.**
Text, ein Foto oder ein Video — und sobald etwas Neues kommt, ist das Alte gelöscht.

Was daraus folgt, ist nicht Sparsamkeit, sondern ein anderes Verhältnis zur eigenen
Vergangenheit. Ein Profil ist kein Archiv, das man pflegen, bereuen oder durchsuchen kann.
Es ist ein Zustand: *Das sagt dieser Mensch gerade.* Wer etwas Wichtiges gesagt hat, muss
sich entscheiden, ob es stehen bleibt — Schreiben kostet etwas, und das ist beabsichtigt.

## Was das strukturell erledigt

| Problem der üblichen Netze | Warum es in mono nicht entsteht |
| --- | --- |
| Endloses Scrollen | Die Liste ist so lang wie die Zahl der Menschen, denen du folgst — nicht länger. Es gibt nichts nachzuladen. |
| Anhäufung und Rangfolge | Es gibt keine Beitragstabelle. Ein Beitrag ist eine Spalte auf dem Konto; zwei passen dort nicht hinein. |
| Reaktionszahlen als Währung | Es gibt keine Reaktionen. Keine Likes, keine Kommentare, keine Zählwerte — auch nicht privat. |
| Der Peinlichkeits-Rückstand | Alte Beiträge existieren nicht. Auch die alten Medien-URLs sterben beim Ersetzen (`/medien/:id` → 404). |
| Ausspielung nach Interesse | Reihenfolge ist strikt Zeit. Leseverhalten wird nirgends erfasst. |

## Modell

```
accounts   handle, display_name, password_hash
           + mono_text, mono_media_id, mono_at   ← der eine Beitrag
media      ein Blob je aktuellem Medium, alt-Text ist Pflicht
follows    wem du folgst
sessions   Anmeldung
```

Vier Tabellen, und ein Test wacht darüber, dass es vier bleiben
(`tests/mono.test.js`, „es gibt keine Beitragstabelle").

`mono/domain/mono.js` hat genau einen Schreibweg: `replace()`. Er legt zuerst das neue
Medium an, räumt dann den alten Beitrag weg und setzt den neuen. Diese Reihenfolge ist
Absicht: Wer sich beim Dateityp vertut, verliert nicht seinen bestehenden Beitrag an einen
Formularfehler.

## Seiten

| Pfad | Zweck |
| --- | --- |
| `/` | abgemeldet die Einladung, angemeldet **dein Beitrag als Feld** — was du siehst, ist was gilt |
| `/leute` | was die Menschen gerade sagen, denen du folgst — neueste zuerst |
| `/wand` | alle, die gerade etwas stehen haben |
| `/@name` | ein Mensch und sein einer Beitrag; hier wird gefolgt |
| `/medien/:id` | das Medium des *aktuellen* Beitrags, sonst 404 |
| `/anmelden`, `/registrieren`, `/abmelden` | Konto |

Kein Client-JavaScript; die CSP setzt `script-src 'none'`.

## Aussehen

Nach der Referenz: iOS-Standard, sehr zurückhaltend. Oben eine Titelleiste, in der Mitte
eine Fläche, unten das, was man drückt. Was schwebt, ist Glas — unscharfer Hintergrund,
dünne Kante, weicher Schatten, und der Inhalt zieht darunter durch. Systemschrift,
Systemblau, Hell und Dunkel je nach Gerät.

Zwei Regeln halten die Oberfläche karg:

**Kein Kasten um Dinge, die auch ohne Kasten zusammengehören.** Eine Liste ist *eine*
Fläche mit Haarlinien, nicht eine Karte je Zeile.

**Das Feld ist der Beitrag.** Auf deiner Seite steht kein Schreibfeld über einer Karte,
die dasselbe nochmal zeigt — die Fläche enthält, was gerade unter deinem Namen steht, und
was du abschickst, ersetzt es. Daraus folgt der Löschweg von selbst: Feld leerräumen,
abschicken. Deshalb gibt es keinen Löschknopf, keine Bestätigung und keinen erklärenden
Absatz darüber.

## Starten

```bash
npm run mono          # http://localhost:3100, mit zwei Demo-Konten
npm run test:mono
```

Demo-Konten `mira` und `jonas`, Passwort `mono-demo-password`.
Konfiguration: `MONO_ORIGIN`, `MONO_PORT`, `MONO_DB`, `MONO_SEED` (siehe `mono/config.js`).

## Was bewusst fehlt

Kein Antworten, kein Support, keine Direktnachrichten, keine Föderation. Jedes davon wäre
eine eigene Entscheidung, und mindestens Antworten würde die Regel sofort aushöhlen: Ein
Antwortstrang ist ein Archiv, nur mit anderem Namen. Falls es Gespräch geben soll, muss es
selbst mono-förmig sein — höchstens eine offene Antwort je Mensch und Beitrag. Das ist der
nächste Entwurf, nicht dieser.

Ebenfalls offen: Moderation und Meldewege, Altersschutz, Export. lamb hat für alle drei
etwas, das sich übernehmen ließe, wenn aus dem Entwurf mehr wird.
