# Feature Specification: Französisches Tableau quer

**Feature Branch**: `003-french-layout` (shared with 003)

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "der laptop ist eher ein widescreen, wir brauchen eine konfig möglichkeit bei der wir das roulette feld doch quer einstellen können"

## Overview

Seit Feature 003 zeigt die App das französische Tableau **senkrecht**, so wie der Dealer das Tuch vor sich liegen sieht: die 0 oben, zwölf Reihen à drei Zahlen, die Außenwetten links und rechts. Auf dem Einsatzgerät — einem Laptop mit Breitbildschirm — ist das die ungünstige Richtung: Das Tableau ist hoch und schmal, der Bildschirm breit und niedrig. Die Zahlenfelder werden dadurch sehr flach (etwa 37 Bildpunkte hoch bei eingeschalteten Linienwetten), passen nur im Vollbild ohne Scrollen, und ein großer Teil der Bildschirmbreite bleibt ungenutzt.

Dieses Feature macht die **Ausrichtung einstellbar**. Der Gastgeber legt in der Konfiguration fest, ob das Tableau **senkrecht** (wie bisher) oder **quer** dargestellt wird. Quer bedeutet: dasselbe französische Tuch, um eine Vierteldrehung gedreht — die 0 links, die zwölf Dreierreihen als Spalten nebeneinander, die einfachen Chancen und Dutzende als Leisten oberhalb und unterhalb des Zahlenfelds, die Kolonnen rechts. Es bleibt ein französisches Tableau mit französischer Beschriftung und doppelten Dutzenden; es ist **nicht** die Rückkehr zum internationalen Layout vor Feature 003.

Die Querdarstellung ist die **Vorgabe**; die senkrechte bleibt als Einstellung erhalten.

**Nur die Darstellung ändert sich**: Spielregeln, Quoten, Null-Regel (bei 0 verlieren alle Außenwetten vollständig, kein La Partage, kein En Prison), Einsatzerfassung, Ergebnisberechnung, Beschriftungen und Linienwetten bleiben inhaltlich unverändert. Jede Wette ist in beiden Ausrichtungen dieselbe Wette mit demselben Ergebnis.

## Clarifications

### Session 2026-09-27

- Q: Welche Ausrichtung gilt ohne Einstellung? → A: Quer. Die senkrechte Darstellung aus Feature 003 muss ausdrücklich eingestellt werden; ungültige Werte fallen ebenfalls auf quer zurück.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tableau quer auf dem Breitbildschirm (Priority: P1)

Der Gastgeber stellt in der Konfiguration die Ausrichtung "quer" ein und lädt die App neu. Das französische Tableau liegt nun quer über die Bildschirmbreite: links die 0, daneben zwölf Spalten mit je drei Zahlen (unten die kleinste, oben die größte Zahl jeder Dreiergruppe), oberhalb des Zahlenfelds die Leiste Passe, Impair, Noir, P12, M12, D12, unterhalb die Leiste Manque, Pair, Rouge, P12, M12, D12, rechts die drei Kolonnen. Die Felder sind deutlich höher als in der senkrechten Darstellung, und das ganze Tableau passt ohne Vollbild und ohne Scrollen auf den Bildschirm.

**Why this priority**: Das ist der Kern der Anfrage. Ohne die Querdarstellung wird der Breitbildschirm schlecht genutzt und die Zahlenfelder bleiben unnötig flach.

**Independent Test**: Ausrichtung auf "quer" stellen, App neu laden und das Tableau gegen die hier beschriebene Anordnung prüfen; eine Gewinnzahl eingeben und prüfen, dass dieselben Felder gewinnen wie in der senkrechten Darstellung.

**Acceptance Scenarios**:

1. **Given** die Ausrichtung ist "quer", **When** die App geladen ist, **Then** steht die 0 links über die volle Höhe der drei Zahlenzeilen, rechts daneben folgen zwölf Spalten 1-2-3, 4-5-6 … 34-35-36, wobei in jeder Spalte die kleinste Zahl unten und die größte oben steht.
2. **Given** die Ausrichtung ist "quer", **When** der Dealer die Außenwetten betrachtet, **Then** steht oberhalb des Zahlenfelds von links nach rechts Passe, Impair, Noir, P12, M12, D12 und unterhalb Manque, Pair, Rouge, P12, M12, D12; jede Außenwette erstreckt sich über genau die zwei Zahlenspalten, neben denen sie im senkrechten Tableau steht; die drei Kolonnen stehen rechts, jede auf Höhe der Zeile, deren Zahlen sie gewinnen lässt.
3. **Given** die Ausrichtung ist "quer", **When** der Dealer die 17 antippt, **Then** werden genau dieselben Felder als Gewinner markiert wie in der senkrechten Darstellung, einschließlich beider M12-Positionen.
4. **Given** die Ausrichtung ist "quer" auf einem Laptop mit 1366×768 Bildpunkten im normalen Browserfenster (nicht Vollbild), **When** die App geladen ist, **Then** ist das gesamte Tableau ohne Scrollen sichtbar.

