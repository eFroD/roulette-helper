# Research: Französisches Tableau

**Feature**: 003-french-layout | **Date**: 2026-09-27

Phase 0 decisions. There were no open technical unknowns: stack, tests and deployment are unchanged from 001/002. The decisions below settle the **geometry**, the **labels** and the **height budget** that the vertical layout introduces.

**Standing constraint from the host (2026-09-27)**: only the layout changes. The rules stay exactly as they are: on 0 every outside bet loses in full, and there is no La Partage (half stake back on 0) and no En Prison, although both are common on French tables. No decision below touches `payout.js`, `round.js` or any `wins` predicate.

---

## R-201: One grid for the whole felt

**Decision**: Numbers, outside bets, dozens (both sets), columns and line zones all become items of **one** CSS grid, the `#tableau` container. Every item is placed explicitly by `grid-row` / `grid-column`, in both modes (`lineBets` on and off). The separate `#dozens` and `#outside` rows are removed from the page.

**Rationale**: On the French felt the outside bets flank the number rows, and each one lines up with a specific band of rows (Manque beside 1–6, Pair beside 7–12, and so on). Separate containers cannot keep that vertical alignment when the rows stretch. In one grid, alignment follows from shared row tracks. Explicit placement in both modes also means one pure mapping function describes the whole felt. The integration test can then assert "no two items share a cell" for **every** element, not just zones.

**Alternatives considered**:
- *Three columns of containers (left side, numbers, right side)*: rows would only line up if every container had the same track list, which means duplicating the template three times. Rejected.
- *Auto-flow for the no-lines mode, explicit only with lines (as in 002)*: this gives two geometries to maintain and test. Rejected. Explicit placement is cheap here.

## R-202: Grid tracks

**Decision**: The following track lists apply. `L`/`R` are the outside columns, `E` is the street edge, `c1..c3` are number columns and `v` are line tracks.

Without line bets: 5 columns × 14 rows.

| Column | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Track | L | c1 | c2 | c3 | R |

Rows: 1 = zero · 2..13 = number rows 1–12 · 14 = column bets.

With line bets: 8 columns × 26 rows.

| Column | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Track | L | E (streets, sixlines, basket) | c1 | v12 | c2 | v23 | c3 | R |

Rows: 1 = zero · 2 = h0 (line between 0 and 1-2-3) · number row *k* (1..12) at `2k+1` · line between rows *k* and *k+1* at `2k+2` · 26 = column bets.

The full per-field mapping is in [data-model § 4](./data-model.md).

**Rationale**: This is the transpose of the 002 interleaved grid (R-103). It keeps every property that made that grid safe: each line bet owns exactly one thin cell, zones cannot overlap numbers by construction, and zone size is still two CSS variables. The street edge sits on the **left**, between numbers and the left outside column. That matches the spec assumption "Rand der kleinsten Zahl" and is mirrored in one function if the host's felt differs.

**Alternatives considered**: putting streets on the right edge or on both edges. Mirroring is a one-line change in the placement function, so this is left to the felt check (quickstart step M2).

## R-203: The height budget (spec FR-014, SC-006)

**Decision**: The vertical board is **height-bound**. Rows use `minmax(var(--row-min), 1fr)` with `--row-min: 36px`. The horizontal line tracks are thin (`--line-track-h: 12px`) and the vertical ones wide (`--line-track-v: 24px`), which flips the 002 asymmetry. The selection list moves **beside** the tableau instead of below it (R-205). Fullscreen is the expected mode on 1366×768 with line bets.

**Estimated number-cell size** (fullscreen, topbar about 66 px, stage padding 2 × 14 px):

| Viewport | Line bets | Cell height | Cell width | Area vs. 002 |
|---|---|---|---|---|
| 1366×768 | off | ≈ 44 px | ≈ 190 px | ≈ 2.3× |
| 1366×768 | on | ≈ 37 px | ≈ 160 px | ≈ 1.7× |
| 1920×1080 | on | ≈ 58 px | ≈ 290 px | ≈ 1.7× |
| 1180×820 tablet | off | ≈ 48 px | ≈ 150 px | ≈ 2.2× |
| 1180×820 tablet | on | ≈ 40 px | ≈ 120 px | ≈ 2.1× |

Arithmetic at 1366×768 with lines: 673 px available − 12 horizontal tracks × 12 px = 529 px for 14 rows, about 37.8 px each. The 002 cells were 56 × ≈ 100–200 px, so area is kept or grows everywhere (FR-014 as clarified). The shorter edge stays ≥ 36 px, **except 1366×768 with line bets in a non-fullscreen browser window** (about 31 px). The quickstart measures this, and the README tells the dealer to use ⛶.

**Rationale**: The host chose "no scrolling, lower but wider cells" (clarification 2026-09-27). Height is the only scarce axis. Every pixel saved there goes to the rows: thin horizontal tracks, and no list below the board.

**Alternatives considered**:
- *Keep 56 px and scroll*: rejected by the host.
- *Shorter zero and column rows*: gains too little (about 2 px per number row) and makes the 0 a harder target. Kept equal.
- *Hide the topbar*: rejected, because it holds the status, history and main actions.

