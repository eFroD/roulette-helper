# Feature Specification: Roulette Dealer Companion

**Feature Branch**: `001-roulette-dealer-companion`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "check the spec.md in the root dir of this project" — formalisiert aus `spec.md` (Projektwurzel), Entwurf "Spec: Roulette Dealer Companion".

## Overview

Eine schlanke, rein clientseitige Web-App, die einem Laien-Dealer auf einer privaten Casino-Party (Spielgeld, echte Jetons) das Kopfrechnen abnimmt. Der Dealer gibt **nach** dem Wurf die gefallene Zahl ein; die App markiert die gewinnenden Felder, sperrt alle anderen und berechnet pro Gewinnerfeld Einsatz, Gewinn, Gesamtauszahlung und den Gewinn **pro Chip**. Die App kennt keine Spieler, keine Konten und keine Historie über die Runde hinaus.

**Nicht-Ziele (explizit ausgeschlossen):** Spielerverwaltung, Kontostände, sitzungsübergreifende Historie, Zuordnung von Chips zu Personen, Splits/Streets/Corners/Sixlines, Multi-Tisch-Betrieb, echtes Glücksspiel oder Geldverwaltung.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gewinnerfelder nach dem Wurf erkennen (Priority: P1)

Der Dealer wirft die Kugel und ruft "Nichts geht mehr". Die Kugel fällt auf eine Zahl. Er tippt diese Zahl in der App an. Die App hebt sofort alle Felder hervor, die durch diese Zahl gewinnen — die Zahl selbst, ihre Farbe, gerade/ungerade, die Hälfte, das Dutzend und die Kolonne — und graut alle übrigen Felder aus, sodass sie nicht mehr bedienbar sind.

**Why this priority**: Dies ist die Grundlage für alles Weitere. Ein unerfahrener Dealer weiß oft nicht auswendig, ob 17 rot oder schwarz ist oder in welcher Kolonne die Zahl liegt. Schon ohne jede Berechnung liefert dieser Schritt Wert: Der Dealer sieht auf einen Blick, was gewinnt, und kann durch das Sperren der Verlierer keinen verlorenen Einsatz mehr versehentlich auszahlen.

**Independent Test**: Vollständig testbar, indem eine Zahl eingegeben und geprüft wird, welche Felder aktiv bzw. gesperrt sind. Liefert eigenständigen Wert als "Was gewinnt bei dieser Zahl?"-Anzeige, auch ohne Einsatzerfassung.

**Acceptance Scenarios**:

1. **Given** eine laufende Runde ohne eingegebene Gewinnzahl, **When** der Dealer die Zahl 17 antippt, **Then** sind genau sechs Felder aktiv — die Zahl 17, Schwarz, Ungerade, 1–18, das 2. Dutzend und die 2. Kolonne — und alle übrigen Zahlen- und Außenwettfelder sind sichtbar gesperrt.
2. **Given** eine laufende Runde ohne eingegebene Gewinnzahl, **When** der Dealer die Zahl 0 antippt, **Then** ist ausschließlich das Feld 0 aktiv und sämtliche Außenwetten sind gesperrt.
3. **Given** eine eingegebene Gewinnzahl, **When** der Dealer ein gesperrtes Feld antippt, **Then** passiert nichts und der Zustand der Runde bleibt unverändert.
4. **Given** eine laufende Runde ohne eingegebene Gewinnzahl, **When** der Dealer ein beliebiges Feld zur Einsatzerfassung antippen will, **Then** ist keine Einsatzerfassung möglich, solange keine Gewinnzahl feststeht.

---

### User Story 2 - Einsätze erfassen und Auszahlung ablesen (Priority: P2)

Der Dealer schaut auf das physische Tableau und tippt für jedes Gewinnerfeld so oft, wie dort Grundeinsätze liegen. Die App zählt die Taps hoch und zeigt pro Feld live die Einsatzsumme, den reinen Gewinn, die Gesamtauszahlung und den Gewinn pro Chip. Eine prominente Gesamtzeile nennt die Summe, die er insgesamt aus der Bank nehmen muss.

