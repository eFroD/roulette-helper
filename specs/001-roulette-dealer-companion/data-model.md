# Phase 1 Data Model: Roulette Dealer Companion

**Date**: 2026-09-19 | **Plan**: [plan.md](./plan.md) | **Spec entities**: [spec.md § Key Entities](./spec.md)

All structures are plain JavaScript objects held in memory for the duration of one page load. Nothing is serialised, persisted, or transmitted (FR-030). Round state is treated as **immutable**: every transition returns a new round object, which is what makes the state machine directly assertable in tests.

---

## 1. Config

Host-authored, read once at startup, never mutated by the app. Contract and validation rules: [contracts/config-contract.md](./contracts/config-contract.md).

| Field | Type | Default | Validation |
|---|---|---|---|
| `baseStakeOutside` | number | `10` | finite, `> 0` |
| `baseStakeNumber` | number | `5` | finite, `> 0` |
| `currencySymbol` | string | `"€"` | non-empty after trim |
| `historyLength` | integer | `10` | integer, `>= 0` |

Any invalid value falls back to its default and raises a visible startup warning; the app never refuses to start over configuration (a dealer mid-party must not face a blank screen).

---

## 2. Wheel geometry — static reference data

Derived constants, not state. Defined once in `wheel.js`.

**Red numbers** (18): 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
**Black numbers** (18): 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
**Green**: 0

Classification of a winning number `n`:

| Attribute | Rule | Zero |
|---|---|---|
| Colour | membership in the red set, else black | green |
| Parity | `n % 2 === 0` → even, else odd | neither |
| Half | `1–18` low, `19–36` high | neither |
| Dozen | `ceil(n / 12)` → 1, 2, 3 | none |
| Column | `n % 3 === 1` → col 1; `=== 2` → col 2; `=== 0` → col 3 | none |

**Zero is the whole of the special-case surface.** It belongs to no colour bet, no parity, no half, no dozen, and no column, so the single rule *"every outside bet excludes 0"* implements FR-005 and the house rule (no La Partage, no En Prison) in one place. No other number needs special handling anywhere in the model.

---

## 3. BetField — the 49-entry catalogue

Immutable descriptors, built once. 37 numbers + 12 outside bets.

| Property | Type | Notes |
|---|---|---|
| `id` | string | Stable key. `"n0"`…`"n36"`, `"red"`, `"black"`, `"even"`, `"odd"`, `"low"`, `"high"`, `"dozen1"`–`"dozen3"`, `"col1"`–`"col3"` |
| `kind` | `"number"` \| `"outside"` | Selects which base stake applies |
| `label` | string | German display text, e.g. `"Rot"`, `"2. Dutzend"` |
| `ratio` | `35` \| `2` \| `1` | Win per unit staked, excluding the stake itself |
| `colour` | `"red"` \| `"black"` \| `"green"` | Numbers only; drives tableau styling |
| `wins(n)` | predicate | `true` when winning number `n` makes this field a winner |

Full field roster:

| Fields | Count | `kind` | `ratio` |
|---|---|---|---|
| `n0`…`n36` | 37 | number | 35 |
| `red`, `black`, `even`, `odd`, `low`, `high` | 6 | outside | 1 |
| `dozen1`, `dozen2`, `dozen3` | 3 | outside | 2 |
| `col1`, `col2`, `col3` | 3 | outside | 2 |

**Invariant**: for any `n` in 1–36, exactly **6** fields satisfy `wins(n)` — the number itself, its colour, its parity, its half, its dozen, its column. For `n = 0`, exactly **1** field does (`n0`). This invariant is asserted across all 37 numbers in `wheel.test.js` and is the precise statement of reference scenarios 1 and 2.

---

## 4. Round — the state machine

```js
{
  status: "awaiting-number" | "collecting",
  winningNumber: null | 0..36,
  stakes: { [fieldId]: tapCount },   // only fields with tapCount >= 1 are present
  undoLog: [ { type, fieldId?, ... } ]
}
```

