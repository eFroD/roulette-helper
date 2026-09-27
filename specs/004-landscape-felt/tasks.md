---

description: "Task list for Französisches Tableau quer"
---

# Tasks: Französisches Tableau quer

**Input**: Design documents from `specs/004-landscape-felt/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Branch**: work happens on the existing `003-french-layout` branch (host decision, 2026-09-27). **No new branch.**

**Tests**: INCLUDED, as in 002/003. `node --test` is the definition of done. Test tasks come first within each story and must fail before implementation.

**Rules stay untouched**: Do **not** edit `public/js/domain/round.js`, `payout.js`, `wheel.js` or `public/js/ui/render.js`. `tests/reference-scenarios.test.js`, `tests/wheel.test.js`, `tests/lines.test.js`, `tests/payout.test.js` and `tests/round.test.js` must pass **unmodified**.

**Organization**: Tasks are grouped by user story. US1 is P1. US2 and US3 are both P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 … US3, mapping to spec.md user stories
- Paths are relative to the repo root.

## Rotation reference (used by T004–T006, T013, T019)

The source is [data-model § 3b](./data-model.md). The vertical grid has `N` columns: `N = 5` with lines off, `N = 8` with lines on. `span(v)` means a string like `"a / b"` (end-exclusive) or `"a"`.

```text
rotate({ row, column }, N):
  landscape.column = row                       // the string is copied unchanged, spans included
  if column is "a / b": landscape.row = `${N + 2 - b} / ${N + 2 - a}`
  else (single c):      landscape.row = String(N + 1 - c)