**Why this priority**: Das ist der eigentliche Kernnutzen — das Rechnen abnehmen. Die Zeile "pro Chip" ist entscheidend, weil sie dem Dealer erlaubt, an mehrere Spieler auf demselben Feld auszuzahlen, ohne dass die App weiß, wem welcher Chip gehört.

**Independent Test**: Testbar, indem nach Eingabe einer Gewinnzahl eine bekannte Anzahl Taps auf bekannte Felder gesetzt und die angezeigten Beträge gegen die Quotentabelle geprüft werden.

**Acceptance Scenarios**:

1. **Given** Gewinnzahl 17 und Grundeinsatz Zahlen 5 €, **When** der Dealer das Feld 17 zweimal antippt, **Then** zeigt die App Einsatz 10 €, Gewinn 350 €, Auszahlung 360 € und 175 € Gewinn pro Chip.
2. **Given** Gewinnzahl 17 und Grundeinsatz Außen 10 €, **When** der Dealer Schwarz viermal antippt, **Then** zeigt die App Einsatz 40 €, Gewinn 40 €, Auszahlung 80 € und 10 € Gewinn pro Chip.
3. **Given** Gewinnzahl 17 und Grundeinsatz Außen 10 €, **When** der Dealer das 2. Dutzend dreimal antippt, **Then** zeigt die App Einsatz 30 €, Gewinn 60 €, Auszahlung 90 € und 20 € Gewinn pro Chip.
4. **Given** mehrere belegte Gewinnerfelder, **When** der Dealer die Gesamtzeile abliest, **Then** entspricht sie der Summe der Gesamtauszahlungen aller belegten Felder.
5. **Given** ein aktives Gewinnerfeld ohne Taps, **When** der Dealer die Anzeige betrachtet, **Then** wird für dieses Feld keine Auszahlung ausgewiesen und es geht nicht in die Gesamtsumme ein.

---

### User Story 3 - Fehler korrigieren und die nächste Runde starten (Priority: P3)

Beim schnellen Tippen im Stehen passieren Fehler: ein Tap zu viel, ein falsches Feld, eine falsch gelesene Gewinnzahl. Der Dealer muss jeden dieser Fehler beheben können, ohne die Runde neu aufnehmen zu müssen. Nach der Auszahlung setzt er die App mit einem klar erkennbaren Schritt für die nächste Runde zurück.

**Why this priority**: Ohne Korrekturmöglichkeit blockiert jeder Fehltipp den Spielfluss — genau das, was die App verhindern soll. Die Grundfunktion ist jedoch auch ohne Korrekturen demonstrierbar, daher P3.

**Independent Test**: Testbar, indem gezielt Fehleingaben erzeugt und über Undo, Feld-Reset und Gewinnzahl-Korrektur zurückgenommen werden; danach wird der Zustand gegen den erwarteten Sollzustand geprüft.

**Acceptance Scenarios**:

1. **Given** drei Taps auf Schwarz bei Grundeinsatz Außen 10 €, **When** der Dealer einmal Undo auslöst, **Then** verbleiben zwei Einsätze mit Einsatz 20 €, Gewinn 20 € und Auszahlung 40 €.
2. **Given** ein Feld mit mehreren erfassten Einsätzen, **When** der Dealer dieses Feld gezielt leert, **Then** ist nur dieses Feld auf null zurückgesetzt und alle anderen Felder behalten ihre Einsätze.
3. **Given** eine Runde mit bereits erfassten Einsätzen, **When** der Dealer die Gewinnzahl ändert, **Then** erscheint eine kurze Rückfrage, und nach Bestätigung sind alle erfassten Einsätze verworfen und die Gewinnerfelder entsprechen der neuen Zahl.
4. **Given** eine Runde mit bereits erfassten Einsätzen, **When** der Dealer die Gewinnzahl-Änderung in der Rückfrage abbricht, **Then** bleiben Gewinnzahl und alle erfassten Einsätze unverändert.
5. **Given** eine abgeschlossene Runde, **When** der Dealer "Nächste Runde" auslöst und bestätigt, **Then** sind Gewinnzahl und alle Einsätze geleert und die App zeigt wieder den neutralen Startzustand.
6. **Given** eine Runde ohne jede erfasste Aktion, **When** der Dealer Undo auslöst, **Then** bleibt der Zustand unverändert und es entsteht kein Fehlerzustand.

