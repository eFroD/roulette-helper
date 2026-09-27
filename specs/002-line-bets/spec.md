# Feature Specification: Wetten auf den Linien

**Feature Branch**: `002-line-bets`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "diese web app hat die basic funktionen aber es fehlen noch die wetten auf den linien. wir haben es aus platzgründen draussen gelassen wir werden aber einen laptop bildschirm haben. lass uns ausprobieren wie gut das funktioniert wenn wir sie reinnehmen"

## Overview

Der Roulette Dealer Companion rechnet bisher nur Einzelzahlen und Außenwetten ab. Alle Wetten, die **auf den Linien** zwischen den Zahlenfeldern liegen — Split (zwei Zahlen), Street (drei Zahlen), Corner (vier Zahlen) und Sixline (sechs Zahlen) — wurden in der ersten Fassung aus Platzgründen weggelassen, weil das Tableau für ein Tablet im Querformat gedacht war. Genau diese Wetten liegen am Partytisch aber real auf dem Tuch: Sobald ein Gast einen Jeton auf eine Linie legt, kann der Dealer die Runde heute nicht vollständig abrechnen und muss den Teil im Kopf rechnen — also genau das, was die App abnehmen soll.

Da für den Einsatz nun ein Laptop-Bildschirm zur Verfügung steht, ist mehr Platz vorhanden. Dieses Feature holt die Linienwetten in die App: Der Dealer gibt weiterhin **nach** dem Wurf die gefallene Zahl ein, und die App markiert zusätzlich zu Zahl, Farbe, Parität, Hälfte, Dutzend und Kolonne auch jede Linienposition, die durch diese Zahl gewinnt — an ihrer echten Position auf dem Tableau.

**Ausdrücklich ein Versuch**: Der Gastgeber will ausprobieren, ob sich die dichtere Bedienoberfläche im Stehen und im Partytempo noch sicher treffen lässt. Das Feature gilt erst als erfolgreich, wenn es die Grundfunktion nicht verlangsamt oder fehleranfälliger macht. Deshalb gehört zum Umfang ausdrücklich ein Rückweg: Die Linienwetten müssen sich wieder abschalten lassen, ohne dass die App ihre bisherige Qualität verliert.

**Nicht-Ziele bleiben unverändert**: keine Spielerverwaltung, keine Kontostände, keine sitzungsübergreifende Historie, keine Zuordnung von Chips zu Personen, kein echtes Glücksspiel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gewinnende Linien nach dem Wurf erkennen (Priority: P1)

Der Dealer tippt die gefallene Zahl ein. Die App hebt nicht nur die sechs bisherigen Gewinnerfelder hervor, sondern auch jede Linienposition, die diese Zahl enthält: die Splits an ihren vier Kanten, ihre Street, ihre Corners und ihre Sixlines. Der Dealer sieht damit auf einen Blick, welche Jetons auf den Linien gewinnen und welche nicht — auch dann, wenn ein Jeton schief liegt und er selbst unsicher ist, auf welcher Linie der Gast eigentlich gesetzt hat.

**Why this priority**: Das ist der eigentliche Zugewinn. Schon die reine Markierung löst das häufigste Problem am Tisch: Der Laien-Dealer erkennt nicht zuverlässig, ob ein Jeton auf der Linie zwischen 16 und 17 durch die 17 gewinnt. Diese Geschichte liefert Wert, noch bevor irgendein Betrag berechnet wird.

**Independent Test**: Vollständig testbar, indem eine Zahl eingegeben und geprüft wird, welche Linienpositionen aktiv und welche gesperrt sind. Liefert eigenständigen Nutzen als "Welche Linien gewinnen bei dieser Zahl?"-Anzeige.

**Acceptance Scenarios**:

