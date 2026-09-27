---

description: "Task list for Wetten auf den Linien"
---

# Tasks: Wetten auf den Linien

**Input**: Design documents from `specs/002-line-bets/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: INCLUDED. The plan and the quickstart make `node --test` part of the definition of done, and SC-001 / SC-002 are defined as automated checks. Within each story, test tasks come first and must fail before the implementation tasks start.

**Organization**: Tasks are grouped by user story, in the priority order from spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 … US5, mapping to spec.md user stories
- Paths are relative to the repo root. The app is a single static project: `public/` for the app, `tests/` for tests.

## Grid track reference (used by T019–T021)

This section is here so tasks do not need to re-derive the maths. The source is [data-model § 6](./data-model.md) and [research R-103](./research.md).

- **Columns (26)**, template `1.15fr var(--line-track) repeat(11, 1fr var(--line-track)) 1fr 0.95fr`:
  - column 1 = zero
  - `v0` = column 2
  - street `k` (1–12) is `c(k)` = column `2k+1`, so `c1` = 3 and `c12` = 25
  - `v(k)` (0–11) = column `2k+2`, so `v11` = 24
  - the 2:1 column buttons = column 26
- **Rows (6)**, template `minmax(var(--tap-min),1fr) var(--line-track) minmax(var(--tap-min),1fr) var(--line-track) minmax(var(--tap-min),1fr) var(--line-track)`:
  - `r3` = 1, `h32` = 2, `r2` = 3, `h21` = 4, `r1` = 5, `hb` = 6
- **Numbers**:
  - zero: `grid-row: 1 / 6`, `grid-column: 1`
  - n ≥ 1: `s = floor((n-1)/3)`, row = `{0: 1, 2: 3, 1: 5}[n % 3]`, column = `2s+3`
  - column button `colK`: column 26, row = `{3: 1, 2: 3, 1: 5}[K]`
- **Lines** (`s` = street index of the lowest non-zero number):

  | Line | Row | Column |
  |---|---|---|
  | split `{n, n+1}` | `n%3===2 ? 2 : 4` | `2s+3` |
  | split `{n, n+3}` | row of `n` | `2s+4` |
  | split `{0, k}` | row of `k` | 2 |
  | corner `{b, …}` | `b%3===2 ? 2 : 4` | `2s+4` |
  | trio `0-1-2` | 4 | 2 |
  | trio `0-2-3` | 2 | 2 |
  | street | 6 | `2s+3` |
  | sixline | 6 | `2s+4` |
  | basket | 6 | 2 |

---

## Phase 1: Setup

**Purpose**: Put the feature on its own branch and secure the baseline measurements before any code changes.

- [X] T001 Create and switch to git branch `002-line-bets` from the current `001-roulette-dealer-companion` HEAD (repo root). Confirm that `.specify/feature.json` contains `"feature_directory": "specs/002-line-bets"`.
- [X] T002 Run `node --test` at the repo root and confirm the baseline of **61 passing, 0 failing** before any change. Stop and report if it differs.
- [ ] T003 [P] Measure the SC-006 baseline on the **unchanged** build, following specs/002-line-bets/quickstart.md § C step 1: 5 timed rounds with 4 occupied fields, on the laptop and on the tablet. Enter the medians in the "Baseline s" column of the table in specs/002-line-bets/quickstart.md. This is a manual step and must happen before the UI changes are deployed (spec Assumption "Messbasis für SC-006").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Extend the catalogue, config and stake rule, and change the tableau map to one entry per field holding a list of elements. Every story depends on this.

**⚠️ CRITICAL**: No user-story work starts until `node --test` is green at the end of this phase.

- [X] T004 [P] In public/js/domain/config.js, add `lineBets: true` to `DEFAULT_CONFIG`. Add a rule `{ key: "lineBets", valid: (v) => v === true || v === false, expected: "true oder false" }` to `RULES`. The string `"false"` must be **invalid** (contracts/config-contract.md).
- [X] T005 [P] Extend tests/config.test.js with these cases: the defaults include `lineBets: true`; `lineBets: false` is accepted; `"false"`, `0`, `null` and `"no"` each fall back to `true` with one warning that names `lineBets`; an invalid `lineBets` does not affect valid siblings.
- [X] T006 [P] In public/config.js, add `lineBets: true, // Wetten auf den Linien anbieten; false = Tableau wie vorher`. Change the `baseStakeNumber` comment to `// ein Tap auf eine Innenwette: Zahl (0-36) oder Linie (Split, Street, Corner, ...)`. Use exactly the "Resulting file" in specs/002-line-bets/contracts/config-contract.md. Do **not** rename the key.
- [X] T007 In public/js/domain/wheel.js, export `LINE_TYPES = Object.freeze(["split","street","trio","corner","basket","sixline"])` and generate `LINE_FIELDS` (108 entries):
  - For street `s` from 0 to 11 with `b = 3s+1`: splits `[b,b+1]` and `[b+1,b+2]`, and street `[b,b+1,b+2]`.
  - For `n` from 1 to 33: split `[n,n+3]`.
  - Splits `[0,1]`, `[0,2]` and `[0,3]`.
  - For `s` from 0 to 10 with `b = 3s+1`: corners `[b,b+1,b+3,b+4]` and `[b+1,b+2,b+4,b+5]`, and sixline `[b…b+5]`.
  - Trios `[0,1,2]` and `[0,2,3]`, and basket `[0,1,2,3]`.
  - Sort by `LINE_TYPES` index, then lexicographically by `numbers`.
  - Give each entry `id = \`${type}-${numbers.join("-")}\``, `kind: "line"`, `type`, `numbers` (frozen array), `ratio` from `{split:17, street:11, trio:11, corner:8, basket:8, sixline:5}`, `colour: undefined`, `number: undefined` and `wins: (w) => numbers.includes(w)`.
  - Labels follow data-model § 3: `Split a/b`, `Street a-b-c`, `Trio 0-a-b`, `Corner a/b/c/d`, `Basket 0-1-2-3`, `Sixline a–f` (en dash, first and last number only).
  - Freeze each entry. Set `BET_FIELDS = [...NUMBER_FIELDS, ...LINE_FIELDS, ...OUTSIDE_FIELDS]` (157 entries) and update the doc comments that say "49" or "Exactly 6 ids".
