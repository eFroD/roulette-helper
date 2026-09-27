# Implementation Plan: Wetten auf den Linien

**Branch**: `002-line-bets` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-line-bets/spec.md`

## Summary

Add all 108 line bets of the European tableau (60 splits, 12 streets, 22 corners, 11 sixlines, 2 trios, the basket) to the Roulette Dealer Companion as an **experiment**. The dealer can reach each line two ways: by tapping a hit zone at its real position on the tableau, or through a list of only the winning lines. Line bets can be switched off with one config key, and the app then behaves exactly as it does now.

**Technical approach**: The line bets become 108 **generated** entries in the existing field catalogue (`kind: "line"`, with `type` and `numbers`). The round state machine and payout maths already handle any field with an `id`, a `ratio` and a `wins` predicate, so stakes, undo, clear, number change and totals work for lines without touching `round.js`. The one domain code change is inverting the base-stake condition in `unitFor`, so lines get the inside stake and not the outside stake.

**The decision that shapes the most code** ([R-103](./research.md)): with lines enabled, the number area of the CSS grid switches to an **interleaved track layout**. Thin line tracks replace the gaps between number cells. Each line bet is an ordinary grid item in exactly one thin grid cell, and the mapping is one-to-one. As a result, zones cannot overlap each other or the number cells, zones sit where the chip lies on the felt, and hit-zone size is one CSS variable (`--line-track`) to tune per device during the trial.

The selection list is built **once** and shown or hidden per render, not rebuilt ([R-104](./research.md)). Rebuilding it would drop the `click` after a long press and swallow the dealer's next tap.

## Technical Context

**Language/Version**: JavaScript ES2022 (native ES modules), HTML5, CSS3. No build step. Unchanged from 001.

**Primary Dependencies**: None at runtime. Node.js 20+ is used only for development, to run `node --test` (v24.14.1 on the dev host). Unchanged.

**Storage**: N/A. Round state is in memory only, and line stakes are no exception (FR-029). Configuration stays in `public/config.js`, which gains `lineBets`.

**Testing**: `node --test`. The current baseline is 61/61 passing. A new `tests/lines.test.js` covers catalogue, adjacency, brute-force winning sets for all 37 numbers, and line payouts. `wheel`, `payout`, `config`, `reference-scenarios` and `render.integration` tests are amended where the contracts say so. Layout, hit rate and timing are checked manually per the quickstart trial protocol.

**Target Platform**: Evergreen browsers. The primary device is a **laptop in landscape**, and the **tablet in landscape** is tested too (spec US5, option C). Served by nginx via Docker Compose over plain LAN HTTP. Unchanged.

**Project Type**: Single static single-page web app.

**Performance Goals**: The board grows from 49 to 157 fields and from 49 to 265 interactive elements. A render after each tap stays well inside one frame (< 16 ms). This is still not a real constraint. Interactive in under 3 s (001 SC-008) is unaffected, since the payload grows by a few KB.

**Constraints**:
- Zones and number cells must never overlap (FR-021). This is guaranteed by grid placement, not by pixel maths.
- Number and outside-bet targets must keep today's minimum sizes (≥ 56 px cells, ≥ 72 px outside, FR-026). The line tracks take space from the 4 px gaps and from the flexible `fr` tracks, never from these minimums. If that does not fit on a device, the tablet media query narrows `--line-track`, and the list is the fallback for those lines.
- With `lineBets: false`, the page must be structurally identical to the pre-feature build (FR-028).
- Every 001 constraint still holds: offline, no secure context, contrast ≥ 7:1, figures ≥ 24 px, total ≥ 40 px, no persistence.

**Scale/Scope**: 157 fields and 265 elements on one screen. Estimated +300 lines of source and +250 lines of tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: NO ACTIVE GATES. The constitution is not ratified.**

`.specify/memory/constitution.md` is still the unmodified scaffold, so the gate passes vacuously, as it did for 001. This plan keeps the two defaults that 001 recorded:

| Applied default | How this design honours it |
|---|---|
| **Simplicity / YAGNI** | No new modules in `domain/`, no new dependencies, no new event listeners. Lines reuse the catalogue, state machine, payout path and delegated click handler. The only new structure is a grid template variant and one list row. The runtime settings toggle for lines is deliberately deferred (R-106). |
| **Testability** | All new logic that can be wrong (geometry, adjacency, winning sets, stake class) sits in the pure domain module, or in a pure mapping function exercised by the existing fake-DOM integration test. SC-001 is asserted exhaustively (157 fields × 37 numbers), not by sampling. |

**Post-Phase 1 re-check**: Still passing. Phase 1 added no projects, no dependencies and no patterns needing justification. The only API change is the `buildTableau` return shape (id → element array), which is internal and covered by the integration test. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-line-bets/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: R-101 … R-107
├── data-model.md        # Phase 1: BetField extension, geometry mapping, states
├── quickstart.md        # Phase 1: automated checks, manual pass, trial protocol
├── contracts/
│   ├── domain-api.md    # Delta on 001 domain contract
│   ├── config-contract.md  # New key lineBets
│   └── ui-tableau.md    # buildTableau / render / events with zones and list
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

The existing layout is unchanged. Files touched:

```text
public/
├── config.js                 # + lineBets key, baseStakeNumber comment widened
├── index.html                # + <div id="line-list"> row in .board; settings label "Innenwetten"
├── css/style.css             # + .tableau.lines interleaved grid, .zone, .line-list, compact .result, [data-flash]
└── js/
    ├── domain/
    │   ├── wheel.js          # + generated LINE_FIELDS, LINE_TYPES; BET_FIELDS = numbers, lines, outside
    │   ├── payout.js         # unitFor: outside → outside stake, else → number stake
    │   ├── config.js         # + lineBets default and boolean rule
    │   └── round.js          # unchanged
    ├── ui/
    │   ├── tableau.js        # + options.lineBets, zone placement (data-model § 6), list build; Map<id, El[]>
    │   └── render.js         # iterate element arrays; list visibility + hint; compact results > 5
    └── main.js               # pass lineBets + lineList container; flash elements after addStake

