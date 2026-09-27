---

description: "Task list for Französisches Tableau"
---

# Tasks: Französisches Tableau

**Input**: Design documents from `specs/003-french-layout/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: INCLUDED. As in 002, `node --test` is part of the definition of done, and SC-002 / SC-003 are automated checks (quickstart § A). Within each story, test tasks come first and must fail before the implementation tasks start.

**Rules stay untouched**: This feature changes layout and labels only. Do **not** edit `public/js/domain/round.js`, `public/js/domain/payout.js`, `public/js/domain/config.js`, any `wins` predicate or any `ratio`. No La Partage and no En Prison (spec FR-015). `tests/reference-scenarios.test.js` must pass **unmodified**.

**Organization**: Tasks are grouped by user story, in the priority order from spec.md (US1 P1, then US2 and US4 at P2, then US3 at P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 … US4, mapping to spec.md user stories
- Paths are relative to the repo root.

## Grid reference (used by T008–T015)

The source is [data-model § 4](./data-model.md). For a number `n > 0`:

- `k = Math.floor((n - 1) / 3) + 1` (row 1–12)
- `j = {1: 1, 2: 2, 0: 3}[n % 3]` (column 1–3, smallest number on the left)

Side lists, index `i` = 0..5 from top to bottom:

```text
LEFT  = ["low",  "even", "red",   "dozen1", "dozen2", "dozen3"]
RIGHT = ["high", "odd",  "black", "dozen1", "dozen2", "dozen3"]
```

**Lines off**: 5 columns (`L c1 c2 c3 R`) × 14 rows (zero, 12 number rows, columns row).

| Item | grid-row | grid-column |
|---|---|---|
| `n0` | `1` | `2 / 5` |
| n | `k+1` | `j+1` |
| LEFT[i] | `${2+2i} / ${4+2i}` | `1` |
| RIGHT[i] | `${2+2i} / ${4+2i}` | `5` |
| `colJ` | `14` | `J+1` |

**Lines on**: 8 columns (`L E c1 v12 c2 v23 c3 R`) × 26 rows. Number column `c(j) = 2j+1`.

| Item | grid-row | grid-column |
|---|---|---|
| `n0` | `1` | `3 / 8` |
| n | `2k+1` | `c(j)` |
| LEFT[i] | `${3+4i} / ${6+4i}` | `1` |
| RIGHT[i] | `${3+4i} / ${6+4i}` | `8` |
| `colJ` | `26` | `c(J)` |
| split `{a, a+1}` | `2k(a)+1` | `c(j(a))+1` |
| split `{a, a+3}` | `2k(a)+2` | `c(j(a))` |
| split `{0, x}` | `2` | `c(j(x))` |
| corner, lowest `a` | `2k(a)+2` | `c(j(a))+1` |
| trio `0-1-2` / `0-2-3` | `2` | `4` / `6` |
| street, lowest `a` | `2k(a)+1` | `2` |
| sixline, lowest `a` | `2k(a)+2` | `2` |
| basket | `2` | `2` |

All values are **strings** as assigned to `style.gridRow` / `style.gridColumn`. A single number `5` is written `"5"`, not `"5 / 6"`.

---

## Phase 1: Setup

**Purpose**: Put the feature on its own branch and secure the baselines before any code changes.

- [X] T001 Create and switch to git branch `003-french-layout` from the current `002-line-bets` HEAD (repo root). Confirm that `.specify/feature.json` contains `"feature_directory": "specs/003-french-layout"`, then commit the `specs/003-french-layout/` documents. *(Branch created; the commit is left to the host, as for 001/002: one commit per feature.)*
- [X] T002 Run `node --test` at the repo root and confirm the baseline of **100 passing, 0 failing**. Stop and report if it differs.
- [ ] T003 [P] Record the SC-004 speed baseline on the **unchanged** build, following specs/003-french-layout/quickstart.md § D step 1: 2 people × 20 called fields, mean time from call to correct tap. Write the result into quickstart § D. This is a manual step and must happen before the new layout is deployed (spec Assumption "Messbasis für SC-004"). If it cannot be done now, note that in the quickstart and continue.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Lock the rules in place with a snapshot, and give the outside fields their French labels. Every story depends on this.

**⚠️ CRITICAL**: No user-story work starts until `node --test` is green at the end of this phase.

- [X] T004 In tests/wheel.test.js, add a test "winning sets for 0–36 are unchanged by the French layout (SC-002, FR-015)". It compares `winningFieldIds(n)` for every n from 0 to 36 with a literal snapshot object. Generate the snapshot **before** touching wheel.js by running `node -e 'import("./public/js/domain/wheel.js").then(w=>{const o={};for(let n=0;n<=36;n++)o[n]=w.winningFieldIds(n);console.log(JSON.stringify(o))})'` and paste the output as a `const SNAPSHOT = …` in the test file. Also assert that for n = 0, every `kind === "outside"` field has `wins(0) === false`. The test must pass immediately. It is a guard, not a red test.
- [X] T005 In tests/wheel.test.js, add a test "outside fields carry French felt labels and French+German result labels (FR-006, FR-007)". It asserts the exact `label` / `feltLabel` pairs from specs/003-french-layout/data-model.md § 2 for `low, high, even, odd, red, black, dozen1, dozen2, dozen3`. It also asserts that `col1..col3` keep `label` "1. Kolonne" / "2. Kolonne" / "3. Kolonne" with `feltLabel === undefined`, and that numbers and lines have `feltLabel === undefined`. This test must **fail** now.
- [X] T006 In public/js/domain/wheel.js, `OUTSIDE_DEFINITIONS`: change `label` and add `feltLabel` for the 9 fields exactly per data-model § 2:
  - `low` gets label "Manque (1–18)" and feltLabel "Manque" (use the en dash `–` as today).
  - The other eight follow the same pattern.
  - Leave `id`, `ratio` and `wins` untouched, and leave `col1..col3` untouched.
  - Make sure `OUTSIDE_FIELDS` keeps `feltLabel` (the spread `...f` already does), and that number and line fields do not get the property.
- [X] T007 Run `node --test`. T004 and T005 must pass. Fix any other test that asserts an old outside label such as "Rot" or "1. Dutzend" as a result-list text by updating it to the new label (search the tests for `/Rot|Schwarz|Gerade|Ungerade|1–18|19–36|Dutzend/`). `tests/reference-scenarios.test.js` must not need changes. If it does, stop, because that means a rule changed.

**Checkpoint**: Rules are frozen by the snapshot and the labels are ready. The board still looks horizontal.

---

## Phase 3: User Story 1 - Tableau sieht aus wie das Tuch (Priority: P1) 🎯 MVP

**Goal**: The vertical French felt with lines **off**: 0 on top, 12 rows of 3, Manque/Pair/Rouge left, Passe/Impair/Noir right, P12/M12/D12 on both sides, columns at the bottom, French felt labels.

**Independent Test**: With `lineBets: false`, open the app and compare it with the felt (quickstart § B M1). Tapping 17 marks the same six winners as before.

### Tests for User Story 1 ⚠️ write first, must fail

- [X] T008 [US1] In tests/render.integration.test.js, update `mount()` to pass only `{ tableau, lineList }` to `buildTableau` (drop `dozens` and `outside`). Replace the test "lineBets false builds exactly the pre-line board (FR-028)" with a test "lineBets false builds the French board: 49 ids, 52 elements". It asserts:
  - `els.cells.size === 49`
  - `dozen1..3` have 2 elements each, and every other id has 1
  - there is no `.zone` or `.pick`
  - `tableau.classList` contains `french` and not `lines`
  - **every** element has a non-empty `style.gridRow` and `style.gridColumn`
  - `lineList.children.length === 0`
- [X] T009 [US1] In tests/render.integration.test.js, add a helper `cellsOf(el)` that expands `style.gridRow` / `style.gridColumn` values like `"2 / 4"` (end exclusive) or `"5"` into the set of `"row|col"` strings the element covers. Then add a test "lines off: no two tableau elements share a grid cell" over all 52 elements.
- [X] T010 [US1] In tests/render.integration.test.js, add a test "lines off: placements follow the French felt (FR-001, FR-002, FR-005)" that asserts exact placements per the Grid reference (lines off):
  - `n0` → `1` / `2 / 5`
  - `n1` → `2` / `2`, `n3` → `2` / `4`, `n34` → `13` / `2`, `n36` → `13` / `4`
  - left `low` → `2 / 4` / `1`, right `high` → `2 / 4` / `5`, left `red` → `6 / 8` / `1`, right `black` → `6 / 8` / `5`
  - both `dozen3` elements → row `12 / 14`, one in column `1` and one in column `5`
  - `col1` → `14` / `2`, `col3` → `14` / `4`

  Also assert that the cell text of `low` is "Manque" and of `dozen1` is "P12" (the `.cell-label` child), and that `n0` still has class `zero`.
- [X] T011 [US1] Run `node --test tests/render.integration.test.js` and confirm that T008–T010 fail for the expected reasons: wrong container count and missing placement.

### Implementation for User Story 1

- [X] T012 [US1] In public/js/ui/tableau.js, rewrite the geometry per specs/003-french-layout/contracts/ui-tableau.md and the Grid reference:
  - Export `LEFT_SIDE` / `RIGHT_SIDE` constants (the side lists).
  - Replace the 002 helpers with `numberGridPlacement(n, { lineBets })` and `sideGridPlacements(fieldId, { lineBets })`. The latter returns an array: 1 entry for chances and `colJ`, 2 for `dozenJ` (left first).
  - Keep `lineGridPlacement(field)`, but with the transposed "lines on" formulas (implemented in T020).
  - Remove `columnButtonPlacement` and the old row/column constants (`ROW_OF_NUMBER`, `H32`, `H21`, `EDGE`, `V0`) and update the header comment to describe the French grid.
- [X] T013 [US1] In public/js/ui/tableau.js, rewrite `buildTableau({ tableau, lineList }, { lineBets = false } = {})`:
  - Add class `french` to `tableau` (plus `lines` when on).
  - Append `n0` (class `zero`) and `n1..n36`, then the LEFT and RIGHT side cells (class `outside`), then `col1..col3` (class `outside colbtn`), each placed with `placeAt`. The dozens are created twice (once per side), both via `cell(fieldById(id), "outside")`.
  - Cell text becomes `field.feltLabel ?? field.label` in `cell()`.
  - Drop all use of `dozens` / `outside` containers.
  - Keep the zone and line-list code paths.
  - Keep the count check, but compare **ids** (`byId.size`) as today, and collect from `[tableau, lineList]` only.
- [X] T014 [US1] In public/js/main.js, change the call to `buildTableau({ tableau: $("tableau"), lineList: $("line-list") }, { lineBets: config.lineBets })`. In public/index.html, delete `<div class="betrow" id="dozens"></div>` and `<div class="betrow" id="outside"></div>`.
- [X] T015 [US1] In public/css/style.css, replace the horizontal tableau rules:
  - Add `--row-min: 36px` to `:root`.
  - `.tableau.french { grid-template-columns: minmax(5.5rem, 0.8fr) repeat(3, minmax(0, 1fr)) minmax(5.5rem, 0.8fr); grid-template-rows: repeat(14, minmax(var(--row-min), 1fr)); gap: 4px; }`
  - Remove `.cell.zero { grid-row …; grid-column … }` (placement is inline now) and the `.betrow` / `.betrow.dozens` rules.
  - Change `.cell` `min-height` to `var(--row-min)`, and `.cell.outside` `min-height` from `72px` to `var(--row-min)`.
  - Keep `.board` a column flex container so the tableau fills the height (`flex: 1; min-height: 0` on `.tableau`).
  - Keep the `.stage` two-column grid.
- [X] T016 [US1] In public/css/style.css, add the Rouge/Noir diamonds (research R-207): `.cell[data-field-id="red"] .cell-label::after` and `…"black"…` with `content: " ◆"` and colour `var(--red)` or `#000` with a light text-shadow so it is visible on `--felt-raised`. Do not set `data-colour` on outside cells.
- [X] T017 [US1] Run `node --test`. All tests must pass, including T004 (snapshot), T008–T010 and the unchanged `tests/reference-scenarios.test.js`. Then open the app with `lineBets: false` at 1366×768 and 1180×820 and check quickstart § C rows "off": no page scroll, cells ≥ 36 px tall.