- [X] T008 [P] In public/js/domain/payout.js, change `unitFor` to `field.kind === "outside" ? config.baseStakeOutside : config.baseStakeNumber`. Add a one-line comment that lines are inside bets and share the number stake (research R-102).
- [X] T009 Amend tests/wheel.test.js for the 157-field catalogue, following contracts/domain-api.md:
  - The count test asserts 157 = 37 number + 108 line + 12 outside.
  - "every number 1-36 has EXACTLY six winning fields" and "each of the six winners is one per category" filter to `fieldById(id).kind !== "line"` first.
  - The zero test asserts `winningFieldIds(0)` equals `["n0","split-0-1","split-0-2","split-0-3","trio-0-1-2","trio-0-2-3","basket-0-1-2-3"]` and every outside field still loses on 0.
  - The ratio test for numbers filters `kind === "number"` (unchanged intent).
- [X] T010 In tests/reference-scenarios.test.js, amend 001 Scenario 1 and Scenario 2 so they assert on `winningFieldIds(n).filter((id) => fieldById(id).kind !== "line")`. Their meaning (exactly the six 001 fields for 17, only `n0` for 0) stays unchanged. Update the file header comment to say that it holds the 001 **and** 002 reference scenarios.
- [X] T011 [P] In tests/payout.test.js, extend "unit is chosen by field kind": `unitFor(fieldById("split-16-17"), CONFIG)` and `unitFor(fieldById("sixline-13-14-15-16-17-18"), CONFIG)` both equal `baseStakeNumber`, and outside still equals `baseStakeOutside`.
- [X] T012 In public/js/ui/tableau.js, change the signature to `buildTableau({ tableau, dozens, outside, lineList }, { lineBets = false } = {})` and make the returned map `Map<fieldId, HTMLElement[]>`, with every value an array. For now, `lineBets: true` behaves like `false`: zones and the list come in US1 and US3. With `lineBets: false` the DOM output must be byte-for-byte what it is today. Update the size sanity check so it compares against the number of fields actually built.
- [X] T013 In public/js/ui/render.js, extract `applyState(el, state, taps)` (sets `dataset.state`, `disabled = state === "loser"`, and the `.taps` badge). Change `renderFields` to `for (const [id, list] of cells) for (const el of list) applyState(el, state, taps)`, with the state computed once per id.
- [X] T014 In tests/render.integration.test.js, adapt to the array map: `els.cells.get(id)` becomes `els.cells.get(id)[0]`, and loops over `cells` iterate the arrays. `mount()` still calls `buildTableau` without options. All 10 existing tests must pass unchanged in intent.
- [X] T015 In public/index.html, add `<div class="line-list" id="line-list" aria-label="Linienwetten" hidden></div>` inside `section.board` directly after `#outside`. In public/js/main.js, pass `lineList: $("line-list")` and `{ lineBets: config.lineBets }` to `buildTableau`, set `els.lineList = $("line-list")`, and set `els.lineList.hidden = !config.lineBets`.