1. **Given** eine laufende Runde ohne Gewinnzahl, **When** der Dealer die 17 antippt, **Then** sind zusätzlich zu den sechs bisherigen Gewinnerfeldern genau elf Linienpositionen aktiv — die vier Splits 16/17, 17/18, 14/17 und 17/20, die Street 16-17-18, die vier Corners 13/14/16/17, 14/15/17/18, 16/17/19/20 und 17/18/20/21 sowie die beiden Sixlines 13–18 und 16–21 — und alle übrigen Linienpositionen sind sichtbar gesperrt.
2. **Given** eine laufende Runde ohne Gewinnzahl, **When** der Dealer die 1 antippt, **Then** sind genau acht Linienpositionen aktiv — die Splits 0/1, 1/2 und 1/4, die Street 1-2-3, der Trio 0-1-2, die Corner 1/2/4/5, die Basket-Wette 0-1-2-3 und die Sixline 1–6.
3. **Given** eine laufende Runde ohne Gewinnzahl, **When** der Dealer die 0 antippt, **Then** sind neben dem Feld 0 genau sechs Linienpositionen aktiv — die Splits 0/1, 0/2 und 0/3, die Trios 0-1-2 und 0-2-3 sowie die Basket-Wette 0-1-2-3 — und sämtliche Außenwetten sind gesperrt.
4. **Given** eine eingegebene Gewinnzahl, **When** der Dealer eine gesperrte Linienposition antippt, **Then** passiert nichts und der Rundenzustand bleibt unverändert.
5. **Given** eine laufende Runde ohne Gewinnzahl, **When** der Dealer eine Linienposition antippt, **Then** wird kein Einsatz erfasst und keine Gewinnzahl gesetzt, da Linienpositionen keine Zahl eingeben können.

---

### User Story 2 - Einsätze auf Linien erfassen und Auszahlung ablesen (Priority: P2)

Der Dealer tippt auf eine gewinnende Linienposition so oft, wie dort Grundeinsätze liegen. Die App zählt hoch und zeigt für diese Linie — genau wie für Zahlen und Außenwetten — Einsatzsumme, reinen Gewinn, Gesamtauszahlung und den Gewinn pro Chip. Die Linienwette geht in dieselbe Gesamtzeile ein wie alles andere.

**Why this priority**: Das ist der Rechennutzen. Die Linienquoten (17:1, 11:1, 8:1, 5:1) sind genau die, die ein Laien-Dealer am wenigsten auswendig weiß — bei 35:1 und 1:1 kommt er noch selbst zurecht.

**Independent Test**: Testbar, indem nach Eingabe einer Gewinnzahl eine bekannte Anzahl Taps auf bekannte Linienpositionen gesetzt und die Beträge gegen die Quotentabelle geprüft werden.

**Acceptance Scenarios**:

1. **Given** Gewinnzahl 17 und Grundeinsatz Innen 5 €, **When** der Dealer den Split 16/17 zweimal antippt, **Then** zeigt die App Einsatz 10 €, Gewinn 170 €, Auszahlung 180 € und 85 € Gewinn pro Chip.
2. **Given** Gewinnzahl 17 und Grundeinsatz Innen 5 €, **When** der Dealer die Street 16-17-18 einmal antippt, **Then** zeigt die App Einsatz 5 €, Gewinn 55 €, Auszahlung 60 € und 55 € Gewinn pro Chip.
3. **Given** Gewinnzahl 17 und Grundeinsatz Innen 5 €, **When** der Dealer die Corner 16/17/19/20 dreimal antippt, **Then** zeigt die App Einsatz 15 €, Gewinn 120 €, Auszahlung 135 € und 40 € Gewinn pro Chip.
4. **Given** Gewinnzahl 17 und Grundeinsatz Innen 5 €, **When** der Dealer die Sixline 13–18 zweimal antippt, **Then** zeigt die App Einsatz 10 €, Gewinn 50 €, Auszahlung 60 € und 25 € Gewinn pro Chip.
5. **Given** Gewinnzahl 0 und Grundeinsatz Innen 5 €, **When** der Dealer die Basket-Wette 0-1-2-3 zweimal antippt, **Then** zeigt die App Einsatz 10 €, Gewinn 80 €, Auszahlung 90 € und 40 € Gewinn pro Chip.
6. **Given** belegte Zahlen-, Außen- und Linienfelder in derselben Runde, **When** der Dealer die Gesamtzeile abliest, **Then** enthält sie die Gesamtauszahlungen aller belegten Felder aller drei Arten.
7. **Given** ein belegtes Linienfeld, **When** der Dealer die Ergebnisliste betrachtet, **Then** ist aus der Bezeichnung des Eintrags eindeutig erkennbar, um welche Linie es sich handelt (die beteiligten Zahlen sind benannt).

