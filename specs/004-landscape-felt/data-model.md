# Data Model: Französisches Tableau quer

**Feature**: 004-landscape-felt | **Date**: 2026-09-27

This is a delta on [003 data-model](../003-french-layout/data-model.md). Bet fields, labels, winning sets, round state and payout are **unchanged**.

## 1. Configuration (extended)

| Key | Type | Default | Valid | Normalise | On invalid |
|---|---|---|---|---|---|
| `orientation` | string | `"horizontal"` | `"horizontal"`, `"vertical"` | trim + lower-case | warning naming the key and both values; `"horizontal"` is used |

Absent means the default applies, silently. The other keys are unchanged.

The in-app settings dialog rebuilds the config from `{ ...config, stakes }`, so `orientation` survives it untouched.

## 2. Tableau position (UI only)

These are unchanged from 003 § 3: 49 ids / 52 elements with lines off, 157 / 268 with lines on, and dozens twice. **The counts are identical in both orientations.** Orientation changes only where each element is placed.

## 3. Geometry

### 3a. Vertical

Exactly [003 data-model § 4](../003-french-layout/data-model.md). The grid is `N` columns × `M` rows, with N = 5 and M = 14 without lines, and N = 8 and M = 26 with lines.

### 3b. Horizontal = vertical rotated a quarter turn counter-clockwise

For a vertical placement `(row R, column C)`, the landscape placement is:

| Vertical | Landscape |
|---|---|
| row `R` or span `"a / b"` | **column** `R` or span `"a / b"`, unchanged |
| column `C` | **row** `N + 1 − C` |
| column span `"a / b"` | **rows** `"(N+2−b) / (N+2−a)"` |

The landscape grid is `M` columns × `N` rows: 14 × 5 without lines and 26 × 8 with lines.

**Reference placements, lines off** (landscape `row | column`):

| Item | Landscape |
|---|---|
| `n0` | `2 / 5` \| `1` |
| `n1` / `n2` / `n3` | `4` / `3` / `2` \| `2` |
| `n34` / `n36` | `4` / `2` \| `13` |
| Passe (`high`) | `1` \| `2 / 4` |
| Manque (`low`) | `5` \| `2 / 4` |
| `dozen3` (both) | `5` \| `12 / 14` and `1` \| `12 / 14` |
| `col1` / `col3` | `4` / `2` \| `14` |

**Reference placements, lines on** (worked example around 17; vertical 17 is at `13|5`, N = 8):

| Item | Vertical | Landscape |
|---|---|---|
| `n17` | 13 \| 5 | 4 \| 13 |
| split 16/17 | 13 \| 4 | 5 \| 13 |
| split 17/18 | 13 \| 6 | 3 \| 13 |
| split 14/17 | 12 \| 5 | 4 \| 12 |
| split 17/20 | 14 \| 5 | 4 \| 14 |
| street 16-17-18 | 13 \| 2 | 7 \| 13 |
| sixline 13–18 | 12 \| 2 | 7 \| 12 |
| basket | 2 \| 2 | 7 \| 2 |
| trio 0-1-2 | 2 \| 4 | 5 \| 2 |
| split 0/3 | 2 \| 7 | 2 \| 2 |
| `n0` | 1 \| `3 / 8` | `2 / 7` \| 1 |

Landscape rows with lines: 1 top bar (Passe …), 2 row 3-6-9…, 3 line, 4 row 2-5-8…, 5 line, 6 row 1-4-7…, 7 street edge, 8 bottom bar (Manque …).

**Invariants** hold in both orientations and are asserted for both:
- no two elements share a grid cell
- every split, corner and trio has exactly its numbers in the 8-neighbourhood
- every street and sixline sits on the street edge beside exactly its numbers

## 4. CSS variables

| Variable | Default | Touch | Meaning (both orientations) |
|---|---|---|---|
| `--line-track-street` | 12px | 14px | the line between two streets (renamed from `--line-track-h`) |
| `--line-track-inner` | 24px | 32px | the lines within a street and the street edge (renamed from `--line-track-v`) |
| `--row-min` | 36px | 36px | minimum number-row height in vertical (003) |
| `--tap-min` | 56px | 56px | minimum bar height in horizontal; buttons, list entries |