**Checkpoint**: `node --test` is fully green. The app in the browser looks and behaves exactly as before, with either `lineBets` value.

---

## Phase 3: User Story 1 – Gewinnende Linien nach dem Wurf erkennen (Priority: P1) 🎯 MVP

**Goal**: After the winning number is entered, every line containing it lights up at its real position on the tableau, and every other line is locked.

**Independent Test**: Enter 17, 1 and 0 and compare the active zones with spec US1 AC1–3. Tap zones before a number is entered: nothing happens (AC5).

### Tests for User Story 1 (write first, must fail)

- [X] T016 [P] [US1] Create tests/lines.test.js with catalogue and geometry tests:
  - counts per type: split 60, street 12, trio 2, corner 22, basket 1, sixline 11, total 108
  - ratios per type (data-model § 2)
  - every `numbers` array is sorted, has no duplicates, is within 0–36, and has the length for its type
  - **adjacency** (data-model § 1): every split is `{n,n+1}` with `n%3 !== 0`, or `{n,n+3}` with `n ≤ 33`, or `{0,1|2|3}`; every corner is `{b,b+1,b+3,b+4}` with `b%3 !== 0` and `b ≤ 32`; there is explicitly no `split-3-4` and no `split-34-37`
  - ids are unique across all 157 fields
  - label examples: `Split 16/17`, `Street 16-17-18`, `Corner 13/14/16/17`, `Sixline 13–18`, `Trio 0-1-2`, `Basket 0-1-2-3`
  - **exhaustive SC-001**: for every n from 0 to 36, the set of line ids in `winningFieldIds(n)` equals `LINE fields.filter(f => f.numbers.includes(n))`
  - per-number line counts: 17 has 11, 1 has 8, 0 has 6, 34 and 36 have 5, and the maximum over all n is 11
  - `isWinner(lineId, null) === false` for every line
- [X] T017 [P] [US1] Add 002 reference scenarios 1 and 2 to tests/reference-scenarios.test.js:
  - 17 gives exactly 17 ids: `n17, black, odd, low, dozen2, col2, split-14-17, split-16-17, split-17-18, split-17-20, street-16-17-18, corner-13-14-16-17, corner-14-15-17-18, corner-16-17-19-20, corner-17-18-20-21, sixline-13-14-15-16-17-18, sixline-16-17-18-19-20-21`
  - 0 gives exactly the 7 ids from T009
- [X] T018 [P] [US1] Add a `mount({ lineBets: true })` variant to tests/render.integration.test.js, with tests for:
  - the map has 157 keys, and every line id has an element with class `zone` and `style.gridRow` / `style.gridColumn` set
  - **no two zones share a `(gridRow, gridColumn)` pair**, and no zone shares one with any number cell (FR-021)
  - the tableau element has class `lines`
  - before a number is entered, all zones are `neutral` and enabled
  - after 17, exactly 11 zones are `winner` and 97 are `loser` and disabled
  - after 0, exactly the 6 zero lines are winners