---

### User Story 3 - Linien im Partytempo sicher treffen (Priority: P3)

Linienpositionen liegen auf den Kanten und Ecken zwischen Zahlenfeldern und sind damit kleiner als jedes bisherige Feld. Der Dealer bedient die App im Stehen und in Eile. Er muss eine gewinnende Linie mit einem Griff sicher erreichen, ohne versehentlich das benachbarte Zahlenfeld zu treffen — und er muss einen Fehlgriff sofort erkennen und zurücknehmen können.

**Why this priority**: Das ist die eigentliche Frage des Versuchs. Die Linienwetten nützen nichts, wenn ihr Einbau die Erfassung der Zahlen- und Außenwetten unsicherer macht. Die Rechenfunktion aus US2 ist jedoch auch mit langsamerer Bedienung schon demonstrierbar, daher P3.

**Independent Test**: Testbar, indem eine Testperson für vorgegebene Zahl-/Linien-Kombinationen Einsätze einmal nur über das Tableau und einmal nur über die Liste erfasst und jeweils Fehlgriffe sowie benötigte Zeit protokolliert werden.

Da nicht jeder Bildschirm und nicht jeder Dealer gleich präzise ist, gibt es zwei Wege: Wer sicher trifft, tippt direkt auf die Linie am Tableau. Wird das zu umständlich — etwa auf dem Tablet oder bei kleinen Eckflächen —, wählt der Dealer die Wette aus einer Liste, die nach dem Wurf nur die gewinnenden Linien als große Einträge zeigt.

**Acceptance Scenarios**:

1. **Given** eine eingegebene Gewinnzahl, **When** der Dealer eine gewinnende Linienposition anvisiert, **Then** ist deren Bedienfläche eindeutig einer Linie zugeordnet und überlappt keine andere bedienbare Fläche.
2. **Given** eine eingegebene Gewinnzahl, **When** der Dealer ein Gewinnerfeld belegt, **Then** ist unmittelbar und ohne Suchen erkennbar, welches Feld den Tap erhalten hat.
3. **Given** ein versehentlicher Tap auf die falsche Linienposition, **When** der Dealer Undo auslöst, **Then** ist genau dieser eine Tap zurückgenommen und alle übrigen Einsätze bleiben unverändert.
4. **Given** eine eingegebene Gewinnzahl, **When** der Dealer die aktiven Flächen betrachtet, **Then** sind die gewinnenden Linienpositionen deutlich stärker hervorgehoben als die gesperrten, sodass sie ohne Abzählen gefunden werden.
5. **Given** Gewinnzahl 17, **When** der Dealer die Auswahlliste betrachtet, **Then** enthält sie genau die elf gewinnenden Linienwetten, jede mit Art und beteiligten Zahlen benannt, und keine verlierende.
6. **Given** Gewinnzahl 17, **When** der Dealer einmal auf die Linie 16/17 am Tableau und einmal auf den Listeneintrag "Split 16/17" tippt, **Then** weist die App für diesen Split zwei Einsätze aus, und beide Wege zeigen die Tap-Anzahl 2.
7. **Given** der letzte Tap erfolgte über die Liste, **When** der Dealer Undo auslöst, **Then** wird genau dieser Tap zurückgenommen, und Tableau wie Liste zeigen den verringerten Stand.

---

### User Story 4 - Den Versuch bewerten und notfalls zurücknehmen (Priority: P4)

Nach dem Probelauf entscheidet der Gastgeber, ob die Linienwetten bleiben. Fällt die Entscheidung negativ aus — zu dicht, zu fehleranfällig, zu langsam —, schaltet er sie mit einem Schritt ab und hat wieder genau die App, die er vorher hatte.

