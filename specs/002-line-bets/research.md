# Research: Wetten auf den Linien

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Builds on the decisions in [001 research](../001-roulette-dealer-companion/research.md), all of which still hold: zero dependencies, no build step, pure domain modules tested under `node --test`, plain HTTP on the LAN, no persistence. This document records only what the line bets add.

There were no `NEEDS CLARIFICATION` items left in the Technical Context. The spec's one open question (how the dealer reaches a line bet) was answered before planning: **both** hit zones on the tableau **and** a selection list (spec FR-020, option C).

---

## R-101: How line bets enter the domain model

**Decision**: Line bets become ordinary entries in the existing `BET_FIELDS` catalogue, with a new `kind: "line"`, a `type` (`split` | `street` | `trio` | `corner` | `basket` | `sixline`), and an explicit `numbers` array. `wins(n)` is `numbers.includes(n)`. The 108 entries are **generated** from the physical grid, not hand-written.

**Rationale**:
- `round.js` and `payout.js` work on any field that has an `id`, a `ratio` and a `wins` predicate. Adding a field kind means `addStake`, `undo`, `clearField`, `occupiedFields`, `resultFor` and `roundTotals` handle line bets **without any change**. That is most of FR-010 and FR-013 to FR-019 for free, with the existing tests as a safety net.
- Writing 108 entries by hand invites exactly the error FR-003 forbids (for example a split 3/4, which looks adjacent in a list but is not on the table). Generating them from the street structure (`street k` = `3k+1 … 3k+3`) makes those errors impossible to express.
- A brute-force check during planning confirmed the generator: 60 splits, 12 streets, 22 corners, 11 sixlines, 2 trios, 1 basket = 108. Winning line fields per number range from 5 (34 and 36, the corners of the last street) to 11 (every middle-row number from 2 to 32). Zero has 6.

**Alternatives considered**:
- *A separate `LINE_FIELDS` catalogue with its own payout path*: this would duplicate the state machine's handling of stakes and undo. FR-016 requires undo to cover all fields as one chronological sequence. Two catalogues make that a coordination problem. One catalogue makes it automatic.
- *Deriving winners at runtime from adjacency instead of storing `numbers`*: this is less code, but then the list labels (FR-004, FR-020b) need the numbers anyway.

---

## R-102: Which base stake applies

**Decision**: `unitFor` changes from "number → number stake, everything else → outside stake" to "**outside → outside stake, everything else → number stake**". The config key stays `baseStakeNumber`. Only its comment and the settings label change to "Innenwetten (Zahlen & Linien)".

**Rationale**: FR-012. The existing condition `kind === "number"` would silently pay line bets at the outside stake. That is a correctness bug waiting to happen, so the condition is inverted to name the smaller, closed set. Renaming the key would break every host's existing `config.js` (config-contract: renaming is a breaking change).

**Alternatives considered**: a third key `baseStakeLine`. This is explicitly out of scope in the spec (no separate base stakes per line type).

---

## R-103: Placing hit zones on the tableau without overlap

This is the decision that shapes the most code.

**Decision**: When line bets are enabled, the number area of the CSS grid switches to an **interleaved track layout**. Thin "line tracks" sit between the number tracks, where the 4 px gaps are today. Every line bet is a normal grid item in exactly one thin cell:

```text
columns:  0 | v0 | c1 | v1 | c2 | … | v11 | c12 | gap | 2:1
rows:     r3            (3, 6, … 36)
          h32           line between top and middle row
          r2            (2, 5, … 35)
          h21           line between middle and bottom row
          r1            (1, 4, … 34)
          hb            bottom edge: streets, sixlines, basket
```

| Line bet | Row track | Column track | Count |
|---|---|---|---|
| Split within a street (n / n+1) | `h32` or `h21` | `c1…c12` | 24 |
| Split across streets (n / n+3) | `r1…r3` | `v1…v11` | 33 |
| Split with zero (0/1, 0/2, 0/3) | `r1…r3` | `v0` | 3 |
| Corner | `h32` or `h21` | `v1…v11` | 22 |
| Trio (0-1-2, 0-2-3) | `h21`, `h32` | `v0` | 2 |
| Street | `hb` | `c1…c12` | 12 |
| Sixline | `hb` | `v1…v11` | 11 |
| Basket (0-1-2-3) | `hb` | `v0` | 1 |

