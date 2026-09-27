# Contract: Tableau (`public/js/ui/tableau.js`, `index.html`, `main.js`)

**Delta on**: [002 ui-tableau](../../002-line-bets/contracts/ui-tableau.md)

**Consumers**: `main.js` and `tests/render.integration.test.js`.

## `buildTableau(containers, options)`

```javascript
buildTableau(
  { tableau, lineList },        // CHANGED: `dozens` and `outside` removed (R-201)
  { lineBets: boolean }         // unchanged; omitted → { lineBets: false }
) → Map<fieldId, HTMLElement[]> // unchanged shape
```

- **All** felt elements (numbers, the 12 outside ids, dozens twice, columns, zones) are appended to `tableau`, and each gets an inline `grid-row` / `grid-column` per [data-model § 4](../data-model.md), **in both modes**. This replaces the 002 rule "lineBets false → no inline placement".
- `tableau` always has class `french`. With `lineBets: true` it additionally has class `lines`, as in 002.
- Map sizes and element counts:
  - `lineBets: false`: 49 ids and 52 elements (`dozen1..3` → 2 elements each).
  - `lineBets: true`: 157 ids and 268 elements.
- Cell text is `field.feltLabel ?? field.label`.
- `lineList` behaviour is unchanged: built once, 108 entries plus the hint, all hidden initially.
- Passing extra keys (e.g. a stale `dozens`) is ignored. They receive nothing.

### Exported pure helpers (tested directly)

```javascript
numberGridPlacement(n, { lineBets })      → { row, column }
sideGridPlacements(fieldId, { lineBets }) → Array<{ row, column }>  // 1 for chances/columns, 2 for dozens
lineGridPlacement(field)                  → { row, column }         // lines exist only with lineBets
```

The values are strings as assigned to `style.gridRow` / `style.gridColumn`. The 002 helper `columnButtonPlacement` is folded into `sideGridPlacements`.

## `render(round, config, els, view)`

**No change.** It already applies one state and one badge to every element of an id, which covers the second dozen position (R-206).

## Events (`main.js`)

**No change to handlers.** Delegated `closest("[data-field-id]")` resolves either dozen position to the same id. The long press clears the id, and the flash animates all elements of the id.

Wiring change only:

```javascript
buildTableau({ tableau: $("tableau"), lineList: $("line-list") }, { lineBets: config.lineBets })
```

## `index.html`

- Remove `<div class="betrow" id="dozens">` and `<div class="betrow" id="outside">`.
- `#tableau` and `#line-list` stay inside `.board`. With lines on, `.board` lays them out side by side (R-205).
