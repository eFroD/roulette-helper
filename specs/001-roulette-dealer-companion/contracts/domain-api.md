# Contract: Domain Module API (`public/js/domain/`)

**Consumers**: `public/js/ui/*`, `public/js/main.js`, and `tests/*.test.js`.
**Hard constraint**: these three modules must never reference `document`, `window`, `navigator`, timers, or any global mutable state. That is what lets the same files import into both the browser and `node --test` with no shims (research R-002). A DOM reference appearing here is a defect, not a shortcut.

All exported functions are **pure**: same inputs → same outputs, no mutation of arguments, no side effects. State transitions return a **new** round object.

---

## `wheel.js` — geometry and the field catalogue

```javascript
export const RED_NUMBERS: ReadonlySet<number>   // the 18 red numbers
export const BET_FIELDS: ReadonlyArray<BetField> // exactly 49 entries
export function colourOf(n: number): "red" | "black" | "green"
export function fieldById(id: string): BetField | undefined
export function winningFieldIds(n: number): string[]
export function isWinner(fieldId: string, n: number | null): boolean
```

**Guarantees**

- `BET_FIELDS.length === 49` — 37 numbers + 12 outside bets.
- `colourOf(0) === "green"`; every other `n` in 1–36 is `"red"` or `"black"`, 18 each.
- `winningFieldIds(n)` returns **exactly 6 ids** for every `n` in 1–36, and **exactly `["n0"]`** for `n === 0`.
- `isWinner(id, null) === false` for every id — nothing wins before a number is entered (FR-007).
- Out-of-range or non-integer `n` yields `[]` from `winningFieldIds` and `false` from `isWinner`; no throw.
- Field order in `BET_FIELDS` is stable and is the tableau's rendering order.

---

## `payout.js` — money

```javascript
export function unitFor(field: BetField, config: Config): number
export function resultFor(field: BetField, taps: number, config: Config): PayoutResult
export function roundTotals(results: PayoutResult[]): { stakeTotal, winTotal, payoutTotal }
```

`PayoutResult` = `{ fieldId, label, taps, unit, stake, win, total, perChip }` — see [data-model.md § 5](../data-model.md).

**Guarantees**

- `stake = taps × unit`, `win = stake × ratio`, `total = stake + win`, `perChip = unit × ratio`.
- `perChip` is computed as a product and **never** as `win / taps`. No division occurs anywhere in this module (research R-007).
- `taps === 0` yields `stake`, `win` and `total` of 0. `perChip` stays `unit * ratio`, because it is a rate of the field rather than a figure of the round; callers exclude unoccupied fields from display and from totals anyway (FR-012), so its value there is never observed.
- `roundTotals([])` returns `{0, 0, 0}`, not `null` or `undefined`.
- Integer base stakes in ⇒ integer figures out, exactly, for every field type.

**Pinned reference values** (spec reference scenarios 3–5, defaults 5 / 10):

| Input | `stake` | `win` | `total` | `perChip` |
|---|---|---|---|---|
| number, 2 taps | 10 | 350 | 360 | 175 |
| red, 4 taps | 40 | 40 | 80 | 10 |
| dozen, 3 taps | 30 | 60 | 90 | 20 |
| red, 2 taps (after undo) | 20 | 20 | 40 | 10 |

---

## `round.js` — state machine

```javascript
export function createRound(): Round
export function setWinningNumber(round: Round, n: number): Round
export function changeWinningNumber(round: Round, n: number): Round
export function addStake(round: Round, fieldId: string): Round
export function undo(round: Round): Round
export function clearField(round: Round, fieldId: string): Round
export function nextRound(round: Round): Round
export function needsConfirmation(round: Round): boolean
export function occupiedFields(round: Round): Array<{ field: BetField, taps: number }>
```

**Guarantees**

- **Every function returns a new `Round`; the argument is never mutated.** Callers may safely retain previous rounds.
- **Guard violations are no-ops, not throws.** Staking a losing or unknown field, staking before a winning number exists, undoing an empty log, or clearing an empty field all return a round that is deeply equal to the input. The UI therefore needs no error handling on the action path.
- `needsConfirmation(round)` is `true` exactly when the round has at least one stake — the UI's cue to prompt before `changeWinningNumber` or `nextRound` (FR-020, FR-022). It is advisory: the mutators do not consult it.
- `undo` reverses **one tap**, never a whole field (FR-017). A `clearField` entry restores the full prior count as a single undo step.
- `setWinningNumber` and `changeWinningNumber` both leave `undoLog` empty.
- `occupiedFields` returns only fields with `taps >= 1`, in `BET_FIELDS` order, so render order is deterministic.

---

## Boundary with the UI layer

| Concern | Owner | Why |
|---|---|---|
| Arithmetic, winner derivation, state transitions | `domain/` | Must be provably correct; tested headlessly |
| Confirmation prompts (FR-020, FR-022) | `ui/dialogs.js` | Keeps `round.js` synchronous and DOM-free |
| Wake lock, fullscreen | `platform/` | Browser-API-dependent, degrades silently |
| Session history storage | `main.js` | Display-only; outside the round's invariants |
| Config validation and defaults | `main.js` | Domain receives an already-valid `Config` |

`domain/` never imports from `ui/` or `platform/`. The dependency arrow points one way only.