---

### User Story 4 - Grundeinsätze vor der Party festlegen (Priority: P4)

Der Gastgeber legt vor der Party an einer leicht auffindbaren Stelle fest, um welchen Betrag ein einzelner Tap hochzählt — getrennt für Außenwetten und Einzelzahlen — und welches Währungssymbol angezeigt wird.

**Why this priority**: Nötig für die Anpassung an die tatsächlich verwendeten Jetons, aber mit sinnvollen Vorgabewerten (10 / 5 / €) ist die App sofort einsatzfähig.

**Independent Test**: Testbar, indem die Werte geändert werden und geprüft wird, dass sich Einsatzschritte, Berechnungen und Währungsanzeige entsprechend verhalten.

**Acceptance Scenarios**:

1. **Given** der Grundeinsatz für Außenwetten ist auf 20 € gesetzt, **When** der Dealer ein Außenwettfeld einmal antippt, **Then** weist die App für dieses Feld einen Einsatz von 20 € aus.
2. **Given** ein abweichendes Währungssymbol ist konfiguriert, **When** die App Beträge anzeigt, **Then** verwendet jede Betragsanzeige dieses Symbol.

---

### User Story 5 - Casino-Atmosphäre und Dauerbetrieb am Tablet (Priority: P5)

Damit sich die App am Partytisch nicht wie ein Taschenrechner anfühlt und den Abend über durchhält: eine Leiste mit den letzten gefallenen Zahlen, ein dunkles, kontraststarkes Design für gedämpftes Licht, Vollbildbetrieb und ein Tablet, das zwischen den Runden nicht in den Standby fällt.

**Why this priority**: Reines Komfort- und Atmosphärenpaket. Wertvoll für den Abend, aber die App erfüllt ihren Zweck auch ohne diese Punkte vollständig.

**Independent Test**: Testbar, indem mehrere Runden gespielt werden und Historienleiste, Lesbarkeit bei gedimmtem Licht sowie das Ausbleiben des Standby über mehrere Minuten Inaktivität geprüft werden.

**Acceptance Scenarios**:

1. **Given** mehrere abgeschlossene Runden, **When** der Dealer die Historienleiste betrachtet, **Then** zeigt sie die zuletzt gefallenen Zahlen in der korrekten Reihenfolge und in ihrer jeweiligen Feldfarbe.
2. **Given** die App ist geöffnet und wird mehrere Minuten nicht bedient, **When** der Dealer zurückkehrt, **Then** ist der Bildschirm weiterhin an und der Rundenzustand unverändert sichtbar.
3. **Given** mehr abgeschlossene Runden als die Historienleiste fasst, **When** eine weitere Runde endet, **Then** verdrängt die neueste Zahl die älteste und die Leiste bleibt auf ihre maximale Länge begrenzt.

---

### Edge Cases

