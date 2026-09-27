# Contract: Tableau (`public/js/ui/tableau.js`, `main.js`)

**Delta on**: [003 ui-tableau](../../003-french-layout/contracts/ui-tableau.md)

## `buildTableau(containers, options)`

```javascript
buildTableau(
  { tableau, lineList },
  { lineBets: boolean, orientation: "horizontal" | "vertical" }  // NEW: orientation
) → Map<fieldId, HTMLElement[]>                                   // unchanged
```

- `orientation` omitted → `DEFAULT_CONFIG.orientation` (`"horizontal"`), imported from `domain/config.js`.
- `tableau` gets classes `french`, plus `horizontal` **or** `vertical`, plus `lines` when on.
- Map size, element counts and element order are identical in both orientations (003 contract).
- Every element is placed inline. In `vertical` the placements are exactly the 003 ones. In `horizontal` they are the 003 placements passed through `rotate` ([data-model § 3b](../data-model.md)).

### Exported pure helpers

```javascript
rotate({ row, column }, verticalColumnCount) → { row, column }        // NEW
numberGridPlacement(n, { lineBets, orientation })                     // + orientation
sideGridPlacements(fieldId, { lineBets, orientation })                // + orientation
lineGridPlacement(field, { orientation })                             // + options arg
LEFT_SIDE, RIGHT_SIDE                                                 // unchanged
```

`orientation` defaults to `"vertical"` **inside these helpers**, so that direct calls in 003 tests keep their meaning. Only `buildTableau` applies the config default.

## `main.js`

```javascript
buildTableau({ tableau: $("tableau"), lineList: $("line-list") },
             { lineBets: config.lineBets, orientation: config.orientation });
document.querySelector(".stage").classList.add(config.orientation);   // "horizontal" | "vertical"
```

There is no other change: events, render and settings are untouched.

## CSS hooks

| Selector | Purpose |
|---|---|
| `.tableau.french.vertical` / `.tableau.french.vertical.lines` | 003 templates (renamed from `.tableau.french` / `.tableau.french.lines`) |
| `.tableau.french.horizontal` / `.tableau.french.horizontal.lines` | 14×5 / 26×8 templates (research R-303) |
| `.stage.vertical.lines .board` | list beside the board (003 R-205) |
| `.stage.horizontal .line-list` | list below, 6 columns, 2 rows reserved (R-304) |