**Checkpoint**: MVP. The French felt without line bets is usable and fully tested.

---

## Phase 4: User Story 2 - Einsätze an der gewohnten Stelle erfassen (Priority: P2)

**Goal**: Both positions of each dozen act as one bet: shared state, shared count, one result card, and a clear from either side.

**Independent Test**: After 5, tap left P12 and right P12 once each. Both show `2x`, and one card reads "P12 (1. Dutzend)".

Per research R-206 this should need **no production code**. The tasks are tests that prove it.

### Tests for User Story 2

- [X] T018 [P] [US2] In tests/render.integration.test.js, add a test "both dozen positions are one bet (FR-004, US2 AC1–2)". Mount with lines off and render after `setWinningNumber(createRound(), 5)`, then assert:
  - both `dozen1` elements are `winner`, and all four `dozen2` / `dozen3` elements are `loser` and `disabled`
  - after `addStake(round, "dozen1")` twice, both `dozen1` elements show state `occupied` and badge `2x`
  - `els.results` contains exactly one `.result` whose text matches `/P12 \(1\. Dutzend\)/`
- [X] T019 [P] [US2] In tests/render.integration.test.js, add a test "on zero every dozen and column position is locked (US2 AC3)". After 0, all 6 dozen elements and 3 column elements are `loser` and `disabled`. Add a second test "clearing a dozen empties both positions (US2 AC4)": `clearField(round, "dozen1")` from `public/js/domain/round.js` leaves both elements with `taps` hidden and state `winner`. Then run `node --test`. If any US2 test fails, fix it in `render.js` or `tableau.js` only, never in the domain.