- **Gefallene 0**: Alle Außenwetten verlieren vollständig; nur die direkte Wette auf 0 gewinnt. Kein La Partage, kein En Prison.
- **Keine Gewinnzahl eingegeben**: Einsatzerfassung ist gesperrt, bis eine Zahl feststeht.
- **Tap auf ein gesperrtes (verlierendes) Feld**: bleibt wirkungslos, ohne Fehlermeldung oder Zustandsänderung.
- **Undo ohne vorangegangene Aktion**: bleibt wirkungslos.
- **Gewinnzahl-Korrektur mit erfassten Einsätzen**: Rückfrage vor dem Verwerfen; Abbruch lässt alles unverändert.
- **Versehentliches Auslösen von "Nächste Runde"**: durch Platzierung und Bestätigung abgesichert.
- **Sehr hohe Tap-Zahl auf einem Feld**: Beträge und Tap-Anzahl bleiben im Feld vollständig und lesbar dargestellt.
- **Runde ohne einen einzigen Einsatz**: Gesamtauszahlung ist 0; "Nächste Runde" funktioniert normal.
- **Netzverbindung bricht mitten in der Runde weg**: die App bleibt uneingeschränkt bedienbar.
- **Seite wird neu geladen oder das Gerät neu gestartet**: der Rundenzustand geht verloren und die App startet neutral — bewusst akzeptiert, da keine Persistenz vorgesehen ist.
- **Dealerwechsel mitten in der Session**: erfordert keine Aktion in der App, da es weder Nutzer noch Sitzungen gibt.

## Requirements *(mandatory)*

### Functional Requirements

**Runde und Gewinnzahl**

- **FR-001**: Das System MUSS ein Tableau mit allen 37 Feldern des europäischen Roulette (0–36) sowie die Außenwetten Rot, Schwarz, Gerade, Ungerade, 1–18, 19–36, drei Dutzende und drei Kolonnen darstellen.
- **FR-002**: Das System MUSS jedes Zahlenfeld in seiner echten Roulette-Farbe darstellen (0 grün, übrige Zahlen rot bzw. schwarz gemäß der europäischen Standardbelegung).
- **FR-003**: Der Dealer MUSS die gefallene Gewinnzahl als einzelne Zahl zwischen 0 und 36 eingeben können.
- **FR-004**: Das System MUSS nach Eingabe der Gewinnzahl genau diejenigen Felder als Gewinner kennzeichnen, die durch diese Zahl gewinnen: die Zahl selbst sowie ihre Farbe, ihre Parität, ihre Hälfte, ihr Dutzend und ihre Kolonne.
- **FR-005**: Das System MUSS bei der Gewinnzahl 0 ausschließlich das Feld 0 als Gewinner kennzeichnen und sämtliche Außenwetten als Verlierer sperren.
- **FR-006**: Das System MUSS alle nicht gewinnenden Felder sichtbar als Verlierer kennzeichnen und deren Bedienung unterbinden, sodass ein verlorener Einsatz nicht erfassbar ist.
- **FR-007**: Das System MUSS die Einsatzerfassung unterbinden, solange keine Gewinnzahl eingegeben ist.

**Einsatzerfassung**

- **FR-008**: Der Dealer MUSS auf jedem Gewinnerfeld Einsätze durch wiederholtes Antippen erfassen können, wobei jeder Tap den Einsatz dieses Feldes um genau einen konfigurierten Grundeinsatz erhöht.
- **FR-009**: Das System MUSS für Einzelzahlen und für Außenwetten getrennt konfigurierte Grundeinsätze verwenden.
- **FR-010**: Das System MUSS pro belegtem Feld die Anzahl der erfassten Einsätze sichtbar machen.

**Berechnung und Anzeige**

- **FR-011**: Das System MUSS Auszahlungen nach folgenden Quoten berechnen: Einzelzahl 35:1; Rot, Schwarz, Gerade, Ungerade, 1–18 und 19–36 jeweils 1:1; Dutzend und Kolonne jeweils 2:1.
- **FR-012**: Das System MUSS pro belegtem Gewinnerfeld die Einsatzsumme, den reinen Gewinn und die Gesamtauszahlung (Einsatz plus Gewinn) getrennt voneinander ausweisen.
- **FR-013**: Das System MUSS pro belegtem Gewinnerfeld den Gewinn pro einzelnem Grundeinsatz ("pro Chip") ausweisen, damit der Dealer mehrere Spieler auf demselben Feld ohne Zuordnung auszahlen kann.
- **FR-014**: Das System MUSS eine hervorgehobene Gesamtauszahlung der Runde anzeigen, die der Summe der Gesamtauszahlungen aller belegten Felder entspricht.
- **FR-015**: Das System MUSS alle Beträge mit dem konfigurierten Währungssymbol darstellen.
- **FR-016**: Das System MUSS alle angezeigten Beträge unmittelbar nach jeder Eingabe aktualisieren.

