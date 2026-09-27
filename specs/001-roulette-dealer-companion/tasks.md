---

description: "Task list for Roulette Dealer Companion implementation"
---

# Tasks: Roulette Dealer Companion

**Input**: Design documents from `/specs/001-roulette-dealer-companion/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: INCLUDED. The spec declares its seven Reference Scenarios a binding acceptance proof ("verbindlicher Abnahmenachweis") and the plan commits to `node --test` against DOM-free domain modules. Test tasks are therefore first-class, not optional.

**Organization**: Grouped by user story so each is independently implementable, testable, and demoable.

**Status (2026-09-19)**: 54 of 61 tasks complete. All code, all automated tests (61 passing, zero dependencies installed) and the Docker deployment are done and verified. The 7 tasks left unchecked — T021, T032, T041, T046, T054, T059, T061 — are the on-device walk-throughs of quickstart scenarios B1–B16. They need a real tablet and a human's eyes on contrast, touch targets and gestures; headless Firefox could not allocate a framebuffer in this environment, so they were not faked. Everything they cover that *can* be checked mechanically is covered by `tests/render.integration.test.js`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: US1–US5, mapping to the spec's prioritised user stories

## Path Conventions

Static single-project layout per [plan.md](./plan.md): everything served lives under `public/`, tests under `tests/`, deployment files at the repository root. There is no `src/` and no backend.

**Standing constraint**: nothing under `public/js/domain/` may reference `document`, `window`, `navigator`, or timers. That purity is what lets the same files run under `node --test` with no shims. T053 enforces it mechanically.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository skeleton and the deployment shell, so the app is servable from the first commit.

- [X] T001 Create the directory structure from plan.md: `public/css/`, `public/icons/`, `public/js/domain/`, `public/js/ui/`, `public/js/platform/`, `tests/`
- [X] T002 [P] Create `docker-compose.yml` at the repository root: single `nginx:alpine` service, `./public` bind-mounted read-only at `/usr/share/nginx/html`, host port 8080, `./nginx.conf` mounted read-only (research R-008)
- [X] T003 [P] Create `nginx.conf` at the repository root: serve `.js` as `text/javascript` so ES module imports are not blocked, and send `Cache-Control: no-store` for `index.html` and `config.js` so host config edits take effect on a plain reload (research R-004, R-008)
- [X] T004 [P] Create `public/config.js` exactly as specified in [contracts/config-contract.md](./contracts/config-contract.md): a classic script assigning `window.ROULETTE_CONFIG` with the four documented keys at their defaults (10 / 5 / "€" / 10) and one explanatory comment per key
- [X] T005 [P] Rewrite `README.md`: edit-config-then-reload workflow, `docker compose up -d`, the tablet LAN URL, `node --test` for the suite, add-to-homescreen instructions, and the advice to also raise the tablet's own screen timeout as a backstop (research R-005, R-006)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The static reference data, page skeleton, and render loop every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create `public/index.html`: viewport meta, `apple-mobile-web-app-capable` meta, `<script src="./config.js">` **before** `<script type="module" src="./js/main.js">` (contract-mandated order), and empty containers for the number tableau, outside bets, per-field output, round total, history strip, and controls
- [X] T007 [P] Create `public/css/style.css` foundation: dark casino colour tokens (deep green / gold), a typography scale sized for 50 cm reading, minimum touch-target sizes (number cells ≥ 56 × 56 px, outside buttons ≥ 72 px tall, actions ≥ 64 px), and the tablet-landscape layout grid (FR-026, FR-027, FR-028, FR-032)
- [X] T008 [P] Implement `public/js/domain/wheel.js` per [contracts/domain-api.md](./contracts/domain-api.md): `RED_NUMBERS` (the 18 reds), `colourOf`, the 49-entry `BET_FIELDS` catalogue with `id`/`kind`/`label`/`ratio`/`colour`/`wins`, `fieldById`, `winningFieldIds`, `isWinner`. Every outside bet excludes 0 — the single rule that implements FR-005 (data-model §2)
- [X] T009 [P] Write `tests/wheel.test.js`: `BET_FIELDS.length === 49`; 18 red / 18 black / `colourOf(0) === "green"`; **exactly 6 winning fields for all 37 numbers 1–36**; exactly `["n0"]` for 0; `isWinner(id, null) === false`; out-of-range input returns `[]` without throwing
- [X] T010 [P] Implement `public/js/domain/config.js`: pure `resolveConfig(raw)` returning `{config, warnings}` — per-key validation and independent fallback to defaults per [contracts/config-contract.md](./contracts/config-contract.md). Pure so it is testable in Phase 6
- [X] T011 Implement the `public/js/domain/round.js` skeleton: the `Round` shape, `createRound()`, `occupiedFields()`, `needsConfirmation()`, and the immutability convention that every transition returns a new round (data-model §4)
- [X] T012 Implement `public/js/ui/tableau.js`: build the 37 number cells in 3×12-plus-zero tableau layout and the 12 outside-bet buttons once at startup from `BET_FIELDS`, in catalogue order, with `data-field-id` attributes for event delegation (FR-001, FR-002)
- [X] T013 Implement the `public/js/ui/render.js` skeleton: a single `render(round, config)` entry point that is the only writer to the DOM, called after every action so displayed figures can never drift from state
- [X] T014 Implement `public/js/main.js` bootstrap: read `window.ROULETTE_CONFIG`, pass it through `resolveConfig`, build the tableau, hold the current round, and wire one delegated tap handler that dispatches actions and re-renders

**Checkpoint**: The board renders and the app is servable. User story work can now begin.

---

## Phase 3: User Story 1 - Gewinnerfelder nach dem Wurf erkennen (Priority: P1) 🎯 MVP

**Goal**: The dealer enters the fallen number and instantly sees exactly which fields win; every losing field is visibly locked and inert.

**Independent Test**: Enter a number, confirm precisely the right fields are active and everything else is unusable. Delivers standalone value as a "what wins on this number?" display even before any arithmetic exists.

### Tests for User Story 1

- [X] T015 [P] [US1] Write `tests/round.test.js`: `createRound()` starts in `awaiting-number` with empty stakes; `setWinningNumber` transitions to `collecting`; the invariant that `stakes` is empty while `winningNumber` is null; guard violations return an unchanged round rather than throwing; the input round is never mutated
- [X] T016 [P] [US1] Write `tests/reference-scenarios.test.js` covering spec scenarios 1 and 2, named as in spec.md: number 17 yields exactly `n17`, `black`, `odd`, `low`, `dozen2`, `col2`; number 0 yields exactly `n0` and no outside bet

### Implementation for User Story 1

- [X] T017 [US1] Add `setWinningNumber(round, n)` to `public/js/domain/round.js`: guarded on `status === "awaiting-number"`, sets the number, moves to `collecting`, leaves the undo log empty (FR-003, FR-004)
- [X] T018 [US1] Extend `public/js/ui/render.js` to apply the four field states from `winningFieldIds`: neutral, winner, loser, occupied. Losing fields get `pointer-events: none` **and** a disabled attribute so a lost bet is structurally unreachable, not merely styled as such (FR-006, FR-029)
- [X] T019 [US1] Extend the delegated handler in `public/js/main.js`: a tap on a number cell while `awaiting-number` sets the winning number and re-renders; taps on locked fields are silently ignored (FR-007, edge case)
- [X] T020 [P] [US1] Add the field-state visuals to `public/css/style.css`: true roulette colours on numbers (red/black/green), a clear winner highlight, and an unmistakably greyed loser state that reads correctly at party lighting (FR-002, FR-029)
- [ ] T021 [US1] Walk quickstart scenarios B1–B4 on the tablet: nothing enterable before a number, 17 lights exactly six fields, taps on greyed fields do nothing, 0 locks every outside bet

**Checkpoint**: US1 is fully functional and demoable on its own.

---

## Phase 4: User Story 2 - Einsätze erfassen und Auszahlung ablesen (Priority: P2)

**Goal**: Tap each winning field once per base stake lying on it; read stake, win, total, and per-chip figures live, plus the round total the dealer draws from the bank.

**Independent Test**: With a winning number entered, tap known counts onto known fields and check every figure against the odds table.

### Tests for User Story 2

- [X] T022 [P] [US2] Write `tests/payout.test.js`: `stake = taps × unit`, `win = stake × ratio`, `total = stake + win`, `perChip = unit × ratio`; zero taps yields all-zero figures; `roundTotals([])` returns `{0,0,0}`; integer stakes in yields exact integers out for all three field ratios
- [X] T023 [P] [US2] Assert in `tests/payout.test.js` that **no division occurs in the money path** — `perChip` is verified as `unit × ratio` against a case where `win / taps` would be lossy, pinning research decision R-007
- [X] T024 [P] [US2] Extend `tests/reference-scenarios.test.js` with spec scenarios 3, 4, 5 and their pinned values from [contracts/domain-api.md](./contracts/domain-api.md): number 2 taps → 10/350/360/175; red 4 taps → 40/40/80/10; dozen 3 taps → 30/60/90/20
- [X] T025 [P] [US2] Extend `tests/round.test.js` for `addStake` guards: staking a losing field, an unknown field id, or any field before a winning number exists each returns an unchanged round

### Implementation for User Story 2

- [X] T026 [US2] Implement `public/js/domain/payout.js`: `unitFor`, `resultFor`, `roundTotals` per the contract. Products only — never `win / taps` (research R-007, data-model §5)
- [X] T027 [US2] Add `addStake(round, fieldId)` to `public/js/domain/round.js`: increments only when the field wins the current number, records an undo entry, and keeps the invariant that a losing field is unrepresentable in `stakes` (FR-008)
- [X] T028 [US2] Extend `public/js/ui/render.js` with per-field output: tap count, stake, win, total, and the per-chip line, derived fresh on every render and shown only for fields with at least one tap (FR-010, FR-012, FR-013)
- [X] T029 [US2] Add the prominent round-total row to `public/js/ui/render.js`: the sum of all field totals, i.e. the chips to take from the bank, reading 0 for an empty round (FR-014)
- [X] T030 [US2] Extend the handler in `public/js/main.js`: taps on winning fields while `collecting` add stakes and re-render; apply the configured currency symbol as a plain suffix with no locale formatting (FR-015, FR-016)
- [X] T031 [P] [US2] Style the occupied state and figure typography in `public/css/style.css`: payout figures ≥ 24 px, round total ≥ 40 px and visually dominant, contrast ≥ 7:1 (FR-028, SC-007)
- [ ] T032 [US2] Walk quickstart scenarios B5, B6, B14: per-field figures appear correctly, the total equals the sum of fields, everything legible from 50 cm at party lighting

**Checkpoint**: US1 and US2 both work independently. The app now delivers its core promise.

---

## Phase 5: User Story 3 - Fehler korrigieren und die nächste Runde starten (Priority: P3)

**Goal**: Every mistyped tap, wrong field, and misread number is recoverable without restarting the round; the round resets deliberately, never accidentally.

**Independent Test**: Deliberately make each class of error, correct it, and confirm state matches the expected result.

### Tests for User Story 3

- [X] T033 [P] [US3] Extend `tests/round.test.js`: `undo` reverses exactly one tap and never a whole field; a `clearField` entry restores the full prior count as a single undo step; `clearField` touches no other field; `undo` on an empty log is a no-op; `setWinningNumber` and `changeWinningNumber` both leave the undo log empty
- [X] T034 [P] [US3] Extend `tests/reference-scenarios.test.js` with spec scenarios 6 and 7: three taps on red then one undo leaves 2 taps at 20/20/40; `needsConfirmation` is true with stakes present, and after `changeWinningNumber` stakes are empty and winners match the new number
- [X] T035 [P] [US3] Assert in `tests/round.test.js` that `changeWinningNumber` and `nextRound` execute unconditionally — confirmation is the caller's responsibility, so the domain stays synchronous and needs no prompt stubbing (data-model §4)

### Implementation for User Story 3

- [X] T036 [US3] Add the undo log, `undo(round)`, and `clearField(round, fieldId)` to `public/js/domain/round.js`: `addStake` pushes `{type:"stake", fieldId}`, `clearField` pushes `{type:"clear", fieldId, count}` so it restores in full (FR-017, FR-018)
- [X] T037 [US3] Add `changeWinningNumber(round, n)` and `nextRound(round)` to `public/js/domain/round.js`: both discard stakes and the undo log; `nextRound` returns a fresh round (FR-019, FR-020, FR-021)
- [X] T038 [US3] Implement `public/js/ui/dialogs.js`: confirmation prompts for changing the winning number and for ending the round, shown only when `needsConfirmation` is true, with cancel leaving state untouched (FR-020, FR-022)
- [X] T039 [US3] Wire the correction controls in `public/js/main.js`: a global undo button, a per-field long-press or "×" to clear one field, winning-number correction, and "Nächste Runde" — each routed through `dialogs.js` where confirmation is required
- [X] T040 [P] [US3] Style the controls in `public/css/style.css`: place "Nächste Runde" set apart from the betting surface so it cannot be brushed accidentally, and give each occupied field a clear clear-field affordance (FR-022)
- [ ] T041 [US3] Walk quickstart scenarios B7–B10: single-field clear, undo on an empty round, number change with cancel and with confirm, deliberate round end

**Checkpoint**: All three core stories work independently. This is a complete, party-ready tool.

---

## Phase 6: User Story 4 - Grundeinsätze vor der Party festlegen (Priority: P4)

**Goal**: The host sets base stakes and currency symbol before the party and can trust that a typo never yields a blank screen.

**Independent Test**: Change values and confirm they flow through; introduce an invalid value and confirm the app still starts on defaults with a named warning.

### Tests for User Story 4

- [X] T042 [P] [US4] Write `tests/config.test.js` against `resolveConfig`: each key validated per the contract; each invalid value falls back **independently** while valid siblings survive; a missing config, an empty object, and unknown extra keys all yield a working config; warnings name the offending key

### Implementation for User Story 4

- [X] T043 [US4] Harden `resolveConfig` in `public/js/domain/config.js` to satisfy every guarantee in [contracts/config-contract.md](./contracts/config-contract.md), including the rule that invalid configuration never blocks startup
- [X] T044 [US4] Add the dismissible startup warning banner to `public/js/main.js`, naming each key that fell back to its default (contract guarantee 2)
- [X] T045 [US4] Implement the optional runtime settings panel for the two base stakes (FR-024): re-derives all displayed figures from the existing tap counts without altering them, and persists nothing anywhere (FR-030)
- [ ] T046 [US4] Walk quickstart scenarios B12 and B13: an edited base stake takes effect on plain reload with no rebuild; a deliberately broken value still starts the app on defaults with a warning

**Checkpoint**: The host can configure the app safely without developer help.

---

## Phase 7: User Story 5 - Casino-Atmosphäre und Dauerbetrieb am Tablet (Priority: P5)

**Goal**: The app feels like a casino table rather than a calculator, and survives a whole evening without the tablet sleeping.

**Independent Test**: Play several rounds, check the history strip, leave the tablet idle, and confirm the screen stays awake with state intact.

### Tests for User Story 5

- [X] T047 [P] [US5] Write `tests/history.test.js` against the pure `pushHistory`: capped at `historyLength`, oldest dropped on overflow, newest-first ordering, nothing appended when a round ended without a winning number, and `historyLength: 0` disables it

### Implementation for User Story 5

- [X] T048 [P] [US5] Implement pure `pushHistory(list, n, max)` in `public/js/domain/history.js` — bounded append with no DOM access so it stays unit-testable
- [X] T049 [US5] Implement `public/js/ui/history.js`: render the strip with each number in its field colour derived through `wheel.js`, and append on `nextRound` only when a number was actually entered (FR-031)
- [X] T050 [P] [US5] Implement `public/js/platform/nosleep.js` per research R-005: use `navigator.wakeLock` when present, otherwise a muted looping inline video from a data URI. Acquire on the **first user tap** (a gesture is mandatory), re-acquire on `visibilitychange` when the page becomes visible, never request while hidden, and fail silently since FR-033 is a SOLLTE
- [X] T051 [P] [US5] Implement `public/js/platform/fullscreen.js` and its toggle button: the Fullscreen API is not secure-context-gated so it works on the real LAN-HTTP deployment, but it does need a user gesture — hence an explicit button, never an automatic call (research R-006)
- [X] T052 [P] [US5] Create `public/manifest.webmanifest` and the two icons in `public/icons/`, and link them from `public/index.html` for iOS add-to-home-screen (FR-034, research R-006)
- [X] T053 [P] [US5] Complete the dark casino theme in `public/css/style.css`: green/gold palette finished, contrast verified ≥ 7:1 throughout, high contrast prioritised over elegance (FR-032)
- [ ] T054 [US5] Walk quickstart scenarios B11, B15, B16: history strip correct and capped, screen stays awake through 10+ idle minutes with state intact, fullscreen toggle works

**Checkpoint**: All five user stories complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T055 [P] Add a domain-purity guard: confirm no `document`, `window`, `navigator`, or timer reference appears anywhere under `public/js/domain/`, and record the check in `README.md` so the boundary survives future edits
- [X] T056 Run the full suite with `node --test` and confirm it passes with **zero installed dependencies** — no `npm install`, no `node_modules`
- [X] T057 Verify all seven Reference Scenarios pass as individually named tests matching the numbering in [spec.md](./spec.md)
- [X] T058 [P] Run the offline validation from quickstart §C: C1 (every function works with the network pulled) and C2 (zero external requests across a full round in DevTools); confirm C3 is understood as an accepted limit, not a defect
- [ ] T059 [P] Audit accessibility and ergonomics against the plan's constraints: touch-target minimums, figure sizes, and contrast ratios on the actual tablet (FR-027, FR-028, SC-007)
- [X] T060 Verify deployment on a clean machine: `docker compose up -d` serves a working app with no build step, and editing `public/config.js` plus a reload changes behaviour with no rebuild and no cache fight
- [ ] T061 Complete the quickstart Definition of Done checklist in [quickstart.md](./quickstart.md) and record any deviations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T002–T005 all follow T001.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks every user story.**
- **User Stories (Phases 3–7)**: All depend only on Phase 2. In priority order P1 → P5, or in parallel across people.
- **Polish (Phase 8)**: Depends on whichever stories are in scope.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. No dependency on other stories. **The MVP.**
- **US2 (P2)**: Depends on Foundational. Needs a winning number to exist, so US1 is its natural predecessor in a single-developer sequence; its domain and test work is independent.
- **US3 (P3)**: Depends on Foundational. Corrections presuppose stakes, so it follows US2 in practice.
- **US4 (P4)**: Depends only on Foundational — `resolveConfig` is already in place from T010. **Fully parallel with US1–US3.**
- **US5 (P5)**: Depends only on Foundational, except T049 which reads `nextRound` from US3. Wake lock, fullscreen, manifest, and theming are **fully parallel with everything**.

### Within Each User Story

- Tests first — write them, watch them fail, then implement
- Domain (`domain/`) before UI (`ui/`) before wiring (`main.js`)
- CSS tasks are marked [P] throughout: they touch a different file from the logic
- Manual quickstart walk-through last, as the story's closing gate

### Parallel Opportunities

- **Phase 1**: T002–T005 all in parallel after T001
- **Phase 2**: T007, T008, T009, T010 in parallel — CSS, wheel, its tests, and config touch four different files. T011 → T012 → T013 → T014 then run in sequence.
- **Phase 3**: T015 and T016 in parallel; T020 in parallel with T017–T019
- **Phase 4**: T022, T023, T024, T025 all in parallel; T031 in parallel with T026–T030
- **Phase 5**: T033, T034, T035 in parallel; T040 in parallel with T036–T039
- **Phase 7**: T047, T048, T050, T051, T052, T053 nearly all in parallel — the platform, manifest, and theming tasks share no files
- **Across stories**: US4 and most of US5 can be built alongside US1–US3 by a second person

---

## Parallel Example: Phase 2 Foundational

```text
# After T006 (index.html) lands, launch four independent tasks together:
T007  public/css/style.css           — design tokens, typography, touch targets
T008  public/js/domain/wheel.js      — the 49-field catalogue
T009  tests/wheel.test.js            — invariants incl. "exactly 6 winners for all 37 numbers"
T010  public/js/domain/config.js     — pure resolveConfig

