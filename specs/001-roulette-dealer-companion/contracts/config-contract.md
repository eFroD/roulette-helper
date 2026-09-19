# Contract: Host Configuration (`public/config.js`)

**Consumer**: the host (party organiser), editing by hand before the party.
**Producer of defaults**: `public/js/main.js`.
**Stability**: this is the only file a non-developer is expected to touch. Treat its shape as a public interface — renaming a key is a breaking change.

## File format

A classic script (not a module) that assigns one global object. Loaded by `index.html` **before** the module entry point, so it is guaranteed present when `main.js` runs.

```html
<script src="./config.js"></script>
<script type="module" src="./js/main.js"></script>
```

```javascript
// config.js — edit these values before the party, then reload the tablet.
window.ROULETTE_CONFIG = {
  baseStakeOutside: 10,   // one tap on an outside bet (Rot, Dutzend, …) = this much
  baseStakeNumber: 5,     // one tap on a single number (0–36) = this much
  currencySymbol: "€",    // shown after every amount
  historyLength: 10,      // how many past winning numbers the strip keeps; 0 hides it
};
```

## Schema

| Key | Type | Default | Valid when | Invalid → |
|---|---|---|---|---|
| `baseStakeOutside` | number | `10` | finite and `> 0` | default + warning |
| `baseStakeNumber` | number | `5` | finite and `> 0` | default + warning |
| `currencySymbol` | string | `"€"` | non-empty after trim | default + warning |
| `historyLength` | integer | `10` | integer and `>= 0` | default + warning |

## Behavioural guarantees

1. **Every key is optional.** A missing key, an empty object, or a missing `config.js` altogether yields a fully working app on defaults.
2. **Invalid values never block startup.** Each bad value independently falls back to its default and the app shows a dismissible startup warning naming the key. A dealer mid-party must never meet a blank screen because of a typo.
3. **Unknown keys are ignored**, so the host can leave notes in the object without breaking anything.
4. **Read once at startup.** Editing the file requires a page reload. `nginx.conf` sends `Cache-Control: no-store` for this file so a reload is always sufficient — no cache-clearing, no hard refresh.
5. **Units are independent.** `baseStakeNumber` applies to all 37 number fields; `baseStakeOutside` applies to all 12 outside bets. No field uses a third unit.
6. **The symbol is a suffix, verbatim.** No locale formatting, no thousands separators, no repositioning (research R-007). `30` with `"€"` renders `30 €`.

## Runtime overrides (FR-024, optional)

If the settings panel is built, it may override `baseStakeOutside` and `baseStakeNumber` for the current page load only. It must **not** write back to `config.js` and must **not** persist anywhere (FR-030) — a reload returns to the file's values. Changing a base stake re-derives all displayed figures from existing tap counts; it never alters the tap counts themselves.
