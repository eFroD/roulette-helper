# Contract Delta: Host Configuration (`public/config.js`)

**Base contract**: [001 config-contract](../../001-roulette-dealer-companion/contracts/config-contract.md). The file format, load order, the optional status of every key, the fallback with warning, ignoring unknown keys, and "read once at startup" are all unchanged.

## New key

| Key | Type | Default | Valid when | Invalid → |
|---|---|---|---|---|
| `lineBets` | boolean | `true` | `value === true \|\| value === false` | default + warning |

Strings such as `"false"` are **invalid**, not falsy. A host who types `lineBets: "false"` gets the default (`true`) and a warning that names the key, rather than a silent surprise in either direction.

## Amended comment

`baseStakeNumber` keeps its name. Its meaning widens from "one tap on a single number" to "one tap on an inside bet: single number **or line**" (FR-012, R-102). The key is **not** renamed, because renaming is a breaking change for every existing `config.js`.

## Resulting file

```javascript
window.ROULETTE_CONFIG = {
  baseStakeOutside: 10, // ein Tap auf eine Aussenwette (Rot, Dutzend, ...)
  baseStakeNumber: 5,   // ein Tap auf eine Innenwette: Zahl (0-36) oder Linie (Split, Street, Corner, ...)
  currencySymbol: "€",  // wird hinter jeden Betrag gesetzt
  historyLength: 10,    // Laenge der Zahlen-Historie; 0 blendet sie aus
  lineBets: true,       // Wetten auf den Linien anbieten; false = Tableau wie vorher
};
```

## Guarantee (FR-028)

With `lineBets: false`, the built tableau contains exactly the 49 elements of the pre-feature build, has the same grid template, and has no selection-list row. Every 001 reference scenario produces identical states and figures.
