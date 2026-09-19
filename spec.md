# Spec: Roulette Dealer Companion

Eine schlanke Web-App, die einem Laien-Dealer auf einer privaten Casino-Party (Spielgeld) das Rechnen abnimmt. Kein echtes Glücksspiel, keine Geldverwaltung, keine Spielerkonten.

---

## 1. Kontext & Ziel

Auf einer Hausparty wird europäisches Roulette (37 Felder, 0–36) mit echten Jetons, aber Spielgeld gespielt. Die Dealer sind Gäste ohne Vorkenntnisse und wechseln sich ab. Die App soll:

- Auszahlungen berechnen, damit niemand Kopfrechnen muss
- Den Ablauf flüssig halten (kein Stocken zwischen den Runden)
- Auf einem Tablet oder Laptop mit Touch bedienbar sein, im Stehen, mit einer Hand

**Nicht-Ziele:** Spielerverwaltung, Kontostände, Historie über Sessions hinweg, Zuordnung von Chips zu Personen, Splits/Streets/Corners, Multi-Tisch-Betrieb.

---

## 2. Kern-Entscheidungen (bereits getroffen)

| Thema | Entscheidung |
|---|---|
| Spielerzuordnung | Entfällt. Die App rechnet pro Feld, nicht pro Person. Zusätzlich wird das Auszahlungs-**Verhältnis** angezeigt, damit der Dealer bei mehreren Einsätzen auf einem Feld selbst runterbrechen kann. |
| Erfassungszeitpunkt | **Nach** dem Wurf. Der Dealer gibt zuerst die Gewinnzahl ein, dann nur die tatsächlich gewinnenden Felder. Verlierende Einsätze werden nie erfasst. |
| Wett-Typen | Nur volle Zahlen (0–36) und Außenwetten. Keine Splits, Streets, Corners, Sixlines. |
| Chipwerte | Konfigurierbare Grundeinsätze. Ein Tap = ein Grundeinsatz, mehrere Taps zählen hoch. |
| Backend | Keines. Rein statische Web-App, clientseitig. |
| Persistenz | Keine. Jede Runde startet frisch. Konfiguration liegt im Code / in einer Config-Datei. |
| Null-Regel | Bei 0 verlieren **alle** Außenwetten vollständig. Kein La Partage, kein En Prison. Nur die direkte Wette auf 0 gewinnt (35:1). |

---

## 3. Technik

- **Stack:** Statisches HTML/CSS/JS. Kein Framework zwingend; falls eins, dann etwas Leichtgewichtiges ohne Build-Zwang.
- **Kein Backend, keine Datenbank, kein Auth.**
- **Deployment:** Docker Compose mit nginx (oder vergleichbar), das das statische Verzeichnis ausliefert. Das Compose-File soll minimal sein.
- **Offline-tauglich:** Die App muss funktionieren, wenn das WLAN kurz wegbricht. Keine externen CDN-Abhängigkeiten – alle Assets lokal.
- **Zielgeräte:** Tablet (primär, Touch) und Laptop. Responsive, aber Tablet-Querformat ist der Hauptfall.

---

## 4. Konfiguration

Eine leicht auffindbare Config (z. B. `config.js` oben in der Datei oder eine `config.json`), in der der Gastgeber vor der Party setzt:

```
grundeinsatzAussen: 10      // Standard-Schritt für Außenwetten
grundeinsatzZahlen: 5       // Standard-Schritt für Einzelzahlen
waehrungssymbol: "€"
```

Diese Werte bestimmen, um wie viel ein einzelner Tap hochzählt. Optional: die Werte auch zur Laufzeit in einem Einstellungs-Panel änderbar machen (nice to have, nicht kritisch).

---

## 5. Auszahlungsquoten

| Wette | Felder | Quote |
|---|---|---|
| Einzelzahl (Plein) | 1 | 35 : 1 |
| Rot / Schwarz | 18 | 1 : 1 |
| Gerade / Ungerade | 18 | 1 : 1 |
| 1–18 / 19–36 | 18 | 1 : 1 |
| Dutzend (1–12, 13–24, 25–36) | 12 | 2 : 1 |
| Kolonne (3 Spalten à 12) | 12 | 2 : 1 |

**Anzeigekonvention:** "Quote" meint den Gewinn zusätzlich zum Einsatz. Die App zeigt beides getrennt: den reinen Gewinn und die Gesamtsumme (Einsatz + Gewinn), weil der Dealer den Einsatz liegen lässt und nur den Gewinn dazulegt.

---

## 6. Ablauf (Happy Path)

