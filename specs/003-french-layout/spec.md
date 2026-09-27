# Feature Specification: Französisches Tableau

**Feature Branch**: `003-french-layout`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "derzeit ist das europäische layout gewählt. das vorhandene ist französisch. wir sollten das layout entsprechend ändern"

## Overview

Die App zeigt das Tableau bisher im internationalen ("europäischen") Layout: quer liegend, die 0 links, drei Reihen à zwölf Zahlen, darunter die Dutzende und eine Reihe mit den einfachen Chancen (1–18, Gerade, Rot, Schwarz, Ungerade, 19–36), beschriftet auf Deutsch.

Der Tisch auf der Party hat aber ein **französisches** Tuch. Dort liegt das Zahlenfeld senkrecht — die 0 oben, darunter zwölf Reihen à drei Zahlen —, die einfachen Chancen stehen links und rechts neben dem Zahlenfeld, die Dutzende liegen zweimal (je ein Satz pro Seite), die Kolonnen unten, und alles ist französisch beschriftet (Manque, Passe, Pair, Impair, Rouge, Noir, P12, M12, D12).

Der Dealer muss heute also zwischen zwei unterschiedlichen Bildern hin- und herübersetzen: Ein Jeton, der am Tisch "rechts oben neben der 3" liegt, ist in der App an einer ganz anderen Stelle. Genau dieses Übersetzen kostet Zeit und erzeugt Fehler — besonders bei Laien-Dealern und bei Linienwetten. Dieses Feature bringt das Tableau der App in dieselbe Anordnung wie das Tuch, damit der Dealer einen Jeton an derselben Stelle antippt, an der er ihn liegen sieht.

**Nur die Darstellung ändert sich**: Spielregeln, Quoten, Null-Regel, Einsatzerfassung, Ergebnisberechnung und Linienwetten bleiben inhaltlich unverändert. Jede Wette ist nach der Umstellung dieselbe Wette mit demselben Ergebnis wie vorher — sie liegt nur woanders und heißt auf dem Tableau anders.

## Clarifications

### Session 2026-09-27

- Q: Ausrichtung des Tableaus? → A: Senkrecht wie am Tisch — 0 oben, zwölf Reihen à drei, einfache Chancen links und rechts, Kolonnen unten.
- Q: Beschriftung der Außenwetten? → A: Französisch auf dem Tableau; die Ergebnisliste zeigt zusätzlich die deutsche Bedeutung.
- Q: Doppelte Dutzende? → A: Beide Positionen werden gezeigt, bilden aber einen einzigen Wettposten.
- Q: Gelten mit dem französischen Tuch auch französische Sonderregeln (La Partage, En Prison)? → A: Nein. Nur das Layout ändert sich, die Regeln bleiben.
- Q: Mindest-Tippgröße vs. kein Scrollen bei 1366×768? → A: Kein Scrollen hat Vorrang; Felder werden niedriger (kürzere Kante ≥ 36 px), aber breiter, sodass die Tippfläche mindestens gleich bleibt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tableau sieht aus wie das Tuch (Priority: P1)

Der Dealer blickt vom Tisch auf die App und findet jedes Feld an derselben relativen Position wie auf dem französischen Tuch: die 0 oben, die Zahlen in Dreierreihen von oben nach unten aufsteigend, Manque/Pair/Rouge links, Passe/Impair/Noir rechts, die Dutzende auf beiden Seiten, die Kolonnen unten. Er tippt die gefallene Zahl dort an, wo sie auch auf dem Tuch liegt.

**Why this priority**: Das ist der Kern der Änderung. Schon die senkrechte Zahlenanordnung mit der 0 oben beseitigt das gedankliche Drehen um 90°, das heute bei jeder Eingabe nötig ist.

**Independent Test**: Tableau der App neben ein Foto bzw. den Tisch legen und für jedes Feld prüfen, ob es an der entsprechenden Stelle liegt und die entsprechende Beschriftung trägt.

**Acceptance Scenarios**:

