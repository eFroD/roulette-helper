# Contract: Host configuration (`public/config.js`, `public/js/domain/config.js`)

**Delta on**: [002 config-contract](../../002-line-bets/contracts/config-contract.md)

## New key

```javascript
orientation: "horizontal", // Tableau quer (Breitbild) oder "vertical" = senkrecht wie am Tisch
```

| Input | Resolved | Warning |
|---|---|---|
| key absent | `"horizontal"` | none |
| `"horizontal"`, `"Horizontal"`, `" horizontal "` | `"horizontal"` | none |
| `"vertical"`, `"VERTICAL"` | `"vertical"` | none |
| `"quer"`, `"senkrecht"`, `""`, `true`, `1`, `null` | `"horizontal"` | one warning naming `orientation`, the expected values `"horizontal" oder "vertical"`, and the default |

An invalid `orientation` never affects the other keys, and they never affect it.

## `resolveConfig` rule

```javascript
{ key: "orientation",
  valid: (v) => typeof v === "string" && ["horizontal", "vertical"].includes(v.trim().toLowerCase()),
  normalise: (v) => v.trim().toLowerCase(),
  expected: '"horizontal" oder "vertical"' }
```

`DEFAULT_CONFIG` gains `orientation: "horizontal"`.

## Resulting `public/config.js`

```javascript
window.ROULETTE_CONFIG = {
  baseStakeOutside: 10, // ein Tap auf eine Aussenwette (Rot, Dutzend, ...)
  baseStakeNumber: 5, // ein Tap auf eine Innenwette: Zahl (0-36) oder Linie (Split, Street, Corner, ...)
  currencySymbol: "€", // wird hinter jeden Betrag gesetzt
  historyLength: 10, // Laenge der Zahlen-Historie; 0 blendet sie aus
  lineBets: true, // Wetten auf den Linien anbieten; false = Tableau ohne Linienwetten
  orientation: "horizontal", // "horizontal" = Tableau quer (Breitbild), "vertical" = senkrecht wie am Tisch
};
```