The mapping is a bijection. **Every thin cell in the grid holds exactly one line bet, and every line bet has exactly one thin cell** (the only unused thin cells are `hb` under the zero and under the 2:1 column). Overlap is therefore impossible by construction, which satisfies FR-021 structurally rather than through careful pixel maths. Each zone also sits where the chip lies on the real felt (FR-020a).

The width of the thin tracks is one CSS custom property (`--line-track`). That is the knob for the trial: a wider track makes lines easier to hit but squeezes the numbers. It is tuned per device during the trial and gets its own media-query value for the tablet.

**Rationale**:
- Grid items cannot overlap unless placed on purpose. Absolutely positioned overlays can overlap, and the overlap depends on computed pixel sizes, which is how you get a zone that steals taps from a number cell (FR-026).
- It rescales with the viewport for free. An overlay would have to recompute positions on every resize and orientation change.
- The existing field states, the `disabled` attribute and `pointer-events: none` on losers apply to zones unchanged.

**Alternatives considered**:
- *Absolute overlay positioned with `calc()` from the grid's `fr` tracks*: fragile, because `1.15fr` / `0.95fr` tracks plus gaps make percentages inexact. It also needs resize handling, and overlap is possible.
- *Invisible hit areas larger than the visible zone, reaching into the number cells*: this would contradict FR-021 and FR-026 directly.
- *Tap-a-number-then-pick-a-neighbour interaction*: fewer targets, but it adds a mode, breaks the "tap where the chip lies" model, and the selection list already covers the precision fallback.

### R-103 addendum: measured during implementation (2026-09-27)

A single `--line-track: 22px` made the number cells far too narrow: 41 px at 1366×768 and 23 px at 1180×820, against a 56 px minimum. The original build measured 62 px and 48 px at those sizes. The cells are 100–200 px **tall**, so width is the scarce axis and height is plentiful. Changes:

- The track is split into `--line-track-v: 14px` (vertical, costs width) and `--line-track-h: 24px` (horizontal, costs height). On touch devices the horizontal track is 28px.
- With lines on, the results panel narrows from `minmax(300px, 24rem)` to `minmax(280px, 20rem)`, and the cell inset drops from 4 px gaps to a 1 px margin.

Smallest number-cell width, original → with lines:

| Viewport | Original | Lines on |
|---|---|---|
| 1366×768 | 62 | 56 |
| 1440×900 | 68 | 61 |
| 1536×864 | 75 | 69 |
| 1920×1080 | 102 | 96 |
| 1180×820 (tablet) | 48 | 42 |
| 1024×768 (tablet) | 36 | 30 |

**FR-026 ("at least as easy to hit as before") is not fully met.** Cells are consistently about 6 px narrower. Twelve line tracks must take width from somewhere, so this is the price of the feature, not a tuning miss. From 1366 px up, cells meet the absolute 56 px minimum. The trial (SC-006) decides whether the difference matters in play, and `lineBets: false` restores the original widths exactly. On touch the zones are 14 px wide: they mark the position, and the list is the reliable route, as the spec anticipates.

---

## R-104: The selection list: built once, shown selectively

**Decision**: The list lives in a new board row below the outside bets. `buildTableau` creates **all 108 list buttons once** at startup, in the list's fixed order. `render` only toggles `hidden` (winners are visible, everything else is hidden) and applies the same state and tap-badge logic as the tableau. Every list button carries the same `data-field-id` as its zone, so the existing delegated click and long-press handler covers both routes with **no new event code**.

**Rationale**:
- FR-020a (the same effect on both routes) follows directly: both elements resolve to the same `fieldId` and call the same `addStake`. There is no second code path that could drift.
- **Rebuilding the list on each render would introduce a real bug**. A long press clears a field and triggers a render. If the pressed button were replaced during the press, the following `click` would never fire, `pressConsumed` would stay `true`, and the dealer's **next** tap anywhere would be swallowed. Stable elements avoid this entirely.
- 108 hidden buttons cost nothing measurable. The whole board stays under 200 elements.