---

### User Story 2 - Linienwetten im queren Tableau (Priority: P2)

Bei eingeschalteten Linienwetten liegen die Trefferzonen im queren Tableau wieder auf den Linien zwischen den Zahlen — an denselben Zahlengrenzen wie im senkrechten Tableau, nur um eine Vierteldrehung gedreht. Die Auswahlliste der gewinnenden Linien bleibt als zweiter Weg erhalten.

**Why this priority**: Die Linienwetten sind in Gebrauch. Ohne sie wäre die Querdarstellung nur mit abgeschalteten Linienwetten nutzbar.

**Independent Test**: Ausrichtung "quer", Linienwetten an, Gewinnzahl 17 eingeben und prüfen, dass jede aktive Zone genau zwischen den Zahlen liegt, die sie umfasst, und die Liste dieselben elf Linien zeigt.

**Acceptance Scenarios**:

1. **Given** Ausrichtung "quer", Linienwetten an und Gewinnzahl 17, **When** der Dealer das Tableau betrachtet, **Then** sind genau die elf Linienpositionen des Features 002 aktiv, und jede liegt zwischen ihren Zahlen: die Splits 16/17 und 17/18 auf den waagerechten Linien unter und über der 17, die Splits 14/17 und 17/20 auf den senkrechten Linien links und rechts davon, die Corners auf den Kreuzungspunkten um die 17.
2. **Given** Ausrichtung "quer" und Linienwetten an, **When** der Dealer Street 16-17-18 und Sixline 13–18 sucht, **Then** liegt die Street am unteren Rand der Spalte 16-17-18 (zwischen Zahlenfeld und unterer Außenwettleiste) und die Sixline am selben Rand auf der Linie zwischen den Spalten 13-14-15 und 16-17-18.
3. **Given** Ausrichtung "quer" und Linienwetten an, **When** der Dealer die Wetten an der 0 sucht, **Then** liegen die Splits 0/1, 0/2, 0/3 und die Trios auf der Linie zwischen 0 und der Spalte 1-2-3, und 0-1-2-3 am unteren Ende dieser Linie.
4. **Given** Ausrichtung "quer" und Linienwetten an, **When** eine Gewinnzahl eingegeben ist, **Then** zeigt die Auswahlliste dieselben Einträge wie in der senkrechten Darstellung, und Zone und Listeneintrag derselben Linie zeigen stets denselben Zustand.

---

### User Story 3 - Ausrichtung sicher einstellen (Priority: P2)

Der Gastgeber stellt die Ausrichtung an derselben Stelle ein wie die übrigen Grundeinstellungen der App (Grundeinsätze, Währungssymbol, Linienwetten). Ohne Einstellung erscheint das Tableau quer, weil der Breitbildschirm-Laptop das Einsatzgerät ist. Vertippt er sich, bleibt die App benutzbar: Sie fällt auf die Querdarstellung zurück und weist sichtbar auf den ungültigen Wert hin, so wie bei den anderen Einstellungen.

**Why this priority**: Ohne verlässliche Einstellmöglichkeit gibt es die Querdarstellung nicht; ein Tippfehler darf die App am Partyabend nicht unbenutzbar machen.

**Independent Test**: Die Einstellung nacheinander auf "quer", "senkrecht", einen ungültigen Wert und "weggelassen" setzen und jeweils das Ergebnis prüfen.

**Acceptance Scenarios**:

1. **Given** die Einstellung fehlt ganz, **When** die App geladen wird, **Then** erscheint das Tableau quer, ohne Hinweis.
2. **Given** die Einstellung ist "senkrecht", **When** die App geladen wird, **Then** ist die Darstellung identisch mit Feature 003.
3. **Given** die Einstellung hat einen ungültigen Wert, **When** die App geladen wird, **Then** erscheint das Tableau quer und die App zeigt einen Hinweis, der die Einstellung und die gültigen Werte nennt; alle anderen gültigen Einstellungen wirken unverändert.
4. **Given** eine laufende Runde, **When** der Gastgeber die Einstellung ändert und die App neu lädt, **Then** gilt die neue Ausrichtung; die Runde ist wie bei jedem Neuladen verworfen.

---

### Edge Cases

