# Data Model: Wetten auf den Linien

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

This is a delta on [001 data-model](../001-roulette-dealer-companion/data-model.md). The round, stake, undo log and payout result entities are **unchanged**. They already work on any field with an `id`, a `ratio` and a `wins` predicate (R-101).

---

## 1. BetField (extended)

`kind` gains a third value. Line fields carry two extra attributes.

| Attribute | number | outside | **line** (new) |
|---|---|---|---|
| `id` | `n0` … `n36` | `red`, `dozen2`, … | `<type>-<numbers joined by "-">`, e.g. `split-16-17`, `corner-13-14-16-17`, `sixline-13-14-15-16-17-18` |
| `kind` | `"number"` | `"outside"` | `"line"` |
| `type` | — | — | `split` \| `street` \| `trio` \| `corner` \| `basket` \| `sixline` |
| `numbers` | — | — | ascending integer array, length 2–6 |
| `label` | `"17"` | `"Rot"` | see § 3 |
| `ratio` | 35 | 1 or 2 | see § 2 |
| `colour` | red/black/green | — | — |
| `number` | 0–36 | — | — |
| `wins(n)` | `n === number` | per definition | `numbers.includes(n)` |

**Validation rules** (enforced by tests, not at runtime, since the catalogue is generated once and frozen):

- Every `numbers` entry is an integer from 0 to 36. Arrays are sorted ascending, contain no duplicates, and have the length that belongs to their type (2 / 3 / 3 / 4 / 4 / 6).
- **Adjacency (FR-003)**: every split is either `{n, n+1}` inside one street, `{n, n+3}` with `n ≤ 33`, or `{0, 1|2|3}`. Every corner is `{b, b+1, b+3, b+4}` with `b % 3 !== 0` and `b ≤ 32`. No entry combines 3 with 4, 6 with 7, … across a street boundary as a "neighbour", and none reaches past 36.
- `id` values are unique across all 157 fields.

**Stake class**: `kind === "outside"` → `baseStakeOutside`. Otherwise (number *or* line) → `baseStakeNumber` (R-102).

## 2. Ratios

| type | numbers | ratio | count |
|---|---|---|---|
| split | 2 | 17 | 60 |
| street | 3 | 11 | 12 |
| trio | 3 (0-1-2, 0-2-3) | 11 | 2 |
| corner | 4 | 8 | 22 |
| basket | 4 (0-1-2-3) | 8 | 1 |
| sixline | 6 | 5 | 11 |
| **total** | | | **108** |

All ratios are integers, so integer stakes still give integer results with no rounding rule (spec Assumptions; 001 R-007).

## 3. Labels (FR-004, FR-020b)

| type | format | example |
|---|---|---|
| split | `Split a/b` | `Split 16/17`, `Split 0/1` |
| street | `Street a-b-c` | `Street 16-17-18` |
| trio | `Trio 0-a-b` | `Trio 0-1-2` |
| corner | `Corner a/b/c/d` | `Corner 13/14/16/17` |
| basket | `Basket 0-1-2-3` | — |
| sixline | `Sixline a–f` (first and last) | `Sixline 13–18` |

The same label appears on the list entry, on the result card and in the zone's `title` / `aria-label`.

## 4. Catalogue order

`BET_FIELDS` = 37 numbers → 108 lines → 12 outside bets (**157**). Inside bets are grouped ahead of outside bets, so `occupiedFields` (catalogue order) lists result cards the way a dealer pays: inside first.

Within the 108 lines the order is also the **selection list order** (R-104): split → street → trio → corner → basket → sixline, and within each type ascending by `numbers[0]`, then `numbers[1]`.

## 5. Winning sets (derived, never stored)

`winningFieldIds(n)` returns every field whose `wins(n)` is true, in catalogue order.

| n | numbers | lines | outside | total |
|---|---|---|---|---|
| 0 | 1 | 6 | 0 | **7** |
| 1 | 1 | 8 | 5 | **14** |
| 17 | 1 | 11 | 5 | **17** (maximum) |
| 34, 36 | 1 | 5 | 5 | **11** (minimum for 1–36) |

Invariant for `n` from 1 to 36: `winningFieldIds(n).filter(id => fieldById(id).kind !== "line").length === 6`, which is the 001 guarantee restated.

## 6. Tableau geometry (UI only)

Each line field maps to exactly one grid cell of the interleaved layout (R-103). The mapping is computed in the UI layer from `type` and `numbers` and is not stored on the field:

- street index `s(n) = floor((n − 1) / 3)` (0–11) → column track `c(s+1)`.
- row of a number: `n % 3` → 0 = `r3` (top), 2 = `r2`, 1 = `r1` (bottom).
- vertical line track between street `s` and `s+1` → `v(s+1)`, between zero and street 0 → `v0`.

| type | row track | column track |
|---|---|---|
| split `{n, n+1}` | `h32` if `n % 3 === 2`, else `h21` | `c(s(n)+1)` |
| split `{n, n+3}` | row of `n` | `v(s(n)+1)` |
| split `{0, k}` | row of `k` | `v0` |
| corner `{b, …}` | `h32` if `b % 3 === 2`, else `h21` | `v(s(b)+1)` |
| trio `0-1-2` / `0-2-3` | `h21` / `h32` | `v0` |
| street | `hb` | `c(s+1)` |
| sixline `{b … b+5}` | `hb` | `v(s(b)+1)` |
| basket | `hb` | `v0` |

## 7. Configuration (extended)

| Key | Type | Default | Meaning |
|---|---|---|---|
| `lineBets` | boolean | `true` | `false` → the tableau is built exactly as before this feature: no zones, no list. |

All other keys are unchanged. `baseStakeNumber` now covers numbers **and** lines (comment updated, key not renamed).

## 8. Field element states (extended)

The zone and the list entry of one line field share one state, derived exactly as for cells today:

| Round | Field | Zone | List entry |
|---|---|---|---|
| no number / picking | any | `neutral`, tap ignored by `main.js` | hidden (row shows a hint) |
| number set | loser | `loser`, `disabled` | hidden |
| number set | winner, 0 taps | `winner` | visible, `winner` |
| number set | winner, ≥1 tap | `occupied` + badge | visible, `occupied` + badge |