1. **Runde läuft.** Die App zeigt den Startbildschirm: Zahlenfeld 0–36 und die Außenwetten, alles leer.
2. Der Dealer wirft die Kugel, ruft "Nichts geht mehr".
3. **Gewinnzahl eingeben.** Der Dealer tippt die gefallene Zahl. Die App markiert sofort alle Felder, die durch diese Zahl gewinnen (die Zahl selbst, ihre Farbe, gerade/ungerade, Hälfte, Dutzend, Kolonne). Alle anderen Felder werden visuell deaktiviert – man kann gar nicht mehr versehentlich einen verlorenen Einsatz erfassen.
4. **Einsätze auf den Gewinnerfeldern erfassen.** Der Dealer schaut aufs Tableau und tippt pro Gewinnerfeld so oft, wie dort Grundeinsätze liegen. Jeder Tap erhöht um den konfigurierten Schritt.
5. **Auszahlung ablesen.** Pro Feld zeigt die App live: Einsatzsumme, Gewinn, Gesamtauszahlung und das Verhältnis.
6. **Nächste Runde.** Ein Button setzt alles zurück.

---

## 7. UI-Anforderungen

### Hauptansicht
- **Zahlenraster 0–36** im Tableau-Layout (3 Reihen à 12, plus 0), Felder farbig wie im echten Roulette (rot/schwarz/grün).
- **Außenwetten** als separate, großflächige Buttons: Rot, Schwarz, Gerade, Ungerade, 1–18, 19–36, drei Dutzende, drei Kolonnen.
- Touch-Ziele großzügig dimensionieren – es wird im Stehen, oft schnell und manchmal mit feuchten Fingern getippt.

### Zustände eines Feldes
- **Neutral** – Runde läuft, noch keine Zahl eingegeben
- **Gewinner** – hervorgehoben, tippbar
- **Verlierer** – ausgegraut, nicht tippbar
- **Belegt** – zeigt Anzahl der Taps, Einsatzsumme und berechnete Auszahlung direkt im Feld oder daneben

### Ausgabe pro Gewinnerfeld
Gut lesbar aus ~50 cm Entfernung. Pro Feld mindestens:
```
Rot · 3 Einsätze × 10 €
Einsatz 30 €  →  Gewinn 30 €  →  Auszahlung 60 €
pro Chip: 10 € Gewinn
```
Die Zeile "pro Chip" ist wichtig: sie erlaubt dem Dealer, an mehrere Spieler auszuzahlen, ohne dass die App weiß, wem was gehört.

### Gesamtsumme
Eine prominente Zeile mit der Gesamtauszahlung der Runde, damit der Dealer weiß, wie viele Chips er insgesamt aus der Bank nehmen muss.

---

## 8. Bedienung & Fehlertoleranz

- **Undo:** Einzelner Tap rückgängig (nicht nur ganzes Feld leeren). Ein globaler Undo-Button reicht; er nimmt die zuletzt gemachte Aktion zurück.
- **Feld zurücksetzen:** Long-Press oder kleines "x" am Feld leert nur dieses Feld.
- **Gewinnzahl korrigieren:** Muss möglich sein, ohne die ganze Runde zu verlieren. Beim Ändern der Zahl werden die erfassten Einsätze verworfen (mit kurzer Rückfrage), weil sich die Gewinnerfelder ändern.
- **Runde beenden:** Ein deutlicher Button "Nächste Runde" – setzt alles zurück. Sollte nicht versehentlich auslösbar sein (leicht abgesetzt platzieren oder kurz bestätigen lassen).

---

## 9. Nice to have

- **Ergebnis-Historie:** Leiste mit den letzten 10 gefallenen Zahlen, farbig. Rein fürs Casino-Feeling, keine Funktion.
- **Einstellungs-Panel** zum Ändern der Grundeinsätze zur Laufzeit.
- **Dunkles Casino-Design:** Dunkelgrün/Gold, gut lesbar bei gedämpftem Partylicht. Hoher Kontrast ist wichtiger als Eleganz.
- **Vollbild-Modus** bzw. Hinweis, wie man die Seite auf dem Tablet als Web-App zum Homescreen hinzufügt.
- **Kein Auto-Sleep:** Wake-Lock, damit das Tablet zwischen den Runden nicht in den Standby geht.

---

## 10. Testfälle

Diese Fälle sollen nachweislich funktionieren:

1. **Gefallene Zahl 17** (schwarz, ungerade, 1–18, 2. Dutzend, 2. Kolonne) → genau diese sechs Felder plus die 17 selbst sind aktiv, alles andere gesperrt.
2. **Gefallene Zahl 0** → nur das Feld 0 ist aktiv. Alle Außenwetten gesperrt.
3. **Einzelzahl mit 2 Einsätzen à 5 €** → Einsatz 10 €, Gewinn 350 €, Auszahlung 360 €, pro Chip 175 € Gewinn.
4. **Rot mit 4 Einsätzen à 10 €** → Einsatz 40 €, Gewinn 40 €, Auszahlung 80 €, pro Chip 10 € Gewinn.
5. **Dutzend mit 3 Einsätzen à 10 €** → Einsatz 30 €, Gewinn 60 €, Auszahlung 90 €, pro Chip 20 € Gewinn.
6. **Undo nach 3 Taps auf Rot** → 2 Einsätze bleiben, Beträge stimmen.
7. **Gewinnzahl nachträglich ändern** → Rückfrage erscheint, danach ist der Zustand konsistent.