**Korrektur und Rundenwechsel**

- **FR-017**: Der Dealer MUSS die zuletzt ausgeführte Aktion über eine einzelne, global erreichbare Funktion zurücknehmen können, wobei ein einzelner Tap zurückgenommen wird und nicht das gesamte Feld.
- **FR-018**: Der Dealer MUSS ein einzelnes Feld gezielt leeren können, ohne die Einsätze anderer Felder zu verändern.
- **FR-019**: Der Dealer MUSS die eingegebene Gewinnzahl korrigieren können, ohne die Runde beenden zu müssen.
- **FR-020**: Das System MUSS vor dem Ändern der Gewinnzahl eine Bestätigung einholen, wenn bereits Einsätze erfasst sind, und bei Bestätigung alle erfassten Einsätze verwerfen.
- **FR-021**: Der Dealer MUSS die Runde über eine deutlich erkennbare Funktion beenden können, die Gewinnzahl und alle Einsätze zurücksetzt.
- **FR-022**: Das System MUSS das versehentliche Auslösen des Rundenendes erschweren, entweder durch abgesetzte Platzierung oder durch eine kurze Bestätigung.

**Konfiguration**

- **FR-023**: Der Gastgeber MUSS an einer leicht auffindbaren Stelle vor der Party den Grundeinsatz für Außenwetten, den Grundeinsatz für Einzelzahlen und das Währungssymbol festlegen können.
- **FR-024**: Das System SOLLTE die Grundeinsätze zusätzlich zur Laufzeit über ein Einstellungs-Panel änderbar machen (nice to have, nicht kritisch).

**Bedienbarkeit und Betrieb**

- **FR-025**: Das System MUSS vollständig ohne Netzwerkverbindung und ohne serverseitige Verarbeitung funktionieren; alle benötigten Inhalte müssen lokal vorliegen.
- **FR-026**: Das System MUSS auf einem Tablet im Querformat als Hauptfall bedienbar sein und auf Laptops nutzbar bleiben.
- **FR-027**: Das System MUSS Bedienflächen so großzügig dimensionieren, dass sie im Stehen, schnell und einhändig sicher getroffen werden.
- **FR-028**: Das System MUSS die Auszahlungswerte so darstellen, dass sie aus etwa 50 cm Entfernung sicher lesbar sind.
- **FR-029**: Das System MUSS für jedes Feld visuell unterscheidbare Zustände darstellen: neutral, Gewinner, Verlierer und belegt.
- **FR-030**: Das System DARF KEINE Daten über das Rundenende hinaus speichern und DARF KEINE Spieler, Konten oder Zuordnungen von Chips zu Personen führen.

**Komfort (nice to have)**

- **FR-031**: Das System SOLLTE eine Leiste mit den letzten 10 gefallenen Zahlen in ihren Feldfarben anzeigen.
- **FR-032**: Das System SOLLTE ein dunkles, kontraststarkes Design verwenden, das bei gedämpftem Partylicht gut lesbar ist; hoher Kontrast hat Vorrang vor Eleganz.
- **FR-033**: Das System SOLLTE verhindern, dass das Anzeigegerät während des Betriebs in den Standby wechselt.
- **FR-034**: Das System SOLLTE einen Vollbildbetrieb oder einen Hinweis bieten, wie die App auf dem Tablet zum Startbildschirm hinzugefügt wird.

### Key Entities