## R-204: Labels: felt label vs. result label

**Decision**: Outside fields get a second, optional property `feltLabel` in the catalogue. `label` is still what the result list shows (via `resultFor`), and `feltLabel ?? label` is what the tableau cell shows.

| id | `feltLabel` (tableau) | `label` (result list) |
|---|---|---|
| low | Manque | Manque (1–18) |
| high | Passe | Passe (19–36) |
| even | Pair | Pair (Gerade) |
| odd | Impair | Impair (Ungerade) |
| red | Rouge | Rouge (Rot) |
| black | Noir | Noir (Schwarz) |
| dozen1 | P12 | P12 (1. Dutzend) |
| dozen2 | M12 | M12 (2. Dutzend) |
| dozen3 | D12 | D12 (3. Dutzend) |
| col1..col3 | *(none)* | 1. / 2. / 3. Kolonne *(unchanged)* |

Field **ids stay unchanged** (`low`, `red`, `dozen1`, …). Tests, undo logs and result ordering key on ids, so nothing else moves.

**Rationale**: FR-006 and FR-007 need two different strings for the same field. Labels already live in the catalogue (002 data-model § 3), and a second optional property is the smallest change. The columns are outside FR-006: they sit directly under their column, which disambiguates them (spec edge case), so they keep their German label.

**Alternatives considered**:
- *A label map in `tableau.js`*: this splits naming across two files and lets the felt and result list drift. Rejected.
- *Renaming ids to French*: this touches every test for no user-visible gain. Rejected.

## R-205: Where the selection list goes

**Decision**: With line bets on, `#line-list` sits in a narrow column **to the right of the tableau** inside `.board`. It is a 2-column grid of pick buttons that grows downward and is reserved at full height. The `.board` becomes `grid-template-columns: minmax(0, 1fr) auto` when lines are on.

**Rationale**: Below the board it took 116 px of height, which is exactly the scarce axis now (R-203). At most 11 lines win for any number (17 and similar), so 6 rows × 56 px fit easily beside a 670 px board, and the 56 px pick buttons keep their full size. The list is still built once and only shown or hidden (002 R-104), so the long-press/click fix is unaffected.

**Alternatives considered**: moving the list into the results panel. This mixes "what can I tap" with "what do I pay out" and competes with the compact results (002 R-107). Rejected.

## R-206: One bet, two positions (dozens)

**Decision**: `buildTableau` creates **two** cells per dozen, both with the same `data-field-id`. They are appended to the same `Map<fieldId, HTMLElement[]>` entry that 002 introduced for zone + list entry.

**Rationale**: 002 already made "one field, many elements" the model: render applies one state and one count to every element of a field (FR-020a there, FR-004 here), and the delegated click handler resolves `data-field-id`. Tapping, long-press clearing, locking and the flash animation therefore work for both positions **with no code change** in `render.js` or `main.js` event handling. Results come from `round.stakes`, keyed by id, so each dozen can appear only once (spec US2 AC1).

**Alternatives considered**: separate ids `dozen1L` / `dozen1R` aliased in the domain. This adds the double-count risk the host explicitly ruled out. Rejected.

## R-207: Rouge / Noir marking

**Decision**: The Rouge and Noir cells keep the neutral outside background and show the word, plus a small colour diamond (◆) via CSS keyed on `[data-field-id="red"]` / `[data-field-id="black"]`. No `colour` is set on the outside fields in the domain.

**Rationale**: This matches the felt, where many French tables show the diamond. The word stays readable (spec edge case). Keeping `colour` undefined on outside fields preserves the existing rule that only number cells carry `data-colour`, so the loser styling and contrast rules stay untouched.

## R-208: Portrait and small screens

**Decision**: The existing `@media (max-aspect-ratio: 1/1)` rule (stage stacks, panel below) stays. There is no special portrait work.

**Rationale**: The vertical felt is naturally portrait-friendly, and portrait is not a target device in any spec. The rule only has to keep working, and quickstart step M5 checks it once.

---

## Summary of decisions

| # | Decision | Touches |
|---|---|---|
| R-201 | One explicit-placement grid for the whole felt; `#dozens` / `#outside` removed | index.html, tableau.js, main.js, style.css |
| R-202 | Transposed track lists (5×14 / 8×26); streets on the left edge | tableau.js, style.css |
| R-203 | Height-bound rows ≥ 36 px, thin horizontal line tracks, fullscreen on 1366×768 | style.css, README |
| R-204 | `feltLabel` (tableau) vs. `label` (results), ids unchanged | wheel.js |
| R-205 | Line list beside the tableau | index.html, style.css |
| R-206 | Dozens: two cells, one id, one map entry | tableau.js only |
| R-207 | Rouge/Noir with a CSS colour diamond, no domain colour | style.css |
| R-208 | Portrait rule unchanged | — |

**Not touched**: `round.js`, `payout.js`, `config.js`, `history.js`, `render.js` field logic, every `wins` predicate, every ratio. Rules stay as they are (no La Partage, no En Prison).