# Then sequentially, each building on the last:
T011  domain/round.js skeleton → T012 ui/tableau.js → T013 ui/render.js → T014 main.js
```

## Parallel Example: User Story 2

```text
# All four test tasks first, in parallel — separate files, no shared state:
T022  tests/payout.test.js            — the four formulas
T023  tests/payout.test.js            — the no-division assertion (R-007)
T024  tests/reference-scenarios.test.js — spec scenarios 3, 4, 5
T025  tests/round.test.js             — addStake guards

# Then implementation, with T031 (CSS) running alongside T026–T030
```

---

## Implementation Strategy

### MVP scope

**Phases 1 + 2 + 3 (T001–T021, 21 tasks).** That delivers a working tool: the dealer enters the fallen number and sees exactly which fields win, with every loser locked. No arithmetic yet, but it already removes the two things an inexperienced dealer gets wrong most often — *is 17 red or black* and *which column is it in* — and it structurally prevents paying out a losing bet.

### Incremental delivery

1. **T001–T021** → MVP: winner recognition. Demoable at the table.
2. **+ Phase 4 (T022–T032)** → the core promise: payouts computed, including the per-chip figure that lets one dealer pay several players on one field.
3. **+ Phase 5 (T033–T041)** → party-ready: every mistake recoverable, rounds reset deliberately.
4. **+ Phase 6 (T042–T046)** → the host configures it safely without a developer.
5. **+ Phase 7 (T047–T054)** → casino feel and all-evening tablet operation.
6. **+ Phase 8 (T055–T061)** → validated end to end.

Stop after step 3 and you still have a genuinely useful tool. Steps 4–6 are comfort and polish, which is exactly how the spec prioritised them.

### Two things to get right early

- **Keep `domain/` pure from the first line.** Every test task in this plan depends on it, and retrofitting purity after the UI has grown into the logic is the one refactor that would hurt. T055 guards it, but the discipline belongs in T008.
- **Never divide in the money path.** `perChip` is `unit × ratio`, not `win ÷ taps` (T023 pins this). Both give the same answer today; only one keeps every figure an exact integer if a fractional base stake is ever configured.
