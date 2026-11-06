# Vermittler-Codes

So kommt ein Vermittler-Code auf die Bewerbung, und so zählen Sie später Pool und Verträge. Alles hier bleibt auf Ihrem Rechner. Es geht nichts auf einen Server.

## Einen Vermittler anlegen

1. Nehmen Sie die nächste freie Nummer, zum Beispiel `M004`. Drei oder vier Ziffern, immer mit `M` davor.
2. Legen Sie auf Ihrem Rechner `tools/referrals/marketers.csv` an (Vorlage: `marketers.example.csv`). Spalten: `code`, `name`, `active`. Bei einem neuen Vermittler steht `active` auf `yes`.
3. Tragen Sie nur die Nummer, ohne Namen, in `data/referral-codes.json` ein. Diese Datei ist öffentlich. Namen stehen dort nicht.
4. Der Link lautet `https://meda-vermittlung.de/?ref=M004`. Er funktioniert auf jeder Seite, zum Beispiel auch `https://meda-vermittlung.de/bewerben.html?ref=M004`.
5. Zum Abschalten: in Ihrer CSV `active` auf `no` setzen und die Nummer aus `data/referral-codes.json` entfernen. Alte Zeilen in Ihrem Export behalten die alte Nummer.

Die JSON-Datei wirkt erst, wenn diese Änderung auf der Website veröffentlicht ist. Die CSV mit den Namen bleibt bei Ihnen.

## So funktioniert der Link

Die Nummer steht nur in der Adresse (`?ref=`). Der Browser speichert sie nicht: kein Cookie, kein localStorage, kein sessionStorage. Das alte Cookie-Banner ist nur noch ein leerer Platzhalter und wird nicht gefragt, weil nichts gespeichert wird.

Ein kleines Skript liest `?ref` auf jeder Seite. Die Nummer muss wie `M001` aussehen und in der öffentlichen Liste stehen. Dann setzt das Skript sie in das versteckte Feld `ref_code` der Bewerbung und hängt `?ref=M001` an interne Links, damit der Weg zum Formular die Nummer behält. Die Adresse der aktuellen Seite bleibt unverändert.

Fehlt die Nummer, ist sie unbekannt oder inaktiv, steht im Feld `direkt`. Externe Links und E-Mail-Links bleiben ohne Nummer.

Beide Formulare auf der Seite Bewerben gehen an FormSubmit und von dort an `meda-vermittlung@agentmail.to`. Das Feld `ref_code` steht in dieser E-Mail. Zusätzlich gibt es ein optionales Feld `land` (Land). Es ist nicht vorausgewählt. Die Werte sind Ländercodes wie `DE` oder `MA`, dazu `other` für Anderes. Wer nichts wählt, lässt das Feld leer.

## Vertragsstatus eintragen

Die Kandidaten-Datei bleibt auf Ihrem Rechner. Nicht ins Projekt kopieren, nicht auf einen Server legen. Spalten:

`candidate_id`, `ref_code`, `in_pool`, `contract_placed`, `first_contact_date`, `contract_placed_date`, `country`

`country` ist der Wert aus dem Formularfeld `land`: ein Ländercode wie `DE`, oder `other`, oder leer.

Ja und nein schreiben Sie als `yes` oder `no`. Datum als `JJJJ-MM-TT`, zum Beispiel `2026-01-15`.

Eine Zeile pro Kandidat. Kommt jemand über mehrere Vermittler, gewinnt der erste Kontakt: das früheste `first_contact_date`. Eine spätere Nummer zählt nicht. Steht dieselbe Kennung doppelt in der Datei, nimmt das Skript nur die Zeile mit dem frühesten Datum. Pool und Vertrag kommen aus derselben Zeile. Den Vertrag also in die Zeile des ersten Kontakts schreiben.

`in_pool`: `yes`, wenn die Person im Pool ist.

`contract_placed`: `yes`, wenn ein Vertrag zustande kam. Dann `contract_placed_date` ausfüllen.

Der Vertrag zählt nur, wenn das Vertragsdatum höchstens 12 Monate nach dem ersten Kontakt liegt. Der Tag des ersten Kontakts und der Tag genau 12 Monate später zählen noch mit. Beispiel: erster Kontakt am 15.01.2026, letzter Tag am 15.01.2027. Der 16.01.2027 zählt nicht. Ein Vertrag ohne Datum zählt nicht. Die Pool-Zahl hat dieses Zeitfenster nicht. Das ist so gewollt.

## Zählung ausführen

```bash
python3 tools/referrals/count_referrals.py \
  --marketers tools/referrals/marketers.csv \
  --candidates /pfad/auf/ihrem/rechner/bewerbungen.csv \
  --out /pfad/auf/ihrem/rechner/zaehlung-M004.csv \
  --code M004
```

Ohne `--code` entstehen Zeilen für jede Nummer in Ihrer CSV. Zum Weitergeben an eine Person `--code` nutzen, damit sie nur ihre eigene Zeile sieht.

Die Zähldatei ist lang, eine Zeile pro Land. Spalten: `code`, `country`, `in_pool`, `contracts_placed`, `countries`.

Die Zeile `country=gesamt` ist die Summe. Dort stehen Pool, Verträge und die Zahl der verschiedenen Länder. Darunter steht jedes Land, das im Pool vorkommt, mit seiner Pool-Zahl. Verträge werden nicht nach Land aufgeteilt.

Ab 3 steht die Zahl. Darunter steht `<3`, auch bei 0. Das gilt für den Pool, für Verträge und für jede Land-Zelle. Ein Land mit einer oder zwei Personen erscheint also, die genaue Zahl aber nicht.

`countries` zählt nur echte Ländercodes. `other` und `unbekannt` zählen nicht mit. Standard: diese Zahl erscheint nur, wenn der Pool mindestens 3 ist. Sonst steht `<3`. Mit `--distinct-countries always` steht die Zahl auch bei einem kleineren Pool.

Freitext im Land-Feld wird nicht ausgegeben. Unbekannter Text zählt als `other`. Keine Namen, keine Kandidaten.

## Datenschutz

- Namen nur in `marketers.csv` auf Ihrem Rechner. Die Datei ist per `.gitignore` aus Git ausgeschlossen.
- GitHub Pages baut die Seite mit Jekyll. In `_config.yml` ist der Ordner `tools` ausgeschlossen und wird nicht mitveröffentlicht. Eine `.nojekyll`-Datei gibt es nicht. Legen Sie keine an, sonst könnte der Ordner öffentlich werden.
- Die öffentliche Liste enthält nur aktive Nummern, keine Namen.
- Die Kandidaten-Datei bleibt auf Ihrem Rechner. Nicht committen, nicht auf einen Server oder VPS kopieren.
- Die Zähldatei enthält nur Nummern, Ländercodes und unterdrückte Zahlen. Sie dürfen sie weitergeben. Die Kandidaten-Datei nicht.
- Ein Land mit weniger als 3 Personen steht trotzdem als Zeile mit `<3`. Daran sieht man, dass es diese Herkunft gibt. Die Spalte `countries` kann bei einem Pool ab 3 eine kleine Zahl zeigen, zum Beispiel 4 Personen aus 4 Ländern. Das ist ein Risiko für seltene Herkunftsländer. Standardmäßig bleibt die Länderzahl verborgen, solange der ganze Pool unter 3 liegt.
- Im Browser wird die Nummer nicht gespeichert. Sie reist nur in der Adresse und im Formularfeld mit.