### Implementation for User Story 1

- [X] T019 [US1] In public/js/ui/tableau.js, add and export the pure function `lineGridPlacement(field)` returning `{ row, column }` per the "Grid track reference" table at the top of this file. Also add `numberGridPlacement(n)` and `columnButtonPlacement(k)`.
- [X] T020 [US1] In public/js/ui/tableau.js, when `lineBets` is true:
  - add class `lines` to `tableau`
  - set explicit `style.gridRow` / `style.gridColumn` on the zero (`1 / 6`, column 1), on every number cell and on the three column buttons
  - build one `zone(field)` button per line field: class `zone`, `data-field-id`, `data-line-type`, `title` and `aria-label` = label, a hidden `.taps` badge, no visible label text, and `data-state="neutral"`
  - place each zone with `lineGridPlacement` and push it into the field's element array
  - keep the `lineBets: false` path untouched
- [X] T021 [US1] In public/css/style.css:
  - add `--line-track: 22px` to `:root`
  - add `.tableau.lines` with the 26-column and 6-row templates from the reference section and `gap: 0`
  - give `.tableau.lines .cell` a `margin: 3px` inset so the number cells stay visually separated
  - give `.tableau.lines .colbtn` a `margin-left: 6px`
  - add `.zone` styles: position and size fill the grid cell, the zone is transparent in `neutral`, and a centred 10–12 px dot shows its position
  - `[data-state="winner"]`: bright gold dot of about 70 % of the track with an outline, clearly stronger than anything else on the board (FR-022)
  - `[data-state="occupied"]`: gold-filled dot with the `.taps` badge centred
  - `[data-state="loser"]`: `opacity: 0`, `pointer-events: none`
  - `.zone:active` gives visual press feedback
- [X] T022 [US1] In public/js/main.js, confirm that the click handler ignores line fields while `round.winningNumber === null` and while `pickingNumber` is true (the existing `field?.kind !== "number"` guards cover this). Add a one-line comment at each guard naming FR-009 so that a later refactor keeps it.

**Checkpoint**: US1 tests are green. In the browser, entering 17 shows the 11 winning lines at the right edges and corners.

---

## Phase 4: User Story 2 – Einsätze auf Linien erfassen und Auszahlung ablesen (Priority: P2)

**Goal**: Taps on a winning line count up, and the line pays at its ratio with the inside stake, with the same four figures and the same total as every other field.

**Independent Test**: With 17 set, tap known lines a known number of times and compare the result cards with spec US2 AC1–7.

### Tests for User Story 2 (write first)

- [X] T023 [P] [US2] Add 002 reference scenarios 3–6 plus the basket case to tests/reference-scenarios.test.js, using `resultFor` with `baseStakeNumber: 5`:
  - `split-16-17` × 2 gives 10 / 170 / 180 / 85
  - `street-16-17-18` × 1 gives 5 / 55 / 60 / 55
  - `corner-16-17-19-20` × 3 gives 15 / 120 / 135 / 40
  - `sixline-13-14-15-16-17-18` × 2 gives 10 / 50 / 60 / 25
  - `basket-0-1-2-3` × 2 gives 10 / 80 / 90 / 40
- [X] T024 [P] [US2] Add round integration tests to tests/lines.test.js:
  - `addStake(round, "split-16-17")` twice after `setWinningNumber(17)` gives `stakes["split-16-17"] === 2`
  - `addStake` on the losing `split-1-2` is a no-op, and so is `addStake` on a line before any number is set
  - `needsConfirmation` is `true` when the only stakes are on lines
  - `occupiedFields` lists `n17` before line fields before outside fields
  - `roundTotals` over number, line and outside results equals the sum of their totals