- **Querdarstellung auf dem Tablet**: Die Ausrichtung gilt für jedes Gerät, das die App mit dieser Konfiguration lädt. Auf einem Tablet im Querformat ist die Querdarstellung bei eingeschalteten Linienwetten schmaler; die Auswahlliste bleibt dort der vorgesehene Weg für Linienwetten (wie in Feature 002).
- **Hochformat-Fenster mit Einstellung "quer"**: Wird die App in einem hohen, schmalen Fenster geöffnet, bleibt die eingestellte Ausrichtung bestehen. Die App schaltet nicht selbstständig um; die Ergebnisanzeige rückt wie bisher unter das Tableau.
- **Doppelte Dutzende**: In beiden Leisten erscheinen P12, M12, D12; wie in Feature 003 sind beide Positionen derselbe Wettposten mit gemeinsamem Zustand, gemeinsamem Zähler und einem einzigen Eintrag in der Ergebnisliste.
- **Kolonnen rechts**: Jede Kolonne steht auf Höhe ihrer Zeile — die Kolonne mit 1, 4, 7 … unten, die mit 3, 6, 9 … oben —, damit die Zuordnung ohne Beschriftung erkennbar bleibt.
- **Abgleich mit dem Tuch**: Stellt der Gastgeber beim Abgleich mit dem Tuch in Feature 003 eine gespiegelte Seitenzuordnung fest, gilt die Korrektur für beide Ausrichtungen gleichermaßen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUSS eine Einstellung für die Ausrichtung des Tableaus mit genau zwei gültigen Werten anbieten: senkrecht und quer.
- **FR-002**: Die Einstellung MUSS an derselben Stelle vorgenommen werden wie die übrigen Grundeinstellungen des Gastgebers und MUSS nach einem Neuladen der App wirksam werden.
- **FR-003**: Fehlt die Einstellung, MUSS das System das Tableau quer darstellen (Vorgabewert, Entscheidung 2026-09-27).
- **FR-004**: Bei einem ungültigen Wert MUSS das System das Tableau quer darstellen und einen sichtbaren Hinweis zeigen, der die Einstellung und die gültigen Werte nennt; andere gültige Einstellungen bleiben davon unberührt.
- **FR-005**: In der Ausrichtung quer MUSS das System die 0 links über die volle Höhe der drei Zahlenzeilen darstellen und rechts daneben zwölf Spalten zu je drei Zahlen (1-2-3 … 34-35-36), in jeder Spalte die kleinste Zahl unten.
- **FR-006**: In der Ausrichtung quer MUSS das System oberhalb des Zahlenfelds von links nach rechts Passe, Impair, Noir, P12, M12, D12 und unterhalb Manque, Pair, Rouge, P12, M12, D12 darstellen, jede über genau die zwei Zahlenspalten, denen sie im senkrechten Tableau zugeordnet ist.
- **FR-007**: In der Ausrichtung quer MUSS das System die drei Kolonnen rechts neben dem Zahlenfeld darstellen, jede auf Höhe der Zeile, deren Zahlen sie gewinnen lässt.
- **FR-008**: In der Ausrichtung quer MUSS bei eingeschalteten Linienwetten jede Linienzone zwischen genau den Zahlen liegen, die sie umfasst: Splits auf der gemeinsamen Kante zweier Zahlen, Corners auf dem gemeinsamen Eckpunkt von vier Zahlen, Streets und Sixlines am unteren Rand des Zahlenfelds, die Splits und Trios an der 0 auf der Linie zwischen 0 und der Spalte 1-2-3 und 0-1-2-3 an deren unterem Ende.
- **FR-009**: Beschriftungen (französisch auf dem Tableau, französisch mit deutscher Bedeutung in der Ergebnisliste), Farben, doppelte Dutzende als ein Wettposten, Zustandsdarstellung und Bedienung (Tippen, langer Druck, Sperre verlorener Felder, Auswahlliste der Linien) MÜSSEN in beiden Ausrichtungen gleich funktionieren.
- **FR-010**: Das System MUSS für jede Gewinnzahl in beiden Ausrichtungen exakt dieselben Gewinnerfelder, Quoten und Beträge liefern wie vor diesem Feature; die Spielregeln bleiben unverändert, einschließlich der Null-Regel ohne La Partage und En Prison.
- **FR-011**: Die Ausrichtung senkrecht MUSS in Anordnung und Verhalten unverändert gegenüber Feature 003 bleiben.
- **FR-012**: In der Ausrichtung quer MÜSSEN Zahlen- und Außenwettfelder mindestens so viel Tippfläche bieten wie in der senkrechten Darstellung auf demselben Bildschirm, und ihre kürzere Kante DARF 36 Bildpunkte nicht unterschreiten.