**Why this priority**: Der Rückweg macht den Versuch risikolos und entscheidet darüber, ob das Feature überhaupt vor der Party ausprobiert werden darf. Für den Probelauf selbst ist er aber nicht nötig, daher P4.

**Independent Test**: Testbar, indem die Linienwetten abgeschaltet werden und anschließend alle Referenzfälle des Vorgänger-Features unverändert durchlaufen.

**Acceptance Scenarios**:

1. **Given** die Linienwetten sind abgeschaltet, **When** der Dealer eine Runde abrechnet, **Then** verhält sich die App in Darstellung, Bedienung und Berechnung genau wie ohne dieses Feature und alle sieben Referenzfälle des Vorgänger-Features liefern unverändert ihre Ergebnisse.
2. **Given** die Linienwetten sind abgeschaltet, **When** der Dealer das Tableau betrachtet, **Then** ist keine Linienposition sichtbar oder bedienbar und die Zahlen- und Außenfelder nutzen den freien Platz.
3. **Given** die Linienwetten sind eingeschaltet und Einsätze auf Linien erfasst, **When** die Runde zurückgesetzt wird, **Then** sind auch alle Linieneinsätze geleert.

---

### User Story 5 - Volles Tableau auf Laptop und Tablet (Priority: P5)

Der Einsatz erfolgt voraussichtlich auf einem Laptop im Querformat; ausprobiert wird aber auch das Tablet. Das vollständige Tableau mit allen Linienpositionen, die Auswahlliste, die Ergebnisliste und die Gesamtzeile müssen gleichzeitig sichtbar sein — der Dealer darf während einer Runde nicht scrollen müssen. Sind die Linienflächen auf dem Tablet zu klein zum sicheren Treffen, bleibt die Auswahlliste der verlässliche Weg.

**Why this priority**: Der zusätzliche Platz ist der Anlass für dieses Feature, aber die Anforderung ist eine Darstellungsfrage und keine Funktionsfrage.

**Independent Test**: Testbar, indem auf dem Zielgerät eine Runde mit mehreren belegten Linienfeldern gespielt und geprüft wird, dass zu keinem Zeitpunkt gescrollt werden muss.

**Acceptance Scenarios**:

1. **Given** die App läuft auf dem Ziel-Laptop im Querformat, **When** eine Runde mit den maximal möglichen siebzehn Gewinnerfeldern läuft, **Then** sind Tableau, Ergebnisliste und Gesamtauszahlung ohne Scrollen gleichzeitig sichtbar.
2. **Given** die App läuft auf einem Tablet im Querformat mit eingeschalteten Linienwetten, **When** der Dealer eine Runde mit Linieneinsätzen abrechnet, **Then** kann er jede gewinnende Linienwette mindestens über die Auswahlliste sicher erfassen, ohne zu scrollen.

---

### Edge Cases

- **Gefallene 0**: Alle Außenwetten verlieren weiterhin vollständig. Gewinnen können nur das Feld 0 und die sechs Linienpositionen, die die 0 enthalten (drei Splits, zwei Trios, die Basket-Wette). Weiterhin kein La Partage, kein En Prison.
- **Randlinien**: Zahlen am Rand des Tableaus (1, 2, 3, 34, 35, 36 sowie die obere und untere Zahlenreihe) haben weniger gewinnende Linien als Zahlen in der Mitte. Es darf keine Linienposition außerhalb des Tableaus entstehen, etwa ein Split zwischen 3 und 4 oder zwischen 34 und 37.
- **Gewinnzahl-Eingabe versus Linien-Tap**: Eine Linienposition kann niemals eine Gewinnzahl setzen. Solange keine Gewinnzahl feststeht, ist jede Linienposition wirkungslos.
- **Gewinnzahl-Korrektur mit erfassten Linieneinsätzen**: Die bestehende Rückfrage gilt unverändert und verwirft auch die Linieneinsätze.
- **Undo über verschiedene Feldarten hinweg**: Undo nimmt den zuletzt erfassten Tap zurück, unabhängig davon, ob er auf einer Zahl, einer Außenwette oder einer Linie lag.
- **Viele belegte Felder gleichzeitig**: Bei bis zu siebzehn belegten Gewinnerfeldern bleibt die Ergebnisliste vollständig lesbar und die Gesamtsumme korrekt.
- **Jeton liegt objektiv unklar**: Die App entscheidet nicht, welche Wette gemeint war. Sie zeigt alle gewinnenden Möglichkeiten; die Zuordnung bleibt Sache des Dealers.
- **Sehr hohe Tap-Zahl auf einer Linie**: Beträge und Tap-Anzahl bleiben vollständig und lesbar dargestellt.
- **Neuladen der Seite**: Wie bisher geht der Rundenzustand verloren und die App startet neutral.