- [X] T025 [P] [US2] Add a test to tests/render.integration.test.js with `lineBets: true`: after 17 and two stakes on `split-16-17` plus one on `n17`, the panel shows a card named `Split 16/17` containing `10 €`, `170 €`, `180 €` and `85 €`, and `els.total` shows `360 €` (180 for the split + 180 for one tap on `n17`: 5 € stake + 175 € win).

### Implementation for User Story 2

- [X] T026 [US2] In public/index.html, rename the settings label "Einzelzahlen" to "Innenwetten (Zahlen &amp; Linien)" (FR-012). Then confirm that no other code change is needed for T023–T025 to pass: lines flow through `resultFor` and `occupiedFields` unchanged (research R-101). If any of those tests fail, fix the cause in public/js/domain/ without changing a function signature.

**Checkpoint**: US1 + US2 give a usable line-bet feature through the tableau alone.

---

## Phase 5: User Story 3 – Linien im Partytempo sicher treffen (Priority: P3)

**Goal**: A second, precision-free route (a list of only the winning lines) behaves identically to the zones, and every tap is visibly confirmed.

**Independent Test**: With 17 set, capture stakes once using only zones and once using only the list, and compare. Mix both routes on one line, then undo (spec US3 AC3, AC5–7).

### Tests for User Story 3 (write first)

- [X] T027 [P] [US3] Add these tests to tests/render.integration.test.js with `lineBets: true`:
  - the `lineList` container holds 108 elements with class `pick` plus one `.line-list-hint`
  - before a number is entered, every `pick` is hidden and the hint is visible
  - after 17, exactly 11 picks are visible, in the order `split-14-17, split-16-17, split-17-18, split-17-20, street-16-17-18, corner-13-14-16-17, corner-14-15-17-18, corner-16-17-19-20, corner-17-18-20-21, sixline-13-14-15-16-17-18, sixline-16-17-18-19-20-21`, and the hint is hidden
  - after one `addStake` on `split-16-17`, **both** of its elements (zone and pick) have `data-state="occupied"` and the badge `1x`
  - while picking a new number (`view.pickingNumber`), every pick is hidden and the hint is visible again
- [X] T028 [P] [US3] Add correction tests to tests/lines.test.js:
  - with 17 set, the stakes `n17`, `black`, `split-16-17`, `corner-16-17-19-20`, `split-16-17` followed by five `undo` calls reverse exactly in that order (FR-016)
  - `clearField` on `split-16-17` leaves every other stake untouched, and one `undo` restores it in full (FR-017)
  - `changeWinningNumber(round, 5)` and `nextRound` both leave no line stakes (FR-018, FR-019)

### Implementation for User Story 3

- [X] T029 [US3] In public/js/ui/tableau.js, when `lineBets` is true and `lineList` exists:
  - append one `p.line-list-hint` with the text `Linienwetten erscheinen nach der Gewinnzahl`
  - append 108 `pick(field)` buttons in catalogue order: class `pick`, `data-field-id`, a visible `.cell-label` with the field label, a hidden `.taps` badge, `data-state="neutral"`, and `hidden = true`
  - push each pick into its field's element array, after the zone
- [X] T030 [US3] In public/js/ui/render.js, add `renderLineList(els.lineList, …)`, called only when `els.lineList` has children:
  - the hint is visible iff no number is set or `picking` is true
  - each `.pick` is visible iff a number is set, `picking` is false and its field is a winner
  - state and badge still come from `applyState`, which T013 already covers
- [X] T031 [US3] In public/js/main.js, after a click results in `addStake`, check whether the round changed (`next !== round`). If it did, set `data-flash` on every element in `els.cells.get(fieldId)`, restarting the animation by removing the attribute and forcing a reflow first, and remove it after 260 ms (research R-105). Do not flash on no-op taps.
- [X] T032 [US3] In public/css/style.css:
  - `.line-list`: `display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px`, with `min-height` reserved for 2 rows of `var(--tap-min)` so the board does not jump
  - `.line-list-hint` spans all columns, uses `var(--ink-dim)` and is at least 1rem
  - `.pick` reuses the look of `.cell.outside`, with `min-height: var(--tap-min)`, font at least 1rem and the same `winner` / `occupied` state styles
  - `[data-flash]` gets a roughly 250 ms keyframe pulse (scale 1 → 1.12 → 1 plus gold glow) that works on `.cell`, `.zone` and `.pick`

