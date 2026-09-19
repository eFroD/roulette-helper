// Wheel geometry and the bet-field catalogue.
//
// PURE MODULE: no document, no window, no navigator, no timers. This file is
// imported unchanged by both the browser and `node --test`.

/** The 18 red numbers of a European wheel. Everything else in 1-36 is black. */
export const RED_NUMBERS = Object.freeze(
  new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]),
);

/** A winning number is an integer 0-36. Anything else is not a number on this wheel. */
export function isValidNumber(n) {
  return Number.isInteger(n) && n >= 0 && n <= 36;
}

export function colourOf(n) {
  if (!isValidNumber(n)) return undefined;
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

// Every outside bet below tests `n > 0` (or an explicit range starting at 1).
// That single condition is the whole of the zero rule: on 0 all outside bets
// lose in full, and only the straight bet on 0 wins. No La Partage, no En Prison.
const OUTSIDE_DEFINITIONS = [
  { id: "low", label: "1–18", ratio: 1, wins: (n) => n >= 1 && n <= 18 },
  { id: "even", label: "Gerade", ratio: 1, wins: (n) => n > 0 && n % 2 === 0 },
  { id: "red", label: "Rot", ratio: 1, wins: (n) => n > 0 && RED_NUMBERS.has(n) },
  { id: "black", label: "Schwarz", ratio: 1, wins: (n) => n > 0 && !RED_NUMBERS.has(n) },
  { id: "odd", label: "Ungerade", ratio: 1, wins: (n) => n > 0 && n % 2 === 1 },
  { id: "high", label: "19–36", ratio: 1, wins: (n) => n >= 19 && n <= 36 },
  { id: "dozen1", label: "1. Dutzend", ratio: 2, wins: (n) => n >= 1 && n <= 12 },
  { id: "dozen2", label: "2. Dutzend", ratio: 2, wins: (n) => n >= 13 && n <= 24 },
  { id: "dozen3", label: "3. Dutzend", ratio: 2, wins: (n) => n >= 25 && n <= 36 },
  { id: "col1", label: "1. Kolonne", ratio: 2, wins: (n) => n > 0 && n % 3 === 1 },
  { id: "col2", label: "2. Kolonne", ratio: 2, wins: (n) => n > 0 && n % 3 === 2 },
  { id: "col3", label: "3. Kolonne", ratio: 2, wins: (n) => n > 0 && n % 3 === 0 },
];

const NUMBER_FIELDS = Array.from({ length: 37 }, (_, n) =>
  Object.freeze({
    id: `n${n}`,
    kind: "number",
    label: String(n),
    ratio: 35,
    colour: colourOf(n),
    number: n,
    wins: (w) => w === n,
  }),
);

const OUTSIDE_FIELDS = OUTSIDE_DEFINITIONS.map((f) =>
  Object.freeze({ ...f, kind: "outside", colour: undefined, number: undefined }),
);

/** All 49 bet fields: 37 numbers then 12 outside bets. Order is render order. */
export const BET_FIELDS = Object.freeze([...NUMBER_FIELDS, ...OUTSIDE_FIELDS]);

const BY_ID = new Map(BET_FIELDS.map((f) => [f.id, f]));

export function fieldById(id) {
  return BY_ID.get(id);
}

/**
 * Exactly 6 ids for any n in 1-36 (the number, its colour, parity, half,
 * dozen and column). Exactly ["n0"] for 0. Empty for anything else.
 */
export function winningFieldIds(n) {
  if (!isValidNumber(n)) return [];
  return BET_FIELDS.filter((f) => f.wins(n)).map((f) => f.id);
}

export function isWinner(fieldId, n) {
  if (!isValidNumber(n)) return false;
  const field = BY_ID.get(fieldId);
  return field !== undefined && field.wins(n);
}
