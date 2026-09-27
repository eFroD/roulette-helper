# Implementation Plan: Französisches Tableau

**Branch**: `003-french-layout` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-french-layout/spec.md`

## Summary

Replace the horizontal international tableau with the **French felt** that is on the host's table:

- the 0 at the top and twelve rows of three below it
- Manque/Pair/Rouge on the left and Passe/Impair/Noir on the right
- P12/M12/D12 on **both** sides, as one bet each
- the columns at the bottom
- French terms on the felt, and French plus German in the result list

Line-bet zones move with the numbers.

**Only the layout changes; the rules stay.** On 0 every outside bet still loses in full. There is no La Partage (half stake back) and no En Prison, although both are common on French tables (host instruction, spec FR-015). `round.js`, `payout.js`, `config.js` and every `wins` predicate are untouched. A snapshot test over all 37 numbers guards that.

**Technical approach**: The whole felt becomes **one explicitly placed CSS grid** (R-201). It is the transpose of the 002 interleaved grid: 5×14 tracks without lines and 8×26 with lines (R-202). Placement lives in pure functions in `ui/tableau.js`, so overlap and adjacency are asserted in the existing fake-DOM test. The doubled dozens reuse 002's "one id, many elements" map, so `render` and the event handlers need **no change** (R-206). Labels get one optional catalogue property, `feltLabel` (R-204).

**The decision that shapes the most CSS** (R-203): the vertical board is **height-bound**. At 1366×768 with line bets, rows come out at about 37 px. The host chose "no scrolling, lower but wider cells" (spec FR-014 as clarified), so rows are `minmax(36px, 1fr)`, the horizontal line tracks get thin, the vertical ones wide, and the selection list moves beside the board (R-205).

## Technical Context

**Language/Version**: JavaScript ES2022 (native ES modules), HTML5, CSS3. No build step. Unchanged.

**Primary Dependencies**: None at runtime. Node.js 20+ for `node --test` only. Unchanged.

**Storage**: N/A. Nothing is persisted, and there is no new config key (FR-013).

**Testing**: `node --test`, baseline **100/100**. Amended: `wheel.test.js` (labels, a winners snapshot for 0–36) and `render.integration.test.js` (new containers, 52/268 elements, full-grid overlap, geometry, doubled dozens). `reference-scenarios.test.js` must pass **unmodified**. Layout, felt match and heights are manual (quickstart B/C).

**Target Platform**: Evergreen browsers. The primary device is a laptop in landscape (1366×768 assumed as the floor, fullscreen), and the tablet 1180×820 in landscape is also supported. LAN HTTP via nginx/Docker. Unchanged.

**Project Type**: Single static single-page web app.

**Performance Goals**: The element count rises by 3 (the second dozen set): 52 without lines and 268 with. Render stays far below one frame. No change.

**Constraints**:
- Rules untouched: no La Partage, no En Prison, and the zero rule unchanged (FR-015, FR-011).
- No overlap of any two tableau elements, guaranteed by one-to-one grid placement (FR-009).
- Number cells: shorter edge ≥ 36 px and tap area ≥ the 002 area. No page scroll on the laptop in fullscreen, with or without lines. On the tablet, at least with lines off (FR-014, SC-006).
- The 001 constraints still hold: offline, contrast ≥ 7:1, figures ≥ 24 px, total ≥ 40 px, and the German interface outside the felt (FR-008).

**Scale/Scope**: Small. About 120 lines of source change (tableau geometry, CSS templates, 9 labels) and about 120 lines of tests. No new files in `public/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: NO ACTIVE GATES. The constitution is not ratified.** `.specify/memory/constitution.md` is still the unmodified scaffold, as for 001 and 002. The two defaults recorded there still apply:

| Applied default | How this design honours it |
|---|---|
| **Simplicity / YAGNI** | No new modules, dependencies, listeners or config keys, and no layout switch. The doubled dozens reuse the existing element-array map. Two containers are *removed*. |
| **Testability** | All geometry is pure mapping functions asserted in the fake-DOM test: overlap over the full grid, adjacency for all 108 zones, and exact placements. Rule invariance is asserted with a 37-number snapshot, not by sampling. |

**Post-Phase 1 re-check**: Still passing. The only interface change is the `buildTableau` containers argument (`dozens` / `outside` dropped). It is internal, with one call site and one test helper. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-french-layout/
├── plan.md              # This file
├── spec.md              # Feature specification (with Clarifications)
├── research.md          # Phase 0: R-201 … R-208
├── data-model.md        # Phase 1: labels, positions, full geometry tables
├── quickstart.md        # Phase 1: automated checks, felt check, height table, speed test
├── contracts/
│   ├── domain-api.md    # label / feltLabel delta; rules unchanged
│   └── ui-tableau.md    # buildTableau containers, placement helpers, index.html
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, NOT created here)
```

### Source Code (repository root)

The existing layout is unchanged. Files touched:

```text
public/
├── index.html                # − #dozens, − #outside
├── css/style.css             # .tableau.french 5×14 / .french.lines 8×26 templates; --row-min;
│                             # flipped --line-track-v/h values; .board side-by-side with lines;
│                             # Rouge/Noir diamonds; − .betrow rules; zone dot sized by the thin track
├── js/
│   ├── domain/wheel.js       # 9 outside fields: new label + feltLabel (ids, predicates unchanged)
│   ├── ui/tableau.js         # one grid, explicit placement both modes, dozens ×2, feltLabel;
│   │                         # numberGridPlacement / sideGridPlacements / lineGridPlacement transposed
│   ├── ui/render.js          # unchanged
│   └── main.js               # buildTableau call without dozens/outside
README.md                     # "Layout of the felt" note; ⛶ recommended on 1366×768 with lines

tests/
├── wheel.test.js             # + labels/feltLabel; + winners snapshot 0–36
├── render.integration.test.js  # containers; 52/268; full-grid overlap; geometry; dozens ×2
└── reference-scenarios.test.js # UNCHANGED, must stay green
```

**Structure Decision**: Keep the single static app. The domain/UI split holds: *what wins* stays in `domain/wheel.js` and is not touched beyond labels, and *where it is drawn* lives entirely in `ui/tableau.js` and CSS.

## Risks

| Risk | Where it shows | Mitigation in the design |
|---|---|---|
| The host's felt differs in detail (sides swapped, streets on the right edge) | Felt check M1/M2 | Side lists and the E column are single constants in `tableau.js`, so a swap is a one-line change. |
| Rows too low at 1366×768 with lines when not in fullscreen (≈ 31 px) | Quickstart C | ⛶ in the README. The rows still have 1.7× the old area, and the list offers 56 px targets for lines. |
| P12/M12/D12 beside rows 19–36 is misread as "belongs to those numbers" | Speed test D | Identical to the felt, which is the point of the feature. Watch it in the trial. |
| Hidden dependency on `#dozens` / `#outside` | Tests, console count check | `buildTableau` already logs a count mismatch, and the integration test asserts 52/268. |

## Complexity Tracking

*No violations. Section intentionally empty.*