## Requirements *(mandatory)*

### Functional Requirements

**Umfang der Linienwetten**

- **FR-001**: Das System MUSS zusätzlich zu den bestehenden 37 Zahlenfeldern und 12 Außenwetten alle Linienwetten des europäischen Tableaus als bebaubare Felder führen: 60 Splits, 12 Streets, 22 Corners, 11 Sixlines, die beiden Trios 0-1-2 und 0-2-3 sowie die Basket-Wette 0-1-2-3 — insgesamt 108 zusätzliche Felder.
- **FR-002**: Das System MUSS die Splits am Nullfeld (0/1, 0/2, 0/3), die Trios (0-1-2, 0-2-3) und die Basket-Wette (0-1-2-3) einschließen, damit ein Jeton am Nullfeld nicht unabrechenbar bleibt.
- **FR-003**: Das System DARF KEINE Linienposition führen, die auf dem physischen Tableau nicht existiert — insbesondere keinen Split zwischen zwei Zahlen, die nur wegen der Zeilenumbrüche benachbart erscheinen, und keine Position, die über den Rand des Tableaus hinausreicht.
- **FR-004**: Das System MUSS jede Linienposition so benennen, dass die beteiligten Zahlen aus der Bezeichnung hervorgehen.

**Gewinnermittlung**

- **FR-005**: Das System MUSS nach Eingabe der Gewinnzahl genau diejenigen Linienpositionen als Gewinner kennzeichnen, die die Gewinnzahl enthalten.
- **FR-006**: Das System MUSS bei der Gewinnzahl 0 genau die sechs Linienpositionen als Gewinner kennzeichnen, die die 0 enthalten, und alle übrigen Linienpositionen sperren.
- **FR-007**: Das System MUSS alle nicht gewinnenden Linienpositionen sichtbar als Verlierer kennzeichnen und deren Bedienung unterbinden.
- **FR-008**: Das System MUSS die Einsatzerfassung auf Linienpositionen unterbinden, solange keine Gewinnzahl eingegeben ist.
- **FR-009**: Das System DARF KEINE Gewinnzahl aus einem Tap auf eine Linienposition ableiten; die Gewinnzahl wird ausschließlich über die Zahlenfelder eingegeben.

**Einsatzerfassung und Berechnung**

- **FR-010**: Der Dealer MUSS auf jeder gewinnenden Linienposition Einsätze durch wiederholtes Antippen erfassen können, wobei jeder Tap den Einsatz um genau einen konfigurierten Grundeinsatz erhöht.
- **FR-011**: Das System MUSS Linienwetten nach folgenden Quoten abrechnen: Split 17:1, Street 11:1, Trio 11:1, Corner 8:1, Basket-Wette 8:1, Sixline 5:1.
- **FR-012**: Das System MUSS für Linienwetten denselben Grundeinsatz verwenden wie für Einzelzahlen, da es sich in beiden Fällen um Innenwetten mit demselben Jeton handelt.
- **FR-013**: Das System MUSS für jede belegte Linienposition dieselben vier Werte ausweisen wie für die bestehenden Felder: Einsatzsumme, reinen Gewinn, Gesamtauszahlung und Gewinn pro Chip.
- **FR-014**: Das System MUSS Linienwetten in dieselbe Gesamtauszahlung der Runde einrechnen wie Zahlen- und Außenwetten.
- **FR-015**: Das System MUSS alle Beträge für Linienwetten unmittelbar nach jeder Eingabe aktualisieren und mit dem konfigurierten Währungssymbol darstellen.

