# Data Model: Französisches Tableau

**Feature**: 003-french-layout | **Date**: 2026-09-27

This is a delta on [002 data-model](../002-line-bets/data-model.md). Only what changes is listed. The **domain semantics stay the same**: the catalogue still has 157 fields with the same ids, ratios and `wins` predicates, the same round state and the same payout arithmetic. On 0 every outside bet still loses in full, with no La Partage and no En Prison.

## 1. BetField (extended)

| Property | Type | Change |
|---|---|---|
| `id` | string | unchanged (`n0..n36`, line ids, `low`, `even`, `red`, `black`, `odd`, `high`, `dozen1..3`, `col1..3`) |
| `label` | string | **changed for 9 outside fields**: French term + German meaning, used in the result list (§ 2) |
| `feltLabel` | string \| undefined | **new, optional**: the tableau text. Set for the 9 outside fields in § 2, undefined for everything else |
| `kind`, `ratio`, `colour`, `number`, `numbers`, `type`, `wins` | — | unchanged |

**Rule**: the tableau shows `feltLabel ?? label`. The result list (`resultFor`) shows `label`. No other consumer reads either property.

## 2. Labels

| id | `feltLabel` | `label` |
|---|---|---|
| `low` | Manque | Manque (1–18) |
| `high` | Passe | Passe (19–36) |
| `even` | Pair | Pair (Gerade) |
| `odd` | Impair | Impair (Ungerade) |
| `red` | Rouge | Rouge (Rot) |
| `black` | Noir | Noir (Schwarz) |
| `dozen1` | P12 | P12 (1. Dutzend) |
| `dozen2` | M12 | M12 (2. Dutzend) |
| `dozen3` | D12 | D12 (3. Dutzend) |
| `col1..col3` | — | 1. / 2. / 3. Kolonne (unchanged) |
| numbers, lines | — | unchanged |

## 3. Tableau position (UI only)

A **position** is one element on the felt. The map `buildTableau` returns (`Map<fieldId, HTMLElement[]>`, from 002) now holds:

| Field kind | Positions | Elements per id (lines off / on) |
|---|---|---|
| number | 1 | 1 / 1 |
| outside, even-money chance | 1 (left **or** right side) | 1 / 1 |
| outside, dozen | **2** (left **and** right side) | **2 / 2** |
| outside, column | 1 (bottom) | 1 / 1 |
| line | zone + list entry | — / 2 |

**Totals**: with lines off there are 49 ids and 52 elements. With lines on there are 157 ids and 52 + 108 + 108 = 268 elements.

**Invariant (FR-004)**: every element of one id always carries the same `data-state`, the same `disabled` and the same tap badge. `render` already guarantees this by iterating the element array (002 § 8). No new state exists.

## 4. Geometry (UI only, pure mapping in `ui/tableau.js`)

Notation: for a number *n* > 0, the row index is *k* = ⌊(n−1)/3⌋ + 1 (1..12), and the column index is *j* = 1, 2, 3 for *n* mod 3 = 1, 2, 0 (the smallest number of each row is on the left).

Side order, top to bottom, index *i* = 0..5:

- left side: `low`, `even`, `red`, `dozen1`, `dozen2`, `dozen3`
- right side: `high`, `odd`, `black`, `dozen1`, `dozen2`, `dozen3`

### 4a. Line bets off (5 columns × 14 rows)

| Item | grid-row | grid-column |
|---|---|---|
| `n0` | 1 | 2 / 5 |
| number *n* | *k* + 1 | *j* + 1 |
| side item *i*, left | (2+2i) / (4+2i) | 1 |
| side item *i*, right | (2+2i) / (4+2i) | 5 |
| `col`*j* | 14 | *j* + 1 |

### 4b. Line bets on (8 columns × 26 rows)

Number column *c(j)* = 2*j* + 1, which gives columns 3, 5 and 7.

| Item | grid-row | grid-column |
|---|---|---|
| `n0` | 1 | 3 / 8 |
| number *n* | 2*k* + 1 | *c(j)* |
| side item *i*, left | (3+4i) / (6+4i) | 1 |
| side item *i*, right | (3+4i) / (6+4i) | 8 |
| `col`*j* | 26 | *c(j)* |
| split *a*/*a*+1 | 2*k(a)* + 1 | *c(j(a))* + 1 |
| split *a*/*a*+3 | 2*k(a)* + 2 | *c(j(a))* |
| split 0/*x* | 2 | *c(j(x))* |
| corner (lowest *a*) | 2*k(a)* + 2 | *c(j(a))* + 1 |
| trio 0-1-2 / 0-2-3 | 2 | 4 / 6 |
| street (lowest *a*) | 2*k(a)* + 1 | 2 |
| sixline (lowest *a*) | 2*k(a)* + 2 | 2 |
| basket 0-1-2-3 | 2 | 2 |

**Invariants** (asserted by the integration test):
- No two elements on `#tableau` occupy the same grid cell. Spans count for every cell they cover.
- Every line zone is adjacent to exactly the numbers it contains. Splits touch 2 number cells by edge, corners 4 by corner, and street and sixline sit on the row edge (spec SC-003).
- Both dozen positions of one id share the same row span.

Worked example (spec US4 AC1): 17 has *k* = 6 and *j* = 2, so it sits at row 13, column 5. Split 16/17 is at (13, 4), 17/18 at (13, 6), 14/17 at (12, 5), 17/20 at (14, 5). The corners are at (12, 4), (12, 6), (14, 4) and (14, 6). Street 16-17-18 is at (13, 2). Sixline 13–18 is at (12, 2) and sixline 16–21 at (14, 2).

## 5. CSS variables (tuning knobs)

| Variable | Default | Touch (`pointer: coarse`, ≤ 1366 px) | Meaning |
|---|---|---|---|
| `--row-min` | 36px | 36px | minimum height of a number/zero/column row (FR-014 as clarified) |
| `--line-track-v` | 24px | 32px | width of the vertical line tracks (E, v12, v23): **now plentiful** |
| `--line-track-h` | 12px | 14px | height of horizontal line tracks: **now scarce** |
| `--tap-min` | 56px | 56px | unchanged; still used for buttons, the list and pick entries |

## 6. Configuration

Unchanged. There is no layout switch (spec FR-013). `lineBets` keeps its meaning: off gives § 4a, on gives § 4b plus the list.