**Order (FR-020b)**: by type in the order Split → Street/Trio → Corner/Basket → Sixline, then by the lowest number ascending. For a given winning number this reads left to right across the tableau within each type. The list uses a fixed multi-column grid (6 columns) sized for 11 entries, so all winning lines fit without scrolling (FR-020c). Its height is reserved even while empty, so the board does not jump when a number is entered.

**Alternatives considered**: putting the list into the right-hand panel. That panel already holds the result cards and must keep the total visible, so adding up to 11 more buttons would push the results into scrolling on the tablet.

---

## R-105: Tap feedback (FR-023)

**Decision**: After a successful `addStake`, `main.js` briefly sets `data-flash` on **every** element with that `data-field-id` (the zone and the list entry). A roughly 250 ms CSS animation shows the pulse. The existing tap badge (`2x`) shows on both elements. Zones are too small for the label, so their badge sits centred as a chip-like dot.

**Rationale**: the dealer must see which field took the tap, and if they used the list, *where* that field is on the tableau. Pulsing both routes teaches the mapping as a side effect.

---

## R-106: Switching line bets off (FR-027, FR-028)

**Decision**: a new config key `lineBets` (boolean, default `true`). When it is `false`, `buildTableau` builds exactly the 49 cells of today with today's grid template, builds no list row, and the page is structurally identical to the pre-feature build. The domain catalogue stays complete in both modes.

**Rationale**:
- The domain does not need to know about the switch. Without zones and list buttons, no line `fieldId` can reach `addStake`, so no line stake can exist, so none can be displayed or totalled. Keeping the switch in the UI layer keeps every domain function's signature unchanged.
- FR-028 is then verifiable mechanically. The render integration test builds with `lineBets: false` and asserts 49 cells and today's states for the 001 reference scenarios. The domain-level 001 reference tests stay as they are, except for the `winningFieldIds` count assertion, which now filters `kind !== "line"`.
- Default `true`, because the point of the build is to try the feature. Invalid values fall back to the default with the usual startup warning (config contract rule 2).

**Alternatives considered**: a runtime toggle in the settings dialog. That is not required by the spec, and rebuilding the tableau mid-round would raise the question of what happens to existing line stakes. Deferred until the trial shows it is wanted.

---

## R-107: Many occupied fields in the results panel

**Decision**: when more than 5 fields are occupied, result cards switch to a **compact single-row variant**: name, taps, total payout (at `--fs-figure`), and per chip on the same row. The stake → win breakdown moves into the row's secondary line. The round total is already outside the scrolling container and stays pinned.

**Rationale**: with line bets, a busy round can realistically have 6 to 8 occupied fields instead of 2 to 4. The full card is about 110 px tall, and eight of them overflow the tablet panel. The compact rows keep the figures the dealer pays from at the same size (FR-028 of 001).

**Known limit, documented rather than hidden**: in the theoretical worst case of all 17 winners occupied at once, the results list scrolls on the tablet, while the total stays visible. SC-008 measures 17 *active* fields, which is met. The spec's edge case asks that the list stay *readable* at 17 occupied fields, which compact mode also meets. Whether that is good enough is recorded during the trial (quickstart § C).

---

## Summary of decisions

| # | Decision | Satisfies |
|---|---|---|
| R-101 | Lines are generated `kind: "line"` entries in the one catalogue | FR-001–FR-011, FR-016–FR-019 |
| R-102 | Everything except outside bets uses `baseStakeNumber` | FR-012 |
| R-103 | Interleaved-track grid: one thin grid cell per line bet, no overlap by construction | FR-020, FR-021, FR-024, FR-026 |
| R-104 | List built once, shown by `hidden`, shares `data-field-id` with the zone | FR-020a–c |
| R-105 | Pulse on every element of the tapped field | FR-023 |
| R-106 | `lineBets` config key, UI-only switch, default on | FR-027–FR-029, SC-007 |
| R-107 | Compact result rows above 5 occupied fields, total pinned | FR-025, SC-008 |
