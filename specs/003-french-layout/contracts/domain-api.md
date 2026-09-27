# Contract: Domain delta (`public/js/domain/wheel.js`)

**Delta on**: [002 domain-api](../../002-line-bets/contracts/domain-api.md)

## Changed

- `BET_FIELDS` / `fieldById(id)`: the 9 outside fields `low`, `high`, `even`, `odd`, `red`, `black`, `dozen1..3` carry
  - a new `label`, e.g. `"Manque (1–18)"`
  - a new optional `feltLabel`, e.g. `"Manque"`

  See [data-model § 2](../data-model.md) for the full list.

## Unchanged (regression-guarded)

- Ids, count (157), catalogue order, `kind`, `ratio`, `colour`, `number`, `numbers`, `type`.
- Every `wins` predicate. `winningFieldIds(n)` returns the identical set for all 37 numbers, and a test compares against a snapshot taken before the change (spec SC-002).
- `payout.js` (`unitFor`, `resultFor`, `roundTotals`), `round.js`, `config.js`, `history.js`: untouched.
- **Rules**: on 0 all outside bets lose in full. There is no La Partage and no En Prison (spec FR-015).
- Domain purity: `wheel.js` still imports nothing from outside `domain/`.