**Korrektur**

- **FR-016**: Undo MUSS einen einzelnen Tap auf einer Linienposition zurücknehmen und dabei in derselben chronologischen Reihenfolge arbeiten wie für Zahlen- und Außenwetten.
- **FR-017**: Der Dealer MUSS eine einzelne Linienposition gezielt leeren können, ohne andere Felder zu verändern.
- **FR-018**: Das Zurücksetzen der Runde MUSS auch alle erfassten Linieneinsätze leeren.
- **FR-019**: Das Ändern der Gewinnzahl MUSS die bestehende Bestätigungsrückfrage auslösen, sobald Einsätze erfasst sind — auch wenn diese ausschließlich auf Linienpositionen liegen — und bei Bestätigung auch die Linieneinsätze verwerfen.

**Bedienbarkeit**

- **FR-020**: Das System MUSS jede Linienposition auf zwei gleichwertigen Wegen bedienbar machen: (a) an ihrer echten Position auf dem Tableau, also auf der Kante beziehungsweise Ecke zwischen den beteiligten Zahlenfeldern, und (b) über eine Auswahlliste, die nach Eingabe der Gewinnzahl ausschließlich die gewinnenden Linienwetten als große, einzeln bedienbare Einträge zeigt.
- **FR-020a**: Ein Tap auf die Linienposition am Tableau und ein Tap auf den zugehörigen Listeneintrag MÜSSEN exakt dieselbe Wirkung haben: beide erhöhen denselben Einsatzposten, erscheinen als ein Schritt in derselben Undo-Reihenfolge und werden auf beiden Wegen sofort als belegt angezeigt.
- **FR-020b**: Die Auswahlliste MUSS jeden Eintrag nach Art und beteiligten Zahlen benennen (z. B. "Split 16/17", "Corner 16/17/19/20"), die aktuelle Tap-Anzahl zeigen und in einer festen, am Tableau nachvollziehbaren Reihenfolge sortiert sein.
- **FR-020c**: Die Auswahlliste MUSS ohne Scrollen erreichbar sein und bei der Gewinnzahl mit den meisten gewinnenden Linien (elf) alle Einträge gleichzeitig zeigen.
- **FR-021**: Das System MUSS sicherstellen, dass sich die Bedienflächen von Linienpositionen, Zahlenfeldern und Außenwetten nicht überlappen und jeder Tap eindeutig genau einem Feld zugeordnet wird.
- **FR-022**: Das System MUSS gewinnende Linienpositionen so hervorheben, dass sie ohne Suchen zu finden sind, und gesperrte Linienpositionen visuell so weit zurücknehmen, dass sie das Tableau nicht unruhig machen.
- **FR-023**: Das System MUSS nach jedem Tap unmittelbar erkennbar machen, welches Feld ihn erhalten hat.
- **FR-024**: Das System MUSS für Linienpositionen visuell unterscheidbare Zustände darstellen: neutral, Gewinner, Verlierer und belegt.
- **FR-025**: Das System MUSS das vollständige Tableau samt Linienpositionen gemeinsam mit Auswahlliste, Ergebnisliste und Gesamtauszahlung auf dem Ziel-Laptop und auf dem Tablet, jeweils im Querformat, ohne Scrollen darstellen.
- **FR-026**: Das System MUSS die Bedienflächen der Zahlen- und Außenwetten mindestens so gut treffbar halten wie vor dem Einbau der Linienwetten.

**Rückweg und Fortbestand**

- **FR-027**: Der Gastgeber MUSS die Linienwetten an derselben leicht auffindbaren Stelle wie die übrige Konfiguration vollständig abschalten können.
- **FR-028**: Das System MUSS bei abgeschalteten Linienwetten in Darstellung, Bedienung und Berechnung dem Zustand vor diesem Feature entsprechen.
- **FR-029**: Das System MUSS alle bestehenden Anforderungen des Vorgänger-Features unverändert erfüllen — insbesondere die Sperrung verlierender Felder, den Betrieb ohne Netzverbindung und den Verzicht auf jede Speicherung über die Runde hinaus.