**Checkpoint**: The doubled dozens are proven equivalent to one bet.

---

## Phase 5: User Story 4 - Linienwetten im senkrechten Tableau (Priority: P2)

**Goal**: With `lineBets: true`, all 108 zones sit on the lines of the vertical felt, and the selection list sits beside the board.

**Independent Test**: With lines on and after 17, the 11 winning zones surround the 17 exactly as in data-model § 4 "Worked example", and the list shows the same 11.

### Tests for User Story 4 ⚠️ write first, must fail

- [X] T020 [US4] In tests/render.integration.test.js, replace the test "no two zones share a grid cell, and no zone sits on a number cell (FR-021)" with "lines on: no two tableau elements share a grid cell". It covers all 160 tableau elements (52 felt + 108 zones) using `cellsOf` from T009, and asserts 157 ids and 268 elements in total (including list entries). Keep the other 002 line tests as they are.
- [X] T021 [US4] In tests/render.integration.test.js, add a test "lines on: zones sit between exactly their numbers (SC-003)". Build a lookup `"row|col" → number` from the number cells, using `cellsOf`, so `n0` covers `1|3` … `1|7`. For every line id, take its zone cell `(r, c)`:
  - **split, corner, trio**: the set of numbers found in the 8-neighbourhood `(r±1, c±1)` of the zone must equal `field.numbers` exactly.
  - **street**: `c === 2`, and the numbers at `(r, 3)`, `(r, 5)`, `(r, 7)` equal `field.numbers`.
  - **sixline**: `c === 2`, and the numbers at `(r−1, 3|5|7)` plus `(r+1, 3|5|7)` equal `field.numbers`.
  - **basket**: `r === 2 && c === 2`.

  Also assert the worked example from data-model § 4 literally: 17 at `13|5`, split-16-17 `13|4`, split-17-18 `13|6`, split-14-17 `12|5`, split-17-20 `14|5`, street-16-17-18 `13|2`, sixline-13-14-15-16-17-18 `12|2`, basket-0-1-2-3 `2|2`, trio-0-1-2 `2|4`, split-0-3 `2|7`.
