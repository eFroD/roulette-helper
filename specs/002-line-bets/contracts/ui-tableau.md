# Contract: Tableau and Selection List (`public/js/ui/tableau.js`, `render.js`)

**Consumers**: `main.js` (event delegation) and `tests/render.integration.test.js`.

## `buildTableau(containers, options)`

```javascript
buildTableau(
  { tableau, dozens, outside, lineList },   // lineList: NEW container; may be absent when lineBets is false
  { lineBets: boolean }                     // NEW options argument; omitted → { lineBets: false }
) → Map<fieldId, HTMLElement[]>             // CHANGED: every field maps to ALL its elements
```

- Defaulting to `lineBets: false` when `options` is omitted keeps every existing call site and test on the pre-feature layout.
- **Return shape change**: values are arrays. Numbers and outside bets have one element. Lines have two (the zone and the list entry) when enabled. `render` applies state to every element in the array, so both routes can never disagree (FR-020a).
- `lineBets: true`:
  - `tableau` receives the class `lines` (the interleaved grid template, R-103) plus 108 zone buttons, each placed by `grid-row` / `grid-column` per [data-model § 6](../data-model.md). Map size is 157, total elements 49 + 108 + 108 = 265.
  - `lineList` receives 108 list buttons in catalogue order, all `hidden` initially.
- `lineBets: false`: identical output to the pre-feature build. Map size is 49, and `lineList` is left empty and hidden.
- **Every** interactive element carries `data-field-id`. Zones and list entries use the same id as their field. Nothing else in the page carries that attribute.
- No two zones share a `(grid-row, grid-column)` pair. No zone shares a grid cell with a number cell (FR-021). The integration test asserts both.

## `render(round, config, els, view)`

Unchanged signature. Additions:

- State per element as in [data-model § 8](../data-model.md). List entries additionally use `hidden = !(numberSet && isWinner)`.
- `els.lineList` (when present) shows a single hint element *"Linienwetten erscheinen nach der Gewinnzahl"* while no number is set or while picking.
- Results switch to the compact row variant when `occupiedFields(round).length > 5` (R-107).

## Events (`main.js`)

**No new listeners.** The existing delegated `pointerdown` / `click` handlers resolve `closest("[data-field-id]")` and therefore already cover zones and list entries:

| Situation | Tap on zone or list entry |
|---|---|
| no number set | ignored (`field.kind !== "number"`), FR-009 |
| picking a new number | ignored, same guard |
| number set, loser | unreachable (`disabled`, `pointer-events: none`; list entry hidden) |
| number set, winner | `addStake`, then pulse all elements of that id (R-105) |
| long press, taps > 0 | `clearField`, same as cells |

One addition: after `addStake` changes the round, `main.js` sets `data-flash` on `els.cells.get(fieldId)` elements and removes it after the animation.
