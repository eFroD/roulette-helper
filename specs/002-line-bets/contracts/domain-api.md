# Contract Delta: Domain Module API (`public/js/domain/`)

**Base contract**: [001 domain-api](../../001-roulette-dealer-companion/contracts/domain-api.md). Everything there still holds unless it is amended below. The purity rule (no `document`, `window`, `navigator`, timers) is unchanged and still enforced by `tests/domain-purity.test.js`.

**No exported function changes its signature.** The only change is in the data the functions work on, plus one condition in `unitFor`.

---

## `wheel.js`

```javascript
export const BET_FIELDS: ReadonlyArray<BetField>   // now 157 entries
export const LINE_TYPES: ReadonlyArray<string>      // NEW: ["split","street","trio","corner","basket","sixline"]
// unchanged: RED_NUMBERS, isValidNumber, colourOf, fieldById, winningFieldIds, isWinner
```

**Amended guarantees**

- `BET_FIELDS.length === 157`: 37 `number`, 108 `line`, 12 `outside`, in that order ([data-model § 4](../data-model.md)).
- `winningFieldIds(n)` for `n` from 1 to 36 returns the 6 non-line winners of 001 **plus** every line containing `n` (between 5 and 11), which is 11 to 17 ids.
- `winningFieldIds(0)` returns exactly `["n0", "split-0-1", "split-0-2", "split-0-3", "trio-0-1-2", "trio-0-2-3", "basket-0-1-2-3"]` in catalogue order. Every outside field still loses on 0.
- *Replaces* "exactly 6 ids for 1–36": **exactly 6 ids of `kind !== "line"`** for every `n` from 1 to 36.

**New guarantees**

- Every line field is frozen, has `numbers` sorted ascending, and satisfies `wins(n) === numbers.includes(n)` for all `n` from 0 to 36.
- Per-type counts and ratios exactly as in [data-model § 2](../data-model.md).
- No line field violates the adjacency rules of [data-model § 1](../data-model.md).

## `payout.js`

```javascript
export function unitFor(field, config)   // AMENDED condition
```

- `unitFor(field, config) === (field.kind === "outside" ? config.baseStakeOutside : config.baseStakeNumber)`.
- Every other guarantee is unchanged: no division, `perChip = unit × ratio`, integers in give integers out.

**Pinned reference values** (spec reference scenarios 3–6, `baseStakeNumber = 5`):

| Input | `stake` | `win` | `total` | `perChip` |
|---|---|---|---|---|
| split, 2 taps | 10 | 170 | 180 | 85 |
| street, 1 tap | 5 | 55 | 60 | 55 |
| corner, 3 taps | 15 | 120 | 135 | 40 |
| sixline, 2 taps | 10 | 50 | 60 | 25 |
| basket, 2 taps (US2 AC5) | 10 | 80 | 90 | 40 |

## `round.js`

**No code change.** The following guarantees are newly *asserted by tests* for line fields:

- `addStake` on a winning line increments it. On a losing line, or on any line before a number is set, it is a no-op.
- `undo` reverses the last tap regardless of kind. A sequence mixing number, outside and line taps unwinds in reverse chronological order (FR-016).
- `clearField` on a line clears only that line (FR-017).
- `changeWinningNumber` and `nextRound` drop line stakes along with all others (FR-018, FR-019).
- `needsConfirmation` is `true` when the only stakes are on lines (FR-019).

## `config.js` (domain)

See [config-contract.md](./config-contract.md). `DEFAULT_CONFIG` gains `lineBets: true`. `RULES` gains a boolean rule.