1. **Given** die App ist geöffnet, **When** der Dealer das Tableau betrachtet, **Then** liegt die 0 oben über der gesamten Breite des Zahlenfelds, darunter folgen zwölf Reihen à drei Zahlen, von oben nach unten 1-2-3, 4-5-6 … 34-35-36, wobei jeweils die kleinste Zahl links steht.
2. **Given** die App ist geöffnet, **When** der Dealer die Außenwetten betrachtet, **Then** stehen links neben dem Zahlenfeld von oben nach unten Manque, Pair, Rouge und rechts Passe, Impair, Noir; darunter auf jeder Seite P12, M12, D12; unter dem Zahlenfeld die drei Kolonnen, jeweils unter der Spalte, die sie gewinnen lässt.
3. **Given** die App ist geöffnet, **When** der Dealer die Zahlenfelder betrachtet, **Then** hat jede Zahl weiterhin ihre echte Farbe (0 grün, übrige rot bzw. schwarz) wie bisher.
4. **Given** eine laufende Runde ohne Gewinnzahl, **When** der Dealer eine Zahl antippt, **Then** wird genau diese Zahl als Gewinnzahl gesetzt und dieselben Felder werden als Gewinner markiert wie im bisherigen Layout.

---

### User Story 2 - Einsätze an der gewohnten Stelle erfassen (Priority: P2)

Nach dem Wurf tippt der Dealer die belegten Gewinnerfelder an — jetzt dort, wo sie auf dem Tuch liegen. Liegt ein Jeton auf dem rechten P12, tippt er das rechte P12 an; liegt einer auf dem linken, das linke. Beide zählen auf dasselbe erste Dutzend, beide leuchten gemeinsam als Gewinner bzw. belegt, und in der Ergebnisliste erscheint das Dutzend nur einmal.

**Why this priority**: Der Rechennutzen bleibt derselbe wie bisher; die Erfassung wird aber schneller und sicherer, weil der Blick nicht zwischen zwei Bildern wechseln muss.

**Independent Test**: Nach Eingabe einer Gewinnzahl je ein Dutzend auf beiden Seiten antippen und prüfen, dass Zählung, Anzeige und Ergebnis genau einem Posten entsprechen.

**Acceptance Scenarios**:

1. **Given** Gewinnzahl 5, **When** der Dealer das linke P12 einmal und das rechte P12 einmal antippt, **Then** zeigt das erste Dutzend zwei Einsätze, beide P12-Felder zeigen denselben Zählerstand und die Ergebnisliste führt einen einzigen Eintrag für das erste Dutzend.
2. **Given** Gewinnzahl 5, **When** der Dealer das Feld P12 betrachtet, **Then** sind linkes und rechtes P12 beide als Gewinner markiert; M12 und D12 sind auf beiden Seiten gesperrt.
3. **Given** Gewinnzahl 0, **When** der Dealer die Außenwetten betrachtet, **Then** sind alle Außenwetten einschließlich beider Dutzend-Sätze und aller Kolonnen gesperrt (Null-Regel unverändert).
4. **Given** ein belegtes Dutzend, **When** der Dealer dieses Feld gezielt leert (egal über welche der beiden Positionen), **Then** ist der Posten auf beiden Positionen geleert.

---

### User Story 3 - Französische Begriffe verstehen (Priority: P3)

Das Tableau ist französisch beschriftet wie das Tuch. Ein Gast-Dealer, der die Begriffe nicht kennt, findet in der Ergebnisliste neben dem französischen Begriff die deutsche Bedeutung, sodass er nachvollziehen kann, was er abrechnet.

**Why this priority**: Die französische Beschriftung ist nötig, damit Tuch und App übereinstimmen; die Übersetzungshilfe macht sie für Laien verständlich, ist aber nicht Voraussetzung für die Abrechnung.

**Independent Test**: Außenwetten belegen und prüfen, dass die Einträge der Ergebnisliste den französischen Begriff und die deutsche Bedeutung zeigen.

**Acceptance Scenarios**:

1. **Given** Gewinnzahl 14 und belegte Felder Manque, Pair, Rouge und M12, **When** der Dealer die Ergebnisliste betrachtet, **Then** tragen die Einträge die Bezeichnungen "Manque (1–18)", "Pair (Gerade)", "Rouge (Rot)" und "M12 (2. Dutzend)".
2. **Given** die App ist geöffnet, **When** der Dealer die Bedienelemente außerhalb des Tableaus betrachtet (Knöpfe, Hinweise, Dialoge), **Then** sind diese weiterhin deutsch.

---

### User Story 4 - Linienwetten im senkrechten Tableau (Priority: P2)