- [X] T022 [US4] Run the integration tests and confirm that T020 and T021 fail on the 002 horizontal placements. *(Deviation: the "lines on" geometry was written together with T012, so there was no red phase. Instead a mutation check was run: moving the corners one column and swapping a side list made 8 tests fail. Restored, back to green.)*

### Implementation for User Story 4

- [X] T023 [US4] In public/js/ui/tableau.js, implement the "lines on" branches of `numberGridPlacement`, `sideGridPlacements` and `lineGridPlacement` exactly per the Grid reference. Use one helper each for `k(n)`, `j(n)` and `c(j)`. Lowest non-zero number `a = Math.min(...field.numbers.filter((n) => n > 0))`. A split is `{a, a+1}` when `field.numbers[1] - field.numbers[0] === 1` and neither is 0. Update the comment block ("Columns: … Rows: …") to the 8×26 layout.
- [X] T024 [US4] In public/css/style.css, replace the `.tableau.lines` template with `.tableau.french.lines`:
  - `grid-template-columns: minmax(5.5rem, 0.8fr) var(--line-track-v) minmax(0, 1fr) var(--line-track-v) minmax(0, 1fr) var(--line-track-v) minmax(0, 1fr) minmax(5.5rem, 0.8fr);`
  - `grid-template-rows: minmax(var(--row-min), 1fr) var(--line-track-h) repeat(11, minmax(var(--row-min), 1fr) var(--line-track-h)) minmax(var(--row-min), 1fr) minmax(var(--row-min), 1fr);`
  - `gap: 0`

  Check that the rows add up to 26: zero, h0, 11 × (row + h), row 12, column row. In `:root` set `--line-track-v: 24px; --line-track-h: 12px`. In the `(pointer: coarse) and (max-width: 1366px)` query set `--line-track-v: 32px; --line-track-h: 14px`, and rewrite both comments to explain the flip (height is scarce now, research R-203). Remove `.tableau.lines .colbtn { margin-left: 6px; }`.