tests/
├── lines.test.js             # NEW: catalogue, adjacency, exhaustive winners, line payouts, mixed undo
├── wheel.test.js             # amended: 157 fields; "6 winners" becomes "6 non-line winners"; zero winners
├── payout.test.js            # amended: unitFor for line fields
├── config.test.js            # amended: lineBets valid / invalid / "false" string
├── reference-scenarios.test.js  # + spec 002 reference scenarios 1–6
└── render.integration.test.js   # amended for element arrays; + lineBets off = 49, on = no overlap, list content
```

**Structure Decision**: Keep the single static app from 001. No new directories. The domain/UI split is preserved: geometry that decides *what wins* lives in `domain/wheel.js`, and geometry that decides *where a zone is drawn* lives in `ui/tableau.js`.

## Risks for the trial

| Risk | Where it shows | Mitigation already in the design |
|---|---|---|
| Corner and sixline zones too small on the tablet | SC-005 zone hit rate | The list is a first-class route. `--line-track` has its own tablet value and one retune is allowed per protocol. |
| Number cells feel cramped with line tracks | SC-006 regression > 10 % | The tracks replace gaps before squeezing `fr` tracks. If SC-006 fails, `lineBets: false` restores the old board exactly. |
| Many occupied fields overflow the results panel | SC-008, edge case "17 occupied" | Compact rows above 5 occupied fields, and the total is pinned. The residual worst case is documented in R-107 and is measured in trial step 5. |
| Zone taps before a number is entered confuse the dealer | US1 AC5 | Taps are ignored by the existing guard. The list row shows a hint. |

## Complexity Tracking

*No violations. Section intentionally empty.*