Bei eingeschalteten Linienwetten liegen die Trefferzonen im senkrechten Tableau wieder auf den Linien zwischen den Zahlen — genau dort, wo auf dem französischen Tuch die Jetons für Cheval, Transversale, Carré und Sixain liegen. Die Auswahlliste der gewinnenden Linien bleibt als zweiter Weg erhalten.

**Why this priority**: Die Linienwetten sind gerade eingeführt worden und im Einsatz; ohne Neuanordnung wären sie nach der Drehung an falscher Stelle oder gar nicht erreichbar. Gleiche Priorität wie die Einsatzerfassung, weil sie Teil davon ist.

**Independent Test**: Für mehrere Gewinnzahlen prüfen, dass jede aktive Linienzone zwischen genau den Zahlen liegt, die sie umfasst.

**Acceptance Scenarios**:

1. **Given** Linienwetten eingeschaltet und Gewinnzahl 17, **When** der Dealer das Tableau betrachtet, **Then** sind genau die elf Linienpositionen des Vorgänger-Features aktiv, und jede liegt geometrisch zwischen ihren Zahlen: die Splits 16/17 und 17/18 auf den senkrechten Linien links und rechts der 17, die Splits 14/17 und 17/20 auf den waagerechten Linien darüber und darunter, die Corners auf den Kreuzungspunkten um die 17.
2. **Given** Linienwetten eingeschaltet, **When** der Dealer die Street 16-17-18 sucht, **Then** liegt ihre Zone am äußeren Rand der Reihe 16-17-18, und die Sixline 13–18 liegt am selben Rand auf der Linie zwischen den Reihen 13-14-15 und 16-17-18.
3. **Given** Linienwetten eingeschaltet, **When** der Dealer die Wetten an der 0 sucht, **Then** liegen die Splits 0/1, 0/2, 0/3 auf der Linie zwischen 0 und der ersten Reihe, die Trios 0-1-2 und 0-2-3 auf den Kreuzungspunkten dieser Linie, und 0-1-2-3 am äußeren Rand dieser Linie.
4. **Given** Linienwetten ausgeschaltet, **When** der Dealer das Tableau betrachtet, **Then** zeigt es das französische Layout ohne Linienzonen.

---

### Edge Cases