### Key Entities

- **Ausrichtung**: Grundeinstellung des Gastgebers mit den Werten quer (Vorgabe) und senkrecht. Wirkt auf die Anordnung aller Tableau-Positionen, nicht auf Wettposten, Beschriftungen oder Regeln.
- **Tableau-Position**: wie in Feature 003 — eine antippbare Stelle, die genau einem Wettposten zugeordnet ist. Jede Position hat in beiden Ausrichtungen eine Stelle; die Zuordnung zum Wettposten ist in beiden gleich.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Auf einem Laptop mit 1366×768 Bildpunkten ist das quere Tableau im normalen Browserfenster ohne Scrollen vollständig sichtbar — mit und ohne Linienwetten.
- **SC-002**: Auf demselben Laptop sind die Zahlenfelder in der Querdarstellung mindestens 50 % höher als in der senkrechten Darstellung bei gleicher Einstellung der Linienwetten (Messbasis Feature 003: 37 Bildpunkte mit, 44 ohne Linienwetten im Vollbild).
- **SC-003**: Für jede der 37 möglichen Gewinnzahlen ist die Menge der markierten Gewinnerfelder in beiden Ausrichtungen identisch mit der vor diesem Feature — null Abweichungen; alle Referenzfälle der Features 001 und 002 liefern unverändert ihre Beträge.
- **SC-004**: Bei eingeschalteten Linienwetten liegt in der Querdarstellung jede der 108 Linienzonen zwischen genau den Zahlen, die sie umfasst — null falsch platzierte Zonen.
- **SC-005**: Ein Wechsel der Ausrichtung erfordert genau eine Änderung an einer Stelle und ein Neuladen; ein ungültiger Wert führt in 100 % der Fälle zur Querdarstellung mit sichtbarem Hinweis statt zu einer unbenutzbaren App.
- **SC-006**: Mit der Einstellung senkrecht ist die Darstellung auf allen in Feature 003 gemessenen Bildschirmgrößen unverändert.

## Assumptions

- **Quer heißt: das französische Tuch gedreht, nicht das alte Layout**: Die Querdarstellung ist das senkrechte Tableau aus Feature 003 um eine Vierteldrehung gegen den Uhrzeigersinn gedreht. Dadurch landet die 0 links, die Zahlen 1, 4, 7 … in der unteren Zeile (wie beim früheren internationalen Layout), Passe/Impair/Noir oben, Manque/Pair/Rouge unten und die Kolonnen rechts. Beschriftungen und doppelte Dutzende bleiben französisch.
- **Streets am unteren Rand**: Die Drehung bringt den linken Rand des senkrechten Tableaus (Seite der kleinsten Zahl, dort liegen Streets und Sixlines) nach unten. Eine Spiegelung nach dem Abgleich mit dem Tuch (Feature 003, Aufgabe T033) gilt für beide Ausrichtungen.
- **Vorgabe ist quer**: Ohne Einstellung und bei ungültigem Wert erscheint das Tableau quer, weil der Breitbildschirm-Laptop das Einsatzgerät ist (Entscheidung des Gastgebers, 2026-09-27). Wer das senkrechte Tableau aus Feature 003 will, stellt es ausdrücklich ein.
- **Keine Umschaltung in der laufenden App**: Die Ausrichtung ist eine Grundeinstellung des Gastgebers wie die Linienwetten, keine Bedienfunktion für den Dealer. Ein Schalter im Einstellungsdialog oder eine automatische Wahl nach Bildschirmform ist nicht vorgesehen.
- **Ergebnisbereich unverändert**: Die Ergebnisanzeige bleibt rechts neben dem Tableau. Wo die Auswahlliste der Linien in der Querdarstellung liegt, entscheidet die Planung nach Platz; sie muss bei 1366×768 ohne Scrollen alle Gewinnerlinien einer Zahl (höchstens elf) zeigen können.
- **Messgrundlage**: Die Vergleichswerte für SC-002 stammen aus den Messungen von Feature 003 (quickstart, 2026-09-27).

## Out of Scope

- Rückkehr zum internationalen Layout vor Feature 003 (deutsche Beschriftung, einfache Dutzende)
- Automatische Wahl der Ausrichtung nach Bildschirmform oder Drehung des Geräts
- Umschalten der Ausrichtung im laufenden Betrieb über den Einstellungsdialog
- Drehung um 180° oder eine gespiegelte Querdarstellung mit der 0 rechts
- Jede Änderung an Regeln, Quoten oder Einsatzlogik, einschließlich La Partage und En Prison