- **Runde**: Der Betrachtungszeitraum von einem Wurf bis zum Zurücksetzen. Enthält höchstens eine Gewinnzahl und beliebig viele Einsatzposten. Existiert nur im Arbeitsspeicher und endet mit dem Zurücksetzen.
- **Gewinnzahl**: Die gefallene Zahl zwischen 0 und 36. Bestimmt vollständig, welche Wettfelder gewinnen.
- **Wettfeld**: Eine Fläche, auf die gesetzt werden kann — entweder eine Einzelzahl (0–36) oder eine Außenwette. Trägt eine Auszahlungsquote, eine Zugehörigkeit zum Grundeinsatz-Typ (Zahl oder Außen) und im Rundenverlauf einen Zustand (neutral, Gewinner, Verlierer, belegt).
- **Einsatzposten**: Die auf einem Wettfeld erfasste Anzahl von Grundeinsätzen. Kennt keinen Spieler und keine Herkunft.
- **Auszahlungsergebnis**: Die aus Einsatzposten und Quote abgeleiteten Werte eines Feldes — Einsatzsumme, Gewinn, Gesamtauszahlung und Gewinn pro Chip.
- **Konfiguration**: Die vor der Party gesetzten Werte Grundeinsatz Außen, Grundeinsatz Zahlen und Währungssymbol.
- **Ergebnis-Historie**: Die zuletzt gefallenen Zahlen der aktuellen Session, rein zur Anzeige und ohne Einfluss auf Berechnungen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ein Dealer ermittelt die vollständige Auszahlung einer typischen Runde mit bis zu vier belegten Gewinnerfeldern in unter 20 Sekunden ab Eingabe der Gewinnzahl.
- **SC-002**: Alle sieben Referenzfälle aus dem Abschnitt "Reference Scenarios" liefern exakt die dort genannten Ergebnisse — null Abweichungen.
- **SC-003**: Ein Gast ohne Roulette-Vorkenntnisse und ohne Einweisung kann nach höchstens zwei beobachteten Runden eine Runde eigenständig korrekt abrechnen.
- **SC-004**: Über eine vollständige Testsession von mindestens 20 Runden wird kein einziger verlorener Einsatz erfassbar, weil verlierende Felder ausnahmslos gesperrt bleiben.
- **SC-005**: Jeder einzelne Eingabefehler — ein Tap zu viel, ein falsch belegtes Feld, eine falsche Gewinnzahl — ist mit höchstens zwei Interaktionen korrigierbar, ohne die Runde neu beginnen zu müssen.
- **SC-006**: Bei vollständig unterbrochener Netzverbindung bleibt jede Funktion der App uneingeschränkt nutzbar — null Funktionsverluste.
- **SC-007**: Alle Auszahlungsbeträge sind auf dem Zielgerät aus 50 cm Entfernung bei gedämpftem Licht fehlerfrei ablesbar, bestätigt durch mindestens drei Testpersonen.
- **SC-008**: Die App ist nach dem Öffnen in unter 3 Sekunden bedienbereit.
- **SC-009**: Das Anzeigegerät wechselt über eine Spielsession von mindestens 60 Minuten zu keinem Zeitpunkt selbsttätig in den Standby.

## Reference Scenarios

Diese Fälle gelten als verbindlicher Abnahmenachweis. Beträge beziehen sich auf die Vorgabewerte Grundeinsatz Außen 10 € und Grundeinsatz Zahlen 5 €.