### Key Entities

- **Linienwette**: Ein Wettfeld, das zwei bis sechs Zahlen zusammenfasst und auf dem physischen Tableau auf einer Kante oder Ecke zwischen Zahlenfeldern liegt. Trägt eine Art (Split, Street, Trio, Corner, Basket, Sixline), die Menge der beteiligten Zahlen, eine Auszahlungsquote und eine Position auf dem Tableau.
- **Wettfeld** *(erweitert)*: Die bestehende Entität wird um die Art "Linienwette" ergänzt. Alle Linienwetten gehören zum Grundeinsatz-Typ "Innen" und durchlaufen dieselben Zustände (neutral, Gewinner, Verlierer, belegt) wie Zahlen und Außenwetten.
- **Konfiguration** *(erweitert)*: Enthält zusätzlich den Schalter, ob Linienwetten angeboten werden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Für jede der 37 möglichen Gewinnzahlen stimmt die Menge der als Gewinner gekennzeichneten Felder exakt mit der Menge der Felder überein, die diese Zahl enthalten — null Abweichungen über alle 157 Felder und alle 37 Zahlen.
- **SC-002**: Alle sechs Referenzfälle im Abschnitt "Reference Scenarios" liefern exakt die dort genannten Beträge — null Abweichungen.
- **SC-003**: Ein Dealer ermittelt die vollständige Auszahlung einer Runde mit vier belegten Gewinnerfeldern, von denen mindestens zwei Linienwetten sind, in unter 30 Sekunden ab Eingabe der Gewinnzahl.
- **SC-004**: Über eine Testsession von mindestens 20 Runden mit eingeschalteten Linienwetten ist kein einziger verlorener Einsatz erfassbar.
- **SC-005**: Über mindestens 50 gezielte Taps auf vorgegebene Linienpositionen trifft eine stehende Testperson über die Auswahlliste in mindestens 99 % der Fälle beim ersten Versuch das beabsichtigte Feld; für die Trefferzonen am Tableau wird die Quote je Gerät (Laptop, Tablet) gemessen und dokumentiert, mit 95 % als Zielwert auf dem Laptop.
- **SC-006**: Die Zeit zur Abrechnung einer Runde ohne Linieneinsätze verlängert sich durch das eingeschaltete Feature um höchstens 10 % gegenüber der Messung vor dem Einbau.
- **SC-007**: Nach Abschalten der Linienwetten liefern alle sieben Referenzfälle des Vorgänger-Features unverändert ihre Ergebnisse — null Regressionen.
- **SC-008**: Auf dem Ziel-Laptop im Querformat ist bei siebzehn gleichzeitig aktiven Gewinnerfeldern kein Scrollen nötig, und jeder Auszahlungsbetrag bleibt aus 50 cm Entfernung fehlerfrei lesbar.
- **SC-009**: Der Gastgeber trifft nach dem Probelauf eine dokumentierte Entscheidung über den Verbleib der Linienwetten und je Gerät darüber, ob die Trefferzonen am Tableau oder die Auswahlliste der bevorzugte Weg ist, gestützt auf die Messwerte aus SC-003, SC-005 und SC-006.

## Reference Scenarios

Verbindlicher Abnahmenachweis, ergänzend zu den sieben Fällen des Vorgänger-Features. Beträge beziehen sich auf den Vorgabewert Grundeinsatz Innen 5 €.