**Checkpoint**: Both routes work, stay in sync and confirm every tap. This is the full option C behaviour.

---

## Phase 6: User Story 4 – Den Versuch bewerten und notfalls zurücknehmen (Priority: P4)

**Goal**: `lineBets: false` gives back exactly the pre-feature app.

**Independent Test**: Set `lineBets: false` and run every 001 reference scenario and the 001 render tests. The results must be identical (spec US4 AC1–3, SC-007).

### Tests for User Story 4 (write first)

- [X] T033 [P] [US4] Add a regression block to tests/render.integration.test.js with `mount({ lineBets: false })`:
  - the map has exactly 49 keys and every array has length 1
  - no element has class `zone` or `pick`
  - the tableau has no class `lines`, and no number cell has an inline `gridRow`
  - the `lineList` container has no children
  - after 17, exactly 6 elements are `winner` and 43 are `loser`
  - after 0, only `n0` is reachable
- [X] T034 [P] [US4] Add a test to tests/lines.test.js: after `nextRound`, a round that held stakes on `split-16-17` and `n17` equals `createRound()` (US4 AC3).

### Implementation for User Story 4

- [X] T035 [US4] Verify by hand in the browser with `lineBets: false` in public/config.js, per specs/002-line-bets/quickstart.md § B step 7: no thin tracks, no list row, same board as the pre-feature build. Then set `lineBets: "false"` (a string) and confirm the startup warning names `lineBets` and line bets stay **on**. Restore `lineBets: true`. If `#line-list` shows as an empty strip when switched off, fix it in public/js/main.js or public/css/style.css.

**Checkpoint**: The experiment can be rolled back with one config line.

---

## Phase 7: User Story 5 – Volles Tableau auf Laptop und Tablet (Priority: P5)

**Goal**: Tableau, selection list, results and total are visible together without scrolling, on the laptop and on the tablet in landscape.

**Independent Test**: On each device, play a round with 17 active fields and several occupied lines. Nothing but, at most, the results list may scroll, and the total is always visible (spec US5 AC1–2, SC-008).

### Tests for User Story 5 (write first)

- [X] T036 [P] [US5] Add tests to tests/render.integration.test.js: with 5 occupied fields `els.results` has no class `compact`, with 6 it does, and dropping back to 5 through `undo` removes it again (research R-107).

### Implementation for User Story 5

- [X] T037 [US5] In public/js/ui/render.js, toggle class `compact` on `els.results` when `results.length > 5`. The card DOM stays the same, and CSS does the compaction.
- [X] T038 [US5] In public/css/style.css, add `.results.compact .result` as a single-row layout: name and taps on the left, total payout at `var(--fs-figure)` on the right, and per chip plus the stake → win breakdown on one smaller secondary line. Payout figures must not shrink below `var(--fs-figure)` (FR-028 of 001).
- [X] T039 [US5] In public/css/style.css, add a tablet media query (`@media (pointer: coarse) and (max-width: 1366px)`) that sets `--line-track` to a separately tunable value (start at 26px). Check that `.cell` keeps at least `var(--tap-min)` and `.cell.outside` at least 72px (FR-026). Reduce `.stage` / `.board` padding and gaps as needed so topbar, tableau, dozens, outside, line list and panel fit in a landscape viewport of 1180×820 without page scroll.
- [ ] T040 [US5] Run specs/002-line-bets/quickstart.md § B steps 1–7 by hand on the laptop and on the tablet (landscape). Fix any layout overflow in public/css/style.css. Record the final `--line-track` value per device in the quickstart table.