| # | Ausgangslage | Erwartetes Ergebnis |
|---|---|---|
| 1 | Gefallene Zahl 17 | Genau sechs Felder aktiv: 17, Schwarz, Ungerade, 1–18, 2. Dutzend, 2. Kolonne. Alles Übrige gesperrt. |
| 2 | Gefallene Zahl 0 | Nur das Feld 0 aktiv. Alle Außenwetten gesperrt. |
| 3 | Einzelzahl, 2 Einsätze à 5 € | Einsatz 10 €, Gewinn 350 €, Auszahlung 360 €, pro Chip 175 € Gewinn. |
| 4 | Rot, 4 Einsätze à 10 € | Einsatz 40 €, Gewinn 40 €, Auszahlung 80 €, pro Chip 10 € Gewinn. |
| 5 | Dutzend, 3 Einsätze à 10 € | Einsatz 30 €, Gewinn 60 €, Auszahlung 90 €, pro Chip 20 € Gewinn. |
| 6 | Undo nach 3 Taps auf Rot | 2 Einsätze verbleiben: Einsatz 20 €, Gewinn 20 €, Auszahlung 40 €. |
| 7 | Gewinnzahl nachträglich ändern | Rückfrage erscheint; nach Bestätigung sind die Einsätze verworfen und die Gewinnerfelder passen zur neuen Zahl. |

## Assumptions

- **Chip-Einheitlichkeit**: Alle Chips auf einem Feld entsprechen demselben Grundeinsatz. Die Angabe "pro Chip" ist dadurch exakt. Gemischte Chipwerte auf einem Feld sind nicht vorgesehen; der Dealer müsste sie in Grundeinsätze umrechnen.
- **Ganzzahlige Beträge**: Grundeinsätze werden als ganze Beträge gewählt, wodurch alle Ergebnisse ganzzahlig bleiben und keine Rundungsregel nötig ist.
- **Ein Gerät, ein Tisch**: Die App läuft auf genau einem Gerät an einem Tisch. Es gibt keine Synchronisation zwischen Geräten und keine gleichzeitigen Bearbeiter.
- **Dualer Zweck des Zahlenrasters**: Das Zahlenraster 0–36 dient sowohl der Eingabe der Gewinnzahl als auch der anschließenden Einsatzerfassung auf der Gewinnzahl. Vor Eingabe der Gewinnzahl legt ein Tap die Gewinnzahl fest, danach erhöhen weitere Taps auf dem aktiven Zahlenfeld dessen Einsatz.
- **Undo-Reichweite**: Undo bezieht sich auf die Einsatzerfassung. Die Korrektur der Gewinnzahl hat mit der Bestätigungsrückfrage ihren eigenen, davon getrennten Weg.
- **Kein Zustandserhalt**: Ein Neuladen der Seite oder ein Neustart des Geräts verwirft die laufende Runde. Das ist akzeptiert, da keine Persistenz vorgesehen ist.
- **Historienumfang**: Die Ergebnis-Historie umfasst nur die laufende Session und geht beim Neuladen verloren.
- **Null-Regel**: Bei 0 verlieren alle Außenwetten vollständig — kein La Partage, kein En Prison. Dies ist eine bewusste Hausregel des Gastgebers.
- **Vorgabewerte**: Ohne Anpassung gelten Grundeinsatz Außen 10, Grundeinsatz Zahlen 5 und Währungssymbol "€".
- **Kein echtes Glücksspiel**: Es wird ausschließlich mit Spielgeld gespielt. Es entstehen keine regulatorischen Anforderungen an Geldverwaltung, Altersprüfung oder Nachweispflichten.
- **Technische Rahmenvorgaben des Gastgebers**: Der Entwurf legt eine rein statische Auslieferung ohne Backend, ohne Datenbank und ohne externe Abhängigkeiten sowie eine minimale containerisierte Bereitstellung fest. Diese Vorgaben sind Eingaben für die Planungsphase, nicht Teil der fachlichen Anforderungen.

## Out of Scope

- Spielerverwaltung, Kontostände und die Zuordnung von Chips zu Personen
- Sitzungsübergreifende Historie oder Auswertungen
- Splits, Streets, Corners und Sixlines sowie alle weiteren Innenwetten außer der Einzelzahl
- Amerikanisches Roulette (Doppel-Null) sowie La Partage und En Prison
- Multi-Tisch-Betrieb und Synchronisation über mehrere Geräte
- Erfassung verlierender Einsätze oder Berechnung des Bankgewinns
- Nutzerkonten, Anmeldung und Rechteverwaltung