**Invariants** (enforced in `round.js`, asserted in `round.test.js`):
- `status === "awaiting-number"` ⟺ `winningNumber === null`.
- `stakes` is empty whenever `winningNumber === null` (FR-007).
- Every key in `stakes` refers to a field where `wins(winningNumber)` is true — a losing bet is unrepresentable, not merely unreachable through the UI (FR-006).
- Every value in `stakes` is an integer ≥ 1; a field dropping to 0 is deleted rather than stored as 0 (FR-012 display rule, spec scenario US2-5).

### Transitions

| Transition | Guard | Effect | Requirement |
|---|---|---|---|
| `setWinningNumber(n)` | `status === "awaiting-number"` | → `collecting`, sets `winningNumber`, clears `undoLog` | FR-003, FR-004 |
| `changeWinningNumber(n)` | `status === "collecting"` | **Caller must confirm first if `stakes` non-empty.** Sets new number, discards all stakes and undo log | FR-019, FR-020 |
| `addStake(fieldId)` | `collecting` **and** field wins | `stakes[fieldId] += 1`, pushes to `undoLog` | FR-008 |
| `undo()` | `undoLog` non-empty | Reverses the last entry by exactly one tap | FR-017 |
| `clearField(fieldId)` | field has stakes | Deletes that key only, pushes a reversible entry | FR-018 |
| `nextRound()` | any | Pushes `winningNumber` to history, returns a fresh round | FR-021 |

Guard violations are **no-ops that return the round unchanged** — never exceptions. A tap on a locked field, an undo with nothing to undo, or a stake before a number is entered all leave state untouched, which is exactly the spec's edge-case behaviour and removes any need for error handling in the UI layer.

**Confirmation is the caller's job, not the model's.** `changeWinningNumber` and `nextRound` execute unconditionally; `dialogs.js` decides whether to ask. This keeps `round.js` DOM-free and synchronous, so the tests never stub a prompt, while FR-020 and FR-022 are satisfied at the UI seam.

### Undo semantics

`undoLog` is a stack of reversible entries. `addStake` pushes `{type:"stake", fieldId}`; `clearField` pushes `{type:"clear", fieldId, count}` so a cleared field restores in full. Undo pops one entry and reverses it — **one tap at a time, never a whole field** (FR-017, reference scenario 6). Setting or changing the winning number empties the stack: those stakes no longer exist, so their undo entries must not survive (FR-020).

---

## 5. PayoutResult — derived, never stored

Computed on demand from a field, its tap count, and config. Not part of round state.

| Field | Formula | Scenario 5 (dozen, 3 taps @ 10 €) |
|---|---|---|
| `taps` | from `stakes` | 3 |
| `unit` | `kind === "number" ? baseStakeNumber : baseStakeOutside` | 10 |
| `stake` | `taps × unit` | 30 |
| `win` | `stake × ratio` | 60 |
| `total` | `stake + win` | 90 |
| `perChip` | `unit × ratio` | 20 |

`perChip` is deliberately **`unit × ratio`, never `win ÷ taps`**. Both give the same number, but the product form keeps every figure an exact integer and keeps division out of the money path entirely (research R-007).

**Round totals**: `stakeTotal`, `winTotal`, `payoutTotal` are sums over occupied fields only. `payoutTotal` is the prominent figure — the chips the dealer takes from the bank (FR-014). An empty round totals 0 rather than being absent.

---

## 6. SessionHistory

A bounded list of past winning numbers, display-only, with no influence on any calculation (FR-031).

- Appended on `nextRound()`, but only when a winning number was actually entered.
- Capped at `config.historyLength`; the oldest entry is dropped on overflow.
- Each entry renders in its field colour, derived through `wheel.js` rather than stored.
- Lives outside the round object, in session scope, and is lost on reload like everything else.

---

## Entity relationships

```text
Config ──────────────► PayoutResult ◄────────── BetField (49, static)
   (units, symbol)         (derived)             (ratio, kind, wins)
                               ▲                       ▲
                               │                       │
                            Round ────────────────────┘
                 (winningNumber, stakes, undoLog)
                               │
                               ▼  on nextRound()
                        SessionHistory (bounded, display-only)
```

Config and BetField are read-only inputs. Round is the only mutable state. PayoutResult is derived on every render and never stored — so a displayed figure can never drift from the round state that produced it.