**Checkpoint**: All five stories are done. The app is ready for the trial.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T041 [P] Update README.md:
  - under "Configure it", add the `lineBets` key and the widened meaning of `baseStakeNumber`
  - under "Test it", mention `tests/lines.test.js` and that tests/reference-scenarios.test.js now holds the 001 and 002 scenarios
  - in the opening paragraph, mention split, street, corner and sixline
- [X] T042 Run `node --test` at the repo root: everything is green, including `tests/domain-purity.test.js` (the new code in public/js/domain/wheel.js must not reference `document`, `window`, `navigator` or timers). Report the new test count against the baseline of 61.
- [ ] T043 Run the trial protocol in specs/002-line-bets/quickstart.md § C steps 2–6 on the laptop and on the tablet. Fill in the remaining table columns and write the SC-009 decision line per device (*keep lines yes/no · preferred route zones/list*). This is a manual step for the host.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies. T003 must be finished before a build with UI changes is deployed to the party devices.
- **Foundational (Phase 2)**: Depends on T001 and T002. Blocks every story.
- **US1 (Phase 3)**: Depends on Phase 2.
- **US2 (Phase 4)**: Depends on Phase 2. The domain tests T023 and T024 are independent of US1. T025 needs the zones from T020 to exist, but only through `mount({ lineBets: true })`.
- **US3 (Phase 5)**: Depends on Phase 2. The list is independent of the zones, but its render test T027 checks both elements of a line, so it depends on T020.
- **US4 (Phase 6)**: Depends on Phase 2. Most meaningful after US1 and US3 exist, because it proves they switch off.
- **US5 (Phase 7)**: Depends on US1 and US3, because it lays out the zones and the list.
- **Polish (Phase 8)**: Depends on everything wanted for the trial.

### Within each story

Tests first, and they must fail. Then tableau.js, then render.js, then main.js, then CSS. Several tasks touch the same files (`tableau.js`, `render.js`, `style.css`, `render.integration.test.js`), so tasks within one story that share a file are **not** marked [P].

### Key task dependencies

- T007 blocks T009, T010, T011 and every line test.
- T012 blocks T013 and T014. T013 blocks T030.
- T019 blocks T020, and T020 blocks T018 passing. T029 blocks T027 passing.
- T015 blocks T031 and T035.

## Parallel Opportunities

**Phase 2**: T004, T005, T006 and T008 touch four different files and can run together. T007 runs alongside them. T009, T010 and T011 follow T007 and can run together.

```text
Parallel batch A: T004 (domain/config.js) · T005 (config.test.js) · T006 (public/config.js) · T007 (wheel.js) · T008 (payout.js)
Parallel batch B: T009 (wheel.test.js) · T010 (reference-scenarios.test.js) · T011 (payout.test.js)
```

**US1 tests**: T016 (lines.test.js), T017 (reference-scenarios.test.js) and T018 (render.integration.test.js) touch three files and can run together.

**US2 tests**: T023, T024 and T025 are in three different files and can run together.

**US3 tests**: T027 and T028 are in two files and can run together.

**US4 tests**: T033 and T034 can run together.

## Implementation Strategy

### MVP first (US1)

1. Phase 1, then Phase 2, then `node --test` is green, and the board is unchanged.
2. Phase 3 (US1): the dealer can already **see** which lines win. That alone solves "does the chip on 16/17 win?"
3. **Stop and validate** on the laptop: enter 17, 1 and 0.

### Incremental delivery

1. + US2: lines are paid out, and the app is feature-complete for a precise dealer on the laptop.
2. + US3: the list route and tap feedback give the full option C, and the tablet becomes viable.
3. + US4: a verified rollback, so the experiment is safe to take to the party.
4. + US5: layout tuned for both devices, and compact results.
5. Polish, then the trial protocol, then the decision (SC-009).

### Notes

- Keep `public/js/domain/round.js` **unchanged**. If a task seems to need a change there, the line field is shaped wrongly. Fix it in wheel.js instead (research R-101).
- Never rebuild the list or zones during `render`. Only toggle attributes (research R-104, the long-press bug).
- Commit after each phase checkpoint.