- [X] T025 [US4] In public/css/style.css, size the zone marker by the thin track: in `.zone[data-state="winner"]::before, .zone[data-state="occupied"]::before` use `width: calc(min(var(--line-track-v), var(--line-track-h)) * 0.9)` and the same for `height`. Update the comment.
- [X] T026 [US4] In public/css/style.css, put the selection list beside the tableau (research R-205):
  - `.stage.lines .board { display: grid; grid-template-columns: minmax(0, 1fr) 13rem; gap: 0.6rem; }`
  - `.line-list` becomes `grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: var(--tap-min); align-content: start; min-height: 0;`. Drop the two-row reservation, because the list now has the full board height.
  - `.stage.lines` keeps the panel column (`minmax(280px, 20rem)`).
  - In the portrait media query, make `.stage.lines .board` a single column again so the list stacks below.
- [X] T027 [US4] Run `node --test` (all green). Then check quickstart § C "on" rows at 1366×768 (fullscreen), 1920×1080 and 1180×820, and record the measured cell heights in the quickstart table. With 17 entered, the list must show all 11 entries without scrolling at 1366×768.

**Checkpoint**: Line bets work on the vertical felt, and both routes still agree.

---

## Phase 6: User Story 3 - Französische Begriffe verstehen (Priority: P3)

**Goal**: The result list shows the French term plus its German meaning, and the rest of the interface stays German.

**Independent Test**: After 14 with Manque, Pair, Rouge and M12 occupied, the cards read "Manque (1–18)", "Pair (Gerade)", "Rouge (Rot)" and "M12 (2. Dutzend)".

- [X] T028 [US3] In tests/render.integration.test.js, add a test "result cards show French and German (US3 AC1)": after `setWinningNumber(createRound(), 14)` plus one `addStake` each on `low`, `even`, `red` and `dozen2`, `els.results.textContent` contains all four labels above. Then assert that `els.status.textContent` still matches `/Gewinnzahl/` (FR-008). It should pass already after T006. If it does not, fix `render.js` to use `result.label`.
- [X] T029 [US3] Search `public/index.html` and `public/js/ui/*.js` for any hard-coded outside-bet text ("Rot", "Schwarz", "Dutzend", "Gerade", …) outside the swatch title `COLOUR_WORD` in render.js, which stays German on purpose because it names the winning number's colour. Replace any found felt text with the catalogue label. Expected result: nothing to change. Record that in the commit message.