- **Hochformat oder schmales Fenster**: Das senkrechte Tableau ist hoch und schmal. Ist die Höhe knapp (Tablet im Querformat mit eingeschalteten Linienwetten), darf das Tableau nicht so weit schrumpfen, dass Zahlenfelder unter die bisherige Mindest-Tippgröße fallen; der vorgesehene Ausweg für Linienwetten auf dem Tablet bleibt die Auswahlliste.
- **Zwei Positionen, ein Posten**: Ein langer Druck (Leeren) auf ein Dutzend wirkt auf den Posten, nicht auf eine der beiden Positionen. Es gibt keinen Zustand, in dem die beiden Positionen desselben Dutzends unterschiedlich aussehen.
- **Gesperrte zweite Position**: Ist ein Dutzend verloren, sind beide Positionen gesperrt; ein Tap auf irgendeine davon ändert nichts.
- **Kolonnen-Beschriftung**: Das französische Tuch beschriftet die Kolonnen oft nur mit einem Symbol bzw. gar nicht. Die App zeigt die Kolonnenfelder mit einer Kurzbezeichnung, die eindeutig macht, welche Spalte gemeint ist, weil sie direkt unter dieser Spalte stehen.
- **Rouge/Noir**: Das Tuch zeigt Rot und Schwarz oft nur als farbige Raute. Die App darf die Felder zusätzlich zum Begriff farbig kennzeichnen, der Begriff bleibt aber lesbar.
- **Laufende Runde bei Umstellung**: Da die Umstellung eine Auslieferung einer neuen Fassung ist und ein Neuladen die Runde ohnehin verwirft, entsteht kein Übergangszustand.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUSS das Zahlenfeld senkrecht darstellen: die 0 als oberstes Feld über die volle Breite der drei Zahlenspalten, darunter zwölf Reihen à drei Zahlen in aufsteigender Folge (1-2-3 oben, 34-35-36 unten), die kleinste Zahl jeder Reihe links.
- **FR-002**: Das System MUSS links neben dem Zahlenfeld von oben nach unten die Felder Manque (1–18), Pair (Gerade) und Rouge (Rot) und rechts Passe (19–36), Impair (Ungerade) und Noir (Schwarz) darstellen.
- **FR-003**: Das System MUSS die drei Dutzende auf beiden Seiten des Zahlenfelds je einmal darstellen, unterhalb der einfachen Chancen, beschriftet mit P12 (1–12), M12 (13–24) und D12 (25–36).
- **FR-004**: Beide Positionen eines Dutzends MÜSSEN denselben Wettposten darstellen: Ein Tap auf eine Position zählt auf den gemeinsamen Posten, beide Positionen zeigen stets denselben Zustand (neutral, Gewinner, belegt, gesperrt) und denselben Zählerstand, und die Ergebnisliste führt jedes Dutzend höchstens einmal.
- **FR-005**: Das System MUSS die drei Kolonnen unterhalb des Zahlenfelds darstellen, jede direkt unter der Spalte, deren Zahlen sie gewinnen lässt.
- **FR-006**: Das System MUSS die Außenwetten auf dem Tableau mit den französischen Begriffen beschriften (Manque, Passe, Pair, Impair, Rouge, Noir, P12, M12, D12).
- **FR-007**: Das System MUSS in der Ergebnisliste für jede Außenwette den französischen Begriff zusammen mit der deutschen Bedeutung anzeigen (z. B. "Manque (1–18)").
- **FR-008**: Alle Bedienelemente, Hinweise und Dialoge außerhalb der Tableau-Beschriftung MÜSSEN deutsch bleiben.
- **FR-009**: Bei eingeschalteten Linienwetten MUSS jede Linienzone im senkrechten Tableau zwischen genau den Zahlen liegen, die sie umfasst: Splits auf der gemeinsamen Kante zweier Zahlen, Corners auf dem gemeinsamen Eckpunkt von vier Zahlen, Streets am äußeren Rand ihrer Reihe, Sixlines am selben Rand auf der Linie zwischen ihren beiden Reihen, die Splits und Trios an der 0 auf der Linie zwischen 0 und erster Reihe und 0-1-2-3 am äußeren Ende dieser Linie.
- **FR-010**: Die Auswahlliste der gewinnenden Linien MUSS unverändert erhalten bleiben.
- **FR-011**: Das System MUSS für jede Gewinnzahl exakt dieselbe Menge an Gewinnerfeldern, dieselben Quoten und dieselben Beträge liefern wie vor der Umstellung; alle Referenzfälle der beiden Vorgänger-Features MÜSSEN unverändert bestehen.
- **FR-012**: Die Farben der Zahlenfelder, die Zustandsdarstellung (neutral, Gewinner, belegt, gesperrt) und die Bedienung (Tap zum Zählen, langer Druck zum Leeren, Sperre verlorener Felder) MÜSSEN wie bisher funktionieren.
- **FR-013**: Das französische Layout ersetzt das bisherige Layout; eine Umschaltmöglichkeit zwischen beiden Layouts ist nicht vorgesehen.
- **FR-014**: Zahlen- und Außenwettfelder MÜSSEN mindestens so viel Tippfläche bieten wie bisher; die kürzere Kante eines Feldes darf dabei auf bis zu 36 px sinken, weil das senkrechte Tableau die Felder niedriger, aber deutlich breiter macht. Das Tableau passt ohne Scrollen auf den Bildschirm (SC-006) — das hat Vorrang vor einer festen Mindesthöhe (Entscheidung 2026-09-27).
- **FR-015**: Die Spielregeln MÜSSEN unverändert bleiben: Bei 0 verlieren alle Außenwetten vollständig. Weder La Partage (Rückgabe des halben Einsatzes bei 0) noch En Prison werden eingeführt, auch wenn sie an französischen Tischen üblich sind.

### Key Entities

