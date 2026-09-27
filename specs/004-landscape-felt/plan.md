# Implementation Plan: Französisches Tableau quer

**Branch**: `003-french-layout` (host decision: 004 ships on the 003 branch) | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-landscape-felt/spec.md`

## Summary

Add a host setting `orientation: "horizontal" | "vertical"`, **defaulting to horizontal** (host decision, 2026-09-27).

- **Horizontal**: the French felt from 003 turned a quarter turn counter-clockwise. 0 is on the left, twelve columns of three follow with 1 at the bottom, Passe…D12 is the top bar, Manque…D12 the bottom bar, and the columns sit on the right.
- **Vertical**: exactly the 003 board.

Labels, the doubled dozens, line bets, the list and every rule are unchanged, with no La Partage and no En Prison.

**Technical approach**: The landscape board is **not a second layout**. It is the 003 placement passed through one pure rotation function (R-302). Every structural guarantee the 003 tests prove carries over by construction: no shared cell, and each zone between exactly its numbers. The tests are parametrised over both orientations. The config gains one key with the existing per-key fallback (R-301). CSS gains two grid templates, and the line list goes back below the board in landscape (R-303, R-304).

**Size outcome** (R-303, 1366×698 normal browser window): with lines on, number cells are about 61 × 100 px, against 153 × 37 px in vertical fullscreen. That is 2.7× the height and the same area, and it needs no fullscreen.

## Technical Context

**Language/Version**: JavaScript ES2022 (native ES modules), HTML5, CSS3. No build step. Unchanged.

**Primary Dependencies**: None at runtime. Node.js 20+ for `node --test`. Unchanged.

**Storage**: N/A. There is one new key in `public/config.js`, and nothing is persisted.

**Testing**: `node --test`, baseline **109/109**.
- `config.test.js`: orientation cases.
- `render.integration.test.js`: `rotate`, and the structural tests over both orientations plus landscape literals. The 003 vertical literals get an explicit `orientation: "vertical"`.
- Unmodified: `reference-scenarios.test.js`, `wheel.test.js`, `lines.test.js`, `payout.test.js`, `round.test.js`.
- Screen sizes are measured headless (quickstart § B).

**Target Platform**: The primary device is a widescreen laptop (1366×768 assumed as the floor) in a normal browser window. The tablet in landscape is still supported.

**Project Type**: Single static single-page web app.

**Performance Goals**: No change: 52 or 268 elements, one grid.

**Constraints**:
- Rules untouched (FR-010). `round.js`, `payout.js`, `wheel.js` and `render.js` are not edited.
- Vertical is byte-for-byte the 003 placement (FR-011).
- No page scroll at 1366×698 in horizontal, with or without lines (SC-001). Cells ≥ +50 % taller than vertical (SC-002), with the shorter edge ≥ 36 px (FR-012).
- An invalid `orientation` never blocks startup (FR-004).

**Scale/Scope**: Small. About 60 lines of source (rotate, option plumbing, config rule, CSS templates) and about 150 lines of tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: NO ACTIVE GATES. The constitution is not ratified** (unchanged scaffold, as for 001–003). The recorded defaults still apply:

| Applied default | How this design honours it |
|---|---|
| **Simplicity / YAGNI** | One pure `rotate` function instead of a second geometry. There is no runtime toggle and no auto-detection. The config key follows the existing rule pattern. |
| **Testability** | Rotation is unit-tested against hand-checked tables. All structural invariants run for both orientations, and the adjacency check is rotation-invariant, so it proves SC-004 without separate landscape logic. |

**Post-Phase 1 re-check**: Still passing. The interface changes are additive:
- `buildTableau` gets an `orientation` option.
- The helpers get an `orientation` option that defaults to vertical.
- `rotate` is new.

Renaming the two line-track CSS variables is internal. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-landscape-felt/
├── plan.md              # This file
├── spec.md              # Feature specification (with Clarifications: default horizontal)
├── research.md          # Phase 0: R-301 … R-306
├── data-model.md        # Phase 1: config key, rotation rule, reference placements
├── quickstart.md        # Phase 1: automated checks, screen checks, table check
├── contracts/
│   ├── config-contract.md   # orientation key, resolver rule, resulting config.js
│   └── ui-tableau.md        # buildTableau option, rotate, CSS hooks
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, NOT created here)
```

### Source Code (repository root)

```text
public/
├── config.js                 # + orientation: "horizontal" with German comment
├── css/style.css             # .tableau.french.{vertical,horizontal}[.lines] templates;
│                             # --line-track-h/v → --line-track-street/inner;
│                             # list below the board in horizontal
└── js/
    ├── domain/config.js      # + DEFAULT_CONFIG.orientation, + RULES entry (normalised)
    ├── ui/tableau.js         # + rotate(); orientation option on helpers and buildTableau
    └── main.js               # pass orientation; stage class
README.md                     # orientation key in the config block; landscape felt description

tests/
├── config.test.js            # + orientation default / valid / normalised / invalid
└── render.integration.test.js  # + rotate; structural tests over both orientations;
                                #   landscape literals; 003 literals pinned to vertical
```

**Structure Decision**: This is unchanged. The domain gains only a config rule. All geometry stays in `ui/tableau.js` and CSS, and the vertical geometry remains the single source.

## Risks

| Risk | Where it shows | Mitigation |
|---|---|---|
| The rotation is mirrored (clockwise), so 0 lands on the right | Landscape literal tests | Literal placements for `n0`, `n1`, `n3` and the bars pin the direction. |
| Width too tight on the tablet with lines in landscape (≈ 50 px columns) | Quickstart § B | Same as in 002: the list is the reliable route on touch. The shorter edge still clears 36 px. |
| Renaming CSS variables misses a use | Visual check | `grep` for the old names returns nothing (task-level check). |
| Existing installs expecting vertical get horizontal after update | Host sees a different board | Intended (host decision). `orientation: "vertical"` restores 003 exactly. README says so. |

## Complexity Tracking

*No violations. Section intentionally empty.*