**Checkpoint**: All four stories are complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T030 [P] In README.md:
  - In the intro and "Rules of the house", state that the board shows the **French felt** (0 on top, Manque/Pair/Rouge left, Passe/Impair/Noir right, P12/M12/D12 on both sides as one bet each).
  - State that the rules are unchanged: no La Partage, no En Prison, and on zero all outside bets lose in full.
  - Add to "On the tablet" or a new "On the laptop" note: use ⛶ fullscreen on 1366×768 with line bets, otherwise number rows drop below 36 px.
- [X] T031 [P] In public/config.js, check that the comment on `lineBets` still reads correctly. It says "false = Tableau wie vorher", so change it to "false = Tableau ohne Linienwetten".
- [X] T032 Run the full suite `node --test`. Expect 100 + new tests, 0 failing, with `tests/reference-scenarios.test.js` byte-identical to its 002 version (`git diff --exit-code 002-line-bets -- tests/reference-scenarios.test.js`). Confirm that `git diff 002-line-bets -- public/js/domain/round.js public/js/domain/payout.js public/js/domain/config.js` is empty.
- [ ] T033 Manual felt check at the host's table per quickstart § B (M1–M3). If the sides or the street edge differ, swap `LEFT_SIDE` / `RIGHT_SIDE`, or mirror the E column in public/js/ui/tableau.js, then update the tests from T010 and T021 and data-model § 4 accordingly.
- [ ] T034 Speed comparison per quickstart § D steps 2–3 (SC-004, SC-005). Record the result in the quickstart.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T003 is manual and may run in parallel with everything, but must happen before deployment.
- **Foundational (Phase 2)**: depends on Setup and blocks all stories. T004 must run **before** T006 (the snapshot is taken on the old code).
- **US1 (Phase 3)**: depends on Foundational. It is the MVP.
- **US2 (Phase 4)**: depends on US1, because the dozens are created in T013. It is tests only.
- **US4 (Phase 5)**: depends on US1 (shared `tableau.js` rewrite and `cellsOf` helper). It is independent of US2.
- **US3 (Phase 6)**: depends on Foundational (labels) and on US1 (`mount()` signature). It is independent of US2 and US4.
- **Polish (Phase 7)**: after all stories.

### User Story Dependencies

```text
Setup → Foundational → US1 ─┬→ US2
                            ├→ US4
                            └→ US3
                                 └→ Polish (after all)
```

### Within Each Story

- Tests are written first and must fail, except the guard T004 and the no-code stories US2 and US3, whose tests are expected to pass.
- `tableau.js` geometry comes before CSS, and CSS before manual measurement.
- Most tasks edit `tests/render.integration.test.js` or `public/js/ui/tableau.js` / `public/css/style.css`, so tasks within a story are mostly sequential.

### Parallel Opportunities

- T003 (manual baseline) runs alongside everything in Phases 1–2.
- After US1: **US2, US4 and US3 can go in parallel** by different people, **but** they all append to `tests/render.integration.test.js`, so merge carefully. US4 is the only one touching `tableau.js` or CSS.
- T018 and T019 are marked [P] because they are independent test blocks. T030 and T031 are different files.

## Parallel Example: after US1

```text
Developer A: T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027   (US4, lines)
Developer B: T018, T019                                              (US2, dozens tests)
Developer C: T028, T029                                              (US3, labels)
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 and Phase 2: branch, baseline, snapshot guard, labels.
2. Phase 3: the vertical French felt without lines.
3. **Stop and validate**: run `lineBets: false` at the table (quickstart § B M1). This is already shippable if line bets can wait.

### Incremental Delivery

1. MVP (US1) → felt check.
2. US2 → proves the doubled dozens (tests only).
3. US4 → line bets back on the vertical felt, with the list beside it. Measure the heights.
4. US3 → result-list wording confirmed.
5. Polish → README, the final rule-invariance diff, the speed comparison.

## Notes

- Never touch `round.js`, `payout.js` or `config.js` (domain), and never touch a `wins` predicate or `ratio`. T032 checks this with `git diff`.
- If the host's felt differs from the assumed sides or street edge, that is a constant swap in `tableau.js` plus a test update (T033), not a redesign.
- Commit after each checkpoint.