| # | Ausgangslage | Erwartetes Ergebnis |
|---|---|---|
| 1 | Gefallene Zahl 17 | 17 Felder aktiv: 17, Schwarz, Ungerade, 1–18, 2. Dutzend, 2. Kolonne, 4 Splits, 1 Street, 4 Corners, 2 Sixlines. Alles Übrige gesperrt. |
| 2 | Gefallene Zahl 0 | 7 Felder aktiv: 0, die Splits 0/1, 0/2, 0/3, die Trios 0-1-2 und 0-2-3 sowie 0-1-2-3. Alle Außenwetten gesperrt. |
| 3 | Split, 2 Einsätze à 5 € | Einsatz 10 €, Gewinn 170 €, Auszahlung 180 €, pro Chip 85 € Gewinn. |
| 4 | Street, 1 Einsatz à 5 € | Einsatz 5 €, Gewinn 55 €, Auszahlung 60 €, pro Chip 55 € Gewinn. |
| 5 | Corner, 3 Einsätze à 5 € | Einsatz 15 €, Gewinn 120 €, Auszahlung 135 €, pro Chip 40 € Gewinn. |
| 6 | Sixline, 2 Einsätze à 5 € | Einsatz 10 €, Gewinn 50 €, Auszahlung 60 €, pro Chip 25 € Gewinn. |

## Assumptions

- **Versuchscharakter**: Das Feature wird eingebaut, um es zu bewerten. Der Rückweg über den Konfigurationsschalter ist Teil des Umfangs und keine spätere Ergänzung.
- **Ein Grundeinsatz für alle Innenwetten**: Linienwetten verwenden denselben Grundeinsatz wie Einzelzahlen. Ein eigener Grundeinsatz je Linienart ist nicht vorgesehen, weil am Tisch derselbe Jeton verwendet wird.
- **Ganzzahligkeit bleibt erhalten**: Alle Linienquoten sind ganzzahlig, daher bleiben mit ganzen Grundeinsätzen auch alle Linienbeträge ganzzahlig und es ist weiterhin keine Rundungsregel nötig.
- **Zielgeräte Laptop und Tablet**: Der Laptop im Querformat ist das voraussichtliche Einsatzgerät. Das Tablet wird mit eingeschalteten Linienwetten ebenfalls ausprobiert; sind die Trefferzonen dort zu klein, ist die Auswahlliste der vorgesehene Weg und kein Mangel.
- **Zwei Wege, ein Einsatzposten**: Tableau und Auswahlliste sind nur zwei Zugänge zum selben Feld. Es gibt keinen getrennten Zustand je Weg (Entscheidung Option C, 2026-09-27).
- **Bedienung per Zeigegerät und Berührung**: Auf dem Laptop kann der Dealer mit Maus oder Trackpad arbeiten, was kleinere Flächen zulässt. Die Treffsicherheit wird trotzdem unter den realen Bedingungen "im Stehen, in Eile" gemessen.
- **Null-Regel unverändert**: Bei 0 verlieren alle Außenwetten vollständig. Das betrifft die Linienwetten nicht: die sechs Linien am Nullfeld gewinnen regulär.
- **Keine Deutung unklarer Jetons**: Die App ordnet einen schief liegenden Jeton nicht automatisch einer Wette zu. Sie zeigt die Möglichkeiten; die Entscheidung bleibt beim Dealer.
- **Keine Persistenz**: Wie bisher wird nichts über die Runde hinaus gespeichert, auch keine Linieneinsätze.
- **Bestehende Architektur bleibt tragend**: Linienwetten werden als weitere Wettfelder in denselben Katalog aufgenommen und durchlaufen dieselbe Berechnung. Wie das umgesetzt wird, ist Sache der Planungsphase.
- **Messbasis für SC-006**: Die Vergleichsmessung "vor dem Einbau" wird am bestehenden Stand erhoben, bevor die Linienwetten eingeschaltet werden.

## Out of Scope

- Amerikanisches Roulette (Doppel-Null) sowie die dortige Five-Number-Wette 0-00-1-2-3
- Ansagewetten und Kesselwetten (Voisins du Zéro, Tiers du Cylindre, Orphelins, Finales, Nachbarn)
- La Partage und En Prison bei der 0
- Eigene Grundeinsätze je Linienart
- Automatische Deutung, welche Wette ein unklar liegender Jeton darstellt
- Erfassung verlierender Linieneinsätze oder Berechnung des Bankgewinns
- Alle Nicht-Ziele des Vorgänger-Features: Spielerverwaltung, Kontostände, sitzungsübergreifende Historie, Zuordnung von Chips zu Personen, Multi-Tisch-Betrieb
