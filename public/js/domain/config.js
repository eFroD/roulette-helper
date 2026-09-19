// Host configuration: defaults, validation, per-key fallback.
// PURE MODULE: no document, no window, no navigator, no timers.

export const DEFAULT_CONFIG = Object.freeze({
  baseStakeOutside: 10,
  baseStakeNumber: 5,
  currencySymbol: "€",
  historyLength: 10,
});

const isPositiveAmount = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isCount = (v) => Number.isInteger(v) && v >= 0;

const RULES = [
  { key: "baseStakeOutside", valid: isPositiveAmount, expected: "eine Zahl groesser als 0" },
  { key: "baseStakeNumber", valid: isPositiveAmount, expected: "eine Zahl groesser als 0" },
  { key: "currencySymbol", valid: isNonEmptyString, expected: "ein nicht-leerer Text", normalise: (v) => v.trim() },
  { key: "historyLength", valid: isCount, expected: "eine ganze Zahl ab 0" },
];

/**
 * Resolve raw host config against the defaults.
 *
 * Each key is validated independently, so one bad value never drags a valid
 * sibling down with it, and an invalid config never prevents startup - a
 * dealer mid-party must not meet a blank screen because of a typo.
 *
 * @returns {{config: object, warnings: string[]}}
 */
export function resolveConfig(raw) {
  const source = raw !== null && typeof raw === "object" ? raw : {};
  const config = { ...DEFAULT_CONFIG };
  const warnings = [];

  for (const { key, valid, expected, normalise } of RULES) {
    if (!(key in source)) continue; // absent is fine: the default stands, silently
    const value = source[key];
    if (valid(value)) {
      config[key] = normalise ? normalise(value) : value;
    } else {
      warnings.push(
        `"${key}" ist ungueltig (erwartet: ${expected}). Standardwert ${JSON.stringify(DEFAULT_CONFIG[key])} wird verwendet.`,
      );
    }
  }

  return { config, warnings };
}