```

Inverse, for tests only: landscape cell `(r, c)` → vertical cell `(c, N + 1 − r)`.

---

## Phase 1: Setup

- [X] T001 Confirm the current branch is `003-french-layout` and the working tree is clean apart from `specs/004-landscape-felt/`. Confirm `.specify/feature.json` points to `specs/004-landscape-felt`. Run `node --test` and confirm the baseline of **109 passing, 0 failing**. Stop and report if it differs.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Add the config key, the rotation function and the `orientation` option plumbing, with vertical behaviour unchanged. Every story depends on this.

**⚠️ CRITICAL**: `node --test` must be green at the end of this phase, and the vertical board must be unchanged.

- [X] T002 [P] In tests/config.test.js:
  - In the test "valid values are taken as given", add `orientation: "horizontal"` to the expected object, because the default is now part of every resolved config.
  - Add a test "orientation: default horizontal, both values accepted and normalised" with these cases:
    - `resolveConfig({})` gives `config.orientation === "horizontal"` and no warnings
    - `{ orientation: "vertical" }` gives `"vertical"`
    - `{ orientation: " Horizontal " }` gives `"horizontal"`
    - `{ orientation: "VERTICAL" }` gives `"vertical"`
    - none of these produce warnings
  - Add a test "invalid orientation falls back to horizontal with one warning, siblings unaffected": for each of `"quer"`, `"senkrecht"`, `""`, `true`, `1` and `null`, the result is `config.orientation === "horizontal"`, exactly one warning that includes `orientation`, and `{ orientation: "quer", baseStakeNumber: 7 }` keeps `baseStakeNumber === 7`.

  These tests must fail now.
- [X] T003 In public/js/domain/config.js:
  - Add `orientation: "horizontal"` as the last entry of `DEFAULT_CONFIG`.
  - Add the rule `{ key: "orientation", valid: (v) => typeof v === "string" && ORIENTATIONS.includes(v.trim().toLowerCase()), expected: '"horizontal" oder "vertical"', normalise: (v) => v.trim().toLowerCase() }` to `RULES`.
  - Define and export `ORIENTATIONS = Object.freeze(["horizontal", "vertical"])` above `RULES`.

  The existing warning text then reads `"orientation" ist ungueltig (erwartet: "horizontal" oder "vertical"). Standardwert "horizontal" wird verwendet.` Run `node --test tests/config.test.js` (green).
- [X] T004 In tests/render.integration.test.js:
  - Change `mount(options)` to call `buildTableau(containers, { orientation: "vertical", ...options })`, so every existing 003 test keeps asserting the vertical board.
  - Import `rotate` from `../public/js/ui/tableau.js` next to `buildTableau`.
  - Add a test "rotate turns the vertical felt a quarter turn counter-clockwise (R-302)" that asserts the lines-off rows from the table in specs/004-landscape-felt/research.md R-302 with `N = 5`:
    - `rotate({row:"1", column:"2 / 5"}, 5)` → `{row:"2 / 5", column:"1"}`
    - `{row:"2", column:"2"}` → `{row:"4", column:"2"}`
    - `{row:"2", column:"4"}` → `{row:"2", column:"2"}`
    - `{row:"2 / 4", column:"1"}` → `{row:"5", column:"2 / 4"}`
    - `{row:"2 / 4", column:"5"}` → `{row:"1", column:"2 / 4"}`
    - `{row:"14", column:"2"}` → `{row:"4", column:"14"}`

    And with `N = 8`:
    - `{row:"1", column:"3 / 8"}` → `{row:"2 / 7", column:"1"}`
    - `{row:"13", column:"2"}` → `{row:"7", column:"13"}`

  This test must fail now (`rotate` is not exported).
- [X] T005 In public/js/ui/tableau.js:
  - Add and export `rotate({ row, column }, verticalColumns)` exactly per the Rotation reference, with a short comment pointing to research R-302.
  - Add an `orientation = "vertical"` option to `numberGridPlacement(n, { lineBets, orientation })` and `sideGridPlacements(fieldId, { lineBets, orientation })`, and an options argument `lineGridPlacement(field, { orientation = "vertical" } = {})`. Each computes the existing vertical placement and, when `orientation === "horizontal"`, returns `rotate(placement, lineBets ? 8 : 5)`. `lineGridPlacement` always uses `N = 8`.
  - Keep the vertical code paths byte-for-byte in behaviour.
- [X] T006 In public/js/ui/tableau.js `buildTableau({ tableau, lineList }, { lineBets = false, orientation = DEFAULT_CONFIG.orientation } = {})`:
  - Import `DEFAULT_CONFIG` from `../domain/config.js`.
  - Add class `orientation` to `tableau` next to `french`.
  - Pass `{ lineBets, orientation }` to every placement helper. Pass `{ orientation }` to `lineGridPlacement`.
  - Update the header comment block to mention both orientations and research 004 R-302.

  Run `node --test`. Everything must be green, including T004, and every 003 vertical test must pass **unchanged apart from the `mount` default**.

**Checkpoint**: The config knows `orientation`, the geometry can rotate, and the vertical board is unchanged.

---

## Phase 3: User Story 1 - Tableau quer auf dem Breitbildschirm (Priority: P1) 🎯 MVP

**Goal**: With `orientation: "horizontal"` (the default) and lines off, the felt lies across the screen: 0 on the left, 1 at the bottom of the first column, Passe…D12 on top, Manque…D12 at the bottom, the columns on the right. It fits a 1366×698 window.

**Independent Test**: Load the app with the shipped config and lines off. Compare with spec US1 AC1–2, then enter 17 and check the same winners as vertical.

### Tests for User Story 1 ⚠️ write first, must fail

- [X] T007 [US1] In tests/render.integration.test.js, add a helper `const ORIENTATIONS = ["vertical", "horizontal"]`. Turn the tests "lineBets false builds the French board: 49 ids, 52 elements" and "lines off: no two tableau elements share a grid cell" into loops over both orientations, e.g. `for (const orientation of ORIENTATIONS) test(\`… (${orientation})\`, …)`. Each mounts with `{ lineBets: false, orientation }` and additionally asserts `els.tableau.classList.contains(orientation)`.
- [X] T008 [US1] In tests/render.integration.test.js, add a test "horizontal, lines off: placements follow the turned felt (FR-005–FR-007)". It mounts with `{ lineBets: false, orientation: "horizontal" }` and asserts these `row|column` literals from data-model § 3b:
  - `n0` → `2 / 5|1`
  - `n1` → `4|2`, `n2` → `3|2`, `n3` → `2|2`
  - `n34` → `4|13`, `n36` → `2|13`
  - `high` → `["1|2 / 4"]`, `low` → `["5|2 / 4"]`
  - `dozen3` → `["5|12 / 14", "1|12 / 14"]` (left side first, as in 003)
  - `col1` → `["4|14"]`, `col3` → `["2|14"]`

  Also assert that 17 gives the same six winners as vertical, via `render(setWinningNumber(createRound(), 17), …)` and the `winner` states.
- [X] T009 [US1] Run `node --test tests/render.integration.test.js` and confirm that T008 fails only if T005/T006 were done wrongly. If T008 already passes, the rotation is correct and the "red" phase is formally skipped (same deviation as in 003); note it in this task. *(Done: it passed at once, because `rotate` came in T005. Mutation check instead: a mirrored rotation made 2 tests fail. Restored.)*

### Implementation for User Story 1

- [X] T010 [US1] In public/js/main.js, pass `orientation: config.orientation` to `buildTableau` next to `lineBets`, and add `document.querySelector(".stage").classList.add(config.orientation);` after the existing `lines` toggle.
- [X] T011 [US1] In public/css/style.css, rename the 003 selectors to vertical-only:
  - `.tableau.french {` → `.tableau.french.vertical {`
  - `.tableau.french.lines {` → `.tableau.french.vertical.lines {`
  - `.stage.lines .board {` → `.stage.vertical.lines .board {`, and the same inside the portrait media query

  Then add the landscape template without lines:

  ```css
  .tableau.french.horizontal {
    grid-template-columns: minmax(3.5rem, 1.1fr) repeat(12, minmax(0, 1fr)) minmax(3.5rem, 1fr);
    grid-template-rows: minmax(var(--tap-min), 0.5fr) repeat(3, minmax(var(--row-min), 1fr)) minmax(var(--tap-min), 0.5fr);
  }
  ```

  Add a comment pointing to 004 R-303.
- [X] T012 [US1] Headless check using the 003 scratch measurement approach (Chromium at `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` over CDP, with `/config.js` intercepted to set `lineBets: false`). Measure at 1366×698 and 1366×768: no page scroll, number cell height ≥ 66 px (SC-002: +50 % over 44 px), and the shorter edge ≥ 36 px. Take a screenshot after 17 and compare it with spec US1 AC1–2. Record the numbers in specs/004-landscape-felt/quickstart.md § B.

**Checkpoint**: MVP. The landscape felt without line bets is usable and is the default.

---

## Phase 4: User Story 2 - Linienwetten im queren Tableau (Priority: P2)

**Goal**: With lines on in landscape, all 108 zones sit on the turned lines, the streets on the bottom edge, and the list below the board.

**Independent Test**: With landscape, lines on and 17 entered, the 11 winning zones surround the 17 per data-model § 3b, and the list shows the same 11 in 2 rows.

### Tests for User Story 2 ⚠️ write first

- [X] T013 [US2] In tests/render.integration.test.js:
  - Turn "lines on: no two tableau elements share a grid cell" into a loop over both orientations (157 ids, 268 elements, 160 tableau children each).
  - Turn "lines on: zones sit between exactly their numbers (SC-003)" into a loop over both orientations. For `horizontal`, convert every cell from `cellsOf` back to vertical coordinates with the inverse rotation (`(r, c)` → `(c, 9 − r)`) **before** building `numberAt` and reading the zone cell. The existing vertical assertions (street edge column 2, number columns 3/5/7) then apply unchanged.
  - Keep the literal "worked example" block vertical-only.
- [X] T014 [US2] In tests/render.integration.test.js, add a test "horizontal, lines on: the worked example around 17 (data-model § 3b)" that asserts these landscape literals:
  - `n17` → `4|13`
  - `split-16-17` → `5|13`, `split-17-18` → `3|13`, `split-14-17` → `4|12`, `split-17-20` → `4|14`
  - `street-16-17-18` → `7|13`, `sixline-13-14-15-16-17-18` → `7|12`
  - `basket-0-1-2-3` → `7|2`, `trio-0-1-2` → `5|2`, `split-0-3` → `2|2`
  - `n0` → `2 / 7|1`
  - both `tableau.classList.contains("horizontal")` and `contains("lines")`

  Run the tests.

### Implementation for User Story 2

- [X] T015 [US2] In public/css/style.css, rename the line-track variables everywhere (`:root`, the vertical lines template, the zone marker `min(...)`, the touch media query):
  - `--line-track-h` → `--line-track-street`
  - `--line-track-v` → `--line-track-inner`

  Keep the values: 12/24 px, and 14/32 px on touch. Rewrite the `:root` comment to say the names describe what a track separates, so they mean the same in both orientations (004 R-303). Afterwards `grep -n "line-track-[hv]" public/css/style.css` must return nothing.
- [X] T016 [US2] In public/css/style.css, add the landscape lines template:

  ```css
  .tableau.french.horizontal.lines {
    grid-template-columns:
      minmax(3.5rem, 1.1fr) var(--line-track-street)
      repeat(11, minmax(0, 1fr) var(--line-track-street))
      minmax(0, 1fr) minmax(3.5rem, 1fr);
    grid-template-rows:
      minmax(var(--tap-min), 0.5fr)
      minmax(var(--row-min), 1fr) var(--line-track-inner)
      minmax(var(--row-min), 1fr) var(--line-track-inner)
      minmax(var(--row-min), 1fr) var(--line-track-inner)
      minmax(var(--tap-min), 0.5fr);
    gap: 0;
  }
  ```

  Check that this makes 26 columns and 8 rows. Change the 003 rule `.tableau.lines .cell.outside:not(.colbtn) { margin: 1px 4px; }` to `.tableau.vertical.lines …`, and add `.tableau.horizontal.lines .cell.outside:not(.colbtn) { margin: 4px 1px; }`.
- [X] T017 [US2] In public/css/style.css, put the list below the board in landscape (R-304). Keep the 003 `.line-list` rule (2 columns) as the vertical default, and add:
  - `.stage.horizontal .line-list { grid-template-columns: repeat(6, minmax(0, 1fr)); min-height: calc(2 * var(--tap-min) + 4px); overflow: visible; flex: none; }`
  - `.stage.horizontal .line-list-hint { grid-row: auto; }` *(Not applied: the hint keeps `span 2` and fills the two reserved rows, which reads better.)*

  The `.board` stays a flex column in landscape, because only `.stage.vertical.lines .board` is a grid (T011).
- [X] T018 [US2] Run `node --test` (green). Headless check at 1366×698, 1366×768, 1920×1080 and 1180×820 touch, with lines on and landscape:
  - no page scroll at 1366×698 (SC-001)
  - number cell height ≥ 55 px (SC-002: +50 % over 37 px) and shorter edge ≥ 36 px
  - after 17, all 11 list entries visible without scrolling and both M12 positions lit

  Record the measurements in specs/004-landscape-felt/quickstart.md § B.

**Checkpoint**: Line bets work in both orientations.

---

## Phase 5: User Story 3 - Ausrichtung sicher einstellen (Priority: P2)

**Goal**: The host sets the orientation in `public/config.js`. It is documented, and a typo gives the landscape board plus a visible warning.

**Independent Test**: Try `"horizontal"`, `"vertical"`, `"quer"` and no key. Each gives the expected board, and only `"quer"` shows a warning.

- [X] T019 [US3] In public/config.js, add `orientation: "horizontal", // "horizontal" = Tableau quer (Breitbild), "vertical" = senkrecht wie am Tisch` as the last key, per specs/004-landscape-felt/contracts/config-contract.md "Resulting public/config.js". Do not change the other keys.
- [X] T020 [US3] Headless check with `/config.js` intercepted three times:
  - `orientation: "vertical"`: the board equals the 003 measurements (37 / 44 px at 1366×768), SC-006.
  - `orientation: "quer"`: the landscape board plus a visible `.warnings` box whose text contains `orientation`.
  - The key removed: the landscape board and no warning.

  Record the results in the quickstart.
- [X] T021 [P] [US3] In README.md:
  - Add `orientation: "horizontal", // or "vertical"` to the config example block.
  - Describe both orientations in the French-felt paragraph (landscape is the default for the widescreen laptop; vertical matches the view onto the table).
  - Replace the 003 fullscreen note ("only fits in fullscreen") with: in landscape the board fits a normal window, and vertical on 1366×768 with line bets needs ⛶.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 Run `node --test` (all green). Then confirm the rules are untouched: `git diff --exit-code HEAD -- public/js/domain/round.js public/js/domain/payout.js public/js/domain/wheel.js public/js/ui/render.js tests/reference-scenarios.test.js tests/wheel.test.js tests/lines.test.js tests/payout.test.js tests/round.test.js` must be empty.
- [X] T023 Check for leftovers: `grep -rn "line-track-[hv]\|\.tableau\.french {" public/` returns nothing, and `grep -n "orientation" public/js/main.js public/js/ui/tableau.js public/js/domain/config.js public/config.js` shows the expected plumbing only.
- [X] T024 Mark all completed tasks `[X]` in this file. Manual table check (quickstart § C) stays open for the host.

---

## Dependencies & Execution Order

```text
Setup (T001) → Foundational (T002–T006) → US1 (T007–T012) ─┬→ US2 (T013–T018)
                                                            └→ US3 (T019–T021)
                                                                   └→ Polish (T022–T024, after all)
```

- **T002 ∥ T004**: different test files, so they can be written in parallel. T003 depends on T002, T005 on T004, and T006 on T005.
- **US1** needs Foundational, because it uses the config default and `rotate`.
- **US2** needs US1 for the renamed vertical selectors (T011) and the horizontal class on the stage (T010).
- **US3** needs Foundational (the config key) and US1 (the wiring in `main.js`). It is independent of US2. T021 (README) can run in parallel with anything after T003.
- Within each story, tests come before implementation, then the headless measurement.
- Most tasks touch `tests/render.integration.test.js` or `public/css/style.css`, so tasks within a story are sequential.

## Parallel Example

```text
After Foundational:
  Stream A: T007 → T008 → T009 → T010 → T011 → T012 → T013 → … → T018   (geometry + CSS, one file set)
  Stream B: T019, T021                                                  (config.js, README; independent files)
  T020 needs T010 (stage class) and T019.
```

## Implementation Strategy

### MVP First (User Story 1)

1. T001–T006: the config key, `rotate`, options. Vertical is unchanged.
2. T007–T012: the landscape felt without line bets is the default.
3. **Stop and validate**: with `lineBets: false` the widescreen laptop already works.

### Incremental Delivery

1. US1 gives landscape without lines.
2. US2 adds line bets in landscape and renames the tracks.
3. US3 documents the setting and checks the fallback end to end.
4. Polish covers the rule-invariance diff and leftover greps.

## Notes

- This work goes on `003-french-layout`. The host decided not to create a separate branch.
- Never touch the domain rules. T022 checks it with `git diff`.
- If the host's felt check (003 T033) swaps sides, `LEFT_SIDE` / `RIGHT_SIDE` changes once and both orientations follow automatically.
