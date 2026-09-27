# Research: Französisches Tableau quer

**Feature**: 004-landscape-felt | **Date**: 2026-09-27

Phase 0 decisions. There were no open technical unknowns, because the stack, tests and deployment are unchanged from 001–003. The decisions below settle the config key, the geometry and the size budget for the landscape felt.

**Standing constraints**:
- **Default**: horizontal is the default (host, 2026-09-27).
- **Rules**: they stay as they are. No La Partage and no En Prison. No change to `round.js`, `payout.js`, any `wins` predicate or any ratio.

---

## R-301: The config key

**Decision**: Add `orientation` to `DEFAULT_CONFIG` and `RULES` in `public/js/domain/config.js`.

- Valid values are the strings `"horizontal"` and `"vertical"`. Surrounding whitespace and case are normalised, so `" Horizontal "` becomes `"horizontal"`.
- The default is `"horizontal"`.
- Anything else produces the existing per-key warning and falls back to `"horizontal"`, while other keys keep their values.
- The shipped `public/config.js` lists `orientation: "horizontal"` with a German comment, just as it lists `lineBets`.

**Rationale**: This matches the existing pattern exactly: one pure resolver, per-key fallback and a visible warning (spec FR-002, FR-004). The keys in `config.js` are English and the comments German, so the key follows suit. The German spec terms map as "quer" → `horizontal` and "senkrecht" → `vertical`. Lenient case and whitespace handling costs one `normalise` function. Unlike `lineBets`, where the string `"false"` is a dangerous near-miss, there is no ambiguous near-miss here.

**Alternatives considered**:
- *German values `"quer"` / `"senkrecht"`*: they read naturally for the host, but they would be the only German values in a file of English keys. Rejected. The comment in `config.js` names both meanings.
- *A boolean `horizontal: true`*: it reads badly as "false = vertical" and leaves no room for a third value. Rejected.
- *A runtime toggle in the settings dialog*: out of scope (spec Assumptions).

## R-302: The landscape geometry is a rotation, not a second layout

**Decision**: Landscape placements are computed by **rotating the 003 vertical placements a quarter turn counter-clockwise**. One pure function `rotate(placement, verticalColumnCount)` maps the vertical coordinates to landscape ones:

- vertical row span → landscape column span, unchanged (`"a / b"` stays `"a / b"`)
- vertical column `c` → landscape row `N + 1 − c`
- vertical column span `"a / b"` (end-exclusive) → landscape rows `"(N+2−b) / (N+2−a)"`

Here `N` is the vertical column count: 5 without lines, 8 with lines. `numberGridPlacement`, `sideGridPlacements` and `lineGridPlacement` take an `orientation` option. They compute the vertical placement as today and rotate it when `orientation === "horizontal"`.

**Rationale**:
- A rotation preserves adjacency and "no two items in one cell". So every invariant the 003 tests prove for the vertical felt carries over to landscape by construction.
- Spec FR-006, FR-008 and the "Abgleich mit dem Tuch" edge case (a side swap applies to both orientations) all fall out for free.
- There is **one** geometry to maintain, and the only new logic is a 5-line pure function.

Checked by hand (lines off, N = 5):

| Item | vertical (row, col) | landscape (row, col) | Meaning |
|---|---|---|---|
| `n0` | 1, `2 / 5` | `2 / 5`, 1 | 0 on the left, spanning the three number rows |
| `n1` | 2, 2 | 4, 2 | 1 at the bottom of the first column |
| `n3` | 2, 4 | 2, 2 | 3 at the top |
| left side (Manque …) | …, 1 | 5, … | bottom bar |
| right side (Passe …) | …, 5 | 1, … | top bar |
| `col1` | 14, 2 | 4, 14 | right end, level with 1-4-7 |

With lines (N = 8), the street edge (vertical column 2) becomes landscape row 7: streets sit between the number field and the bottom bar (spec US2 AC2). The h0 row becomes landscape column 2, the line between 0 and 1-2-3.

**Alternatives considered**:
- *A second hand-written placement table*: this doubles the geometry and the risk of a phantom zone, and it is exactly what 002 R-103 avoided by generating. Rejected.
- *CSS `transform: rotate(-90deg)` on the board*: text would be rotated, hit-testing and sizing inside a rotated box are awkward, and the grid would not use the screen. Rejected.
- *Clockwise rotation*: puts the 0 on the right and 1 at the top. Out of scope (spec).

## R-303: Grid tracks and the width budget

**Decision**: The following track lists apply in landscape.

| Mode | Columns | Rows |
|---|---|---|
| lines off | zero, 12 numbers, column bets (14) | top bar, 3 number rows, bottom bar (5) |
| lines on | zero, h0, 11 × (number, line), number 12, column bets (26) | top bar, row 3-6-9…, line, row 2-5-8…, line, row 1-4-7…, street edge, bottom bar (8) |