- **Wettposten**: Die abrechenbare Wette (z. B. "1. Dutzend") mit Quote, Gewinnbedingung, Zählerstand und Zustand. Unverändert gegenüber den Vorgänger-Features.
- **Tableau-Position**: Eine antippbare Stelle auf dem Tableau, die genau einem Wettposten zugeordnet ist. Neu ist, dass ein Wettposten mehr als eine Tableau-Position haben kann (die Dutzende haben je zwei); alle Positionen eines Postens teilen dessen Zustand.
- **Tableau-Beschriftung**: Der französische Begriff einer Außenwette auf dem Tableau und die zugehörige deutsche Bedeutung für die Ergebnisliste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Beim Abgleich mit dem französischen Tuch des Gastgebers liegt jedes der 49 Zahlen- und Außenwettfelder (37 Zahlen, 6 einfache Chancen, 3 Dutzende auf beiden Seiten, 3 Kolonnen) an der entsprechenden relativen Position und trägt die entsprechende Beschriftung — null Abweichungen.
- **SC-002**: Für jede der 37 möglichen Gewinnzahlen ist die Menge der markierten Gewinnerfelder identisch mit der vor der Umstellung — null Abweichungen; alle Referenzfälle beider Vorgänger-Features liefern unverändert ihre Beträge.
- **SC-003**: Bei eingeschalteten Linienwetten liegt jede der 108 Linienzonen zwischen genau den Zahlen, die sie umfasst — null falsch platzierte Zonen.
- **SC-004**: Ein Dealer, der das Tuch kennt, findet eine vom Tisch angesagte Zahl bzw. Außenwette in der App im Mittel schneller als im bisherigen Layout (Vergleichsmessung an denselben Testpersonen, je 20 Eingaben).
- **SC-005**: In einem Testlauf von 50 Einsatzerfassungen am realen Tisch tippt der Dealer höchstens einmal ein falsches Feld an, weil es in der App an anderer Stelle liegt als auf dem Tuch.
- **SC-006**: Auf dem Laptop im Querformat ist das gesamte Tableau einschließlich Linienzonen ohne Scrollen sichtbar; auf dem Tablet im Querformat gilt das mindestens bei ausgeschalteten Linienwetten.

## Assumptions

- **Anordnung wie gewählt**: Die Seitenzuordnung (Manque/Pair/Rouge links, Passe/Impair/Noir rechts; Dutzende beidseitig; Kolonnen unten) entspricht dem gängigen französischen Tuch und wurde vom Gastgeber so bestätigt (2026-09-27). Weicht das Tuch des Gastgebers im Detail ab, gilt das Tuch; der Abgleich in SC-001 ist der Nachweis.
- **Blickrichtung**: Das Tableau wird so gezeigt, wie der Dealer das Tuch vor sich sieht — mit der 0 von ihm aus oben bzw. am fernen Ende. Eine Drehung für Spieler auf der Gegenseite ist nicht vorgesehen.
- **Ein Posten je Dutzend**: Die doppelten Dutzende sind reine Anzeige am Tuch-Ort; es gibt keine getrennte Abrechnung nach Tischseite (Entscheidung 2026-09-27).
- **Nur Außenwetten französisch**: Die Bezeichnungen der Linienwetten in Ergebnisliste und Auswahlliste bleiben wie im Vorgänger-Feature; eine Umbenennung in Cheval, Transversale usw. gehört nicht zum Umfang.
- **Streets am linken Rand**: Streets und Sixlines liegen am äußeren Rand der Reihe auf der Seite der kleinsten Zahl, also zwischen Zahlenfeld und linken einfachen Chancen. Liegt am Tisch des Gastgebers die andere Seite üblich, wird entsprechend gespiegelt; auch das deckt der Abgleich in SC-001/SC-003 ab.
- **Regeln unverändert**: Französisches Tuch bedeutet hier ausschließlich Anordnung und Beschriftung. Die Hausregel "bei 0 verlieren alle Außenwetten vollständig" gilt weiter; La Partage und En Prison werden nicht eingeführt.
- **Zielgeräte**: Laptop im Querformat ist das Haupteinsatzgerät, das Tablet im Querformat wird weiter unterstützt. Das hohe, schmale Tableau lässt neben sich mehr Platz für das Ergebnisfeld.
- **Keine Persistenz, keine neuen Einstellungen**: Das Layout ist fest; die Konfigurationsdatei erhält keinen neuen Schalter.
- **Messbasis für SC-004**: Die Vergleichsmessung "vorher" wird am bestehenden Stand erhoben, bevor die Umstellung ausgeliefert wird.

## Out of Scope

- Umschaltung zwischen französischem und internationalem Layout
- Französische Bezeichnungen der Linienwetten
- Ansagewetten und Kesselwetten (Voisins du Zéro, Tiers du Cylindre, Orphelins, Finales, Nachbarn), auch wenn französische Tische dafür oft ein eigenes Feld haben
- La Partage und En Prison
- Getrennte Abrechnung der Dutzende nach Tischseite
- Französische Übersetzung der übrigen Oberfläche
- Doppelseitige Tuch-Darstellung (zwei Tableaus um einen Kessel in der Mitte)