With lines on:
- The line tracks **between streets** (landscape columns) are the scarce axis. They use the thin track.
- The tracks **within a street** and the street edge (landscape rows) have plenty of height. They use the wide track.

The two variables are renamed by what they separate rather than by screen axis, so that each value means the same thing in both orientations:

| New name | Old name | Default | Touch | Separates |
|---|---|---|---|---|
| `--line-track-street` | `--line-track-h` | 12px | 14px | two streets (the thin one in both orientations) |
| `--line-track-inner` | `--line-track-v` | 24px | 32px | numbers within a street, and the street edge |

Estimated at 1366×698 (a **normal browser window**, not fullscreen), with the panel at `minmax(280px, 20rem)`:

| Lines | Number cell (w × h) | vs. vertical 003 (153 × 37) |
|---|---|---|
| on | ≈ 61 × 100 px | height +170 %, area +8 % |
| off | ≈ 70 × 160 px | height +260 % vs. 44 px |

Width with lines on: about 1000 px of board, minus zero and column bets (about 60 px each), minus 11 × 12 px of street tracks and 24 px for h0, leaves about 730 px for 12 columns, so about 61 px per column. Height: 610 px minus 2 bars × 56 px, minus 2 × 24 px + 24 px for the inner and edge tracks, minus 120 px for the list below, leaves about 306 px for 3 rows, so about 100 px per row. SC-001 (no scroll in a normal window) and SC-002 (≥ +50 % height) both hold with margin. FR-012 holds too: the shorter edge is ≥ 36 px and the area is ≥ the vertical area.

**Rationale**: This is the same asymmetry argument as 002 R-103 and 003 R-203, applied to the axis that is scarce here. The bars use `minmax(var(--tap-min), 0.5fr)`, so the outside bets keep today's 56 px touch height.

## R-304: Where the line list goes

**Decision**: In landscape the list goes back **below** the board, as in 002: 6 columns, auto rows of `--tap-min`, reserved for two rows. The side-by-side placement from 003 R-205 applies only to vertical.

**Rationale**: Height is plentiful in landscape and width is scarce, the reverse of 003. At most 11 lines win for any number, which fits in 2 rows of 6. The list is still built once and only shown or hidden (002 R-104).

## R-305: How orientation reaches the page

**Decision**:
- `buildTableau(containers, { lineBets, orientation })` adds class `horizontal` or `vertical` to `#tableau` and places every element via the rotated helpers.
- `main.js` toggles the same class on `.stage`. CSS keys the track templates and the list placement on `.tableau.horizontal` / `.tableau.vertical` and `.stage.horizontal` / `.stage.vertical`.
- When `orientation` is omitted, `buildTableau` uses `DEFAULT_CONFIG.orientation` imported from `domain/config.js`, so there is one source for the default.

**Rationale**: This is the same mechanism as `lineBets` / `.lines` from 002. Importing the default keeps UI and config from drifting apart. The 003 tests that assert vertical placements now pass `orientation: "vertical"` explicitly.

## R-306: Tests

**Decision**:
- Unit-test `rotate` directly: the hand-checked table in R-302, plus an involution check that four rotations of a square test grid return the start.
- Parametrise the 003 structural tests over both orientations:
  - element counts
  - no shared cell
  - line adjacency, rewritten to "neighbours in the 8-neighbourhood", which is rotation-invariant
- The street and sixline checks read the edge **via the rotation**, not by fixed column numbers.
- Add literal landscape placements for `n0`, `n1`, `n3`, `n36`, both bars, the columns and the worked example around 17.
- The config tests cover the default, both values, normalisation, and invalid values (`"quer"`, `true`, `""`) falling back with a warning.

**Rationale**: Rotation-invariant assertions prove SC-004 for landscape, and the literal placements guard against a correct-but-mirrored rotation, such as clockwise.

---

## Summary of decisions

| # | Decision | Touches |
|---|---|---|
| R-301 | `orientation: "horizontal" \| "vertical"`, default horizontal, normalised, per-key fallback | domain/config.js, public/config.js |
| R-302 | Landscape = vertical placement rotated CCW by one pure function | ui/tableau.js |
| R-303 | 14×5 / 26×8 tracks; line-track variables renamed street/inner | style.css |
| R-304 | Line list below the board in landscape | style.css |
| R-305 | `orientation` option and classes on tableau and stage; default from DEFAULT_CONFIG | ui/tableau.js, main.js, style.css |
| R-306 | Rotation unit tests; structural tests over both orientations; config tests | tests/ |

**Not touched**: `round.js`, `payout.js`, `render.js`, `wheel.js`, `history.js`, every `wins` predicate and ratio.
