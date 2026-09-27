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
//
// `label` names the bet in the result list; `feltLabel` is what the French
// felt prints (spec 003 FR-006/FR-007). Fields without one show `label`.
const OUTSIDE_DEFINITIONS = [
  { id: "low", label: "Manque (1–18)", feltLabel: "Manque", ratio: 1, wins: (n) => n >= 1 && n <= 18 },
  { id: "even", label: "Pair (Gerade)", feltLabel: "Pair", ratio: 1, wins: (n) => n > 0 && n % 2 === 0 },
  { id: "red", label: "Rouge (Rot)", feltLabel: "Rouge", ratio: 1, wins: (n) => n > 0 && RED_NUMBERS.has(n) },
  { id: "black", label: "Noir (Schwarz)", feltLabel: "Noir", ratio: 1, wins: (n) => n > 0 && !RED_NUMBERS.has(n) },
  { id: "odd", label: "Impair (Ungerade)", feltLabel: "Impair", ratio: 1, wins: (n) => n > 0 && n % 2 === 1 },
  { id: "high", label: "Passe (19–36)", feltLabel: "Passe", ratio: 1, wins: (n) => n >= 19 && n <= 36 },
  { id: "dozen1", label: "P12 (1. Dutzend)", feltLabel: "P12", ratio: 2, wins: (n) => n >= 1 && n <= 12 },
  { id: "dozen2", label: "M12 (2. Dutzend)", feltLabel: "M12", ratio: 2, wins: (n) => n >= 13 && n <= 24 },
  { id: "dozen3", label: "D12 (3. Dutzend)", feltLabel: "D12", ratio: 2, wins: (n) => n >= 25 && n <= 36 },
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

// ---------------------------------------------------------------- line bets
//
// Generated from the street structure (street s = 3s+1 .. 3s+3), never listed
// by hand: a hand-written list is exactly where a phantom split like 3/4 -
// adjacent in a list, not on the felt - would slip in.

/** Line types in selection-list order. */
export const LINE_TYPES = Object.freeze(["split", "street", "trio", "corner", "basket", "sixline"]);

const LINE_RATIOS = { split: 17, street: 11, trio: 11, corner: 8, basket: 8, sixline: 5 };

function lineLabel(type, numbers) {
  switch (type) {
    case "split": return `Split ${numbers.join("/")}`;
    case "corner": return `Corner ${numbers.join("/")}`;
    case "street": return `Street ${numbers.join("-")}`;
    case "trio": return `Trio ${numbers.join("-")}`;
    case "basket": return `Basket ${numbers.join("-")}`;
    case "sixline": return `Sixline ${numbers[0]}–${numbers[numbers.length - 1]}`;
    default: return numbers.join("/");
  }
}

function lineShapes() {
  const shapes = [];
  const add = (type, numbers) => shapes.push({ type, numbers });
  for (let s = 0; s < 12; s++) {
    const b = 3 * s + 1;
    add("split", [b, b + 1]);
    add("split", [b + 1, b + 2]);
    add("street", [b, b + 1, b + 2]);
  }
  for (let n = 1; n <= 33; n++) add("split", [n, n + 3]);
  for (const n of [1, 2, 3]) add("split", [0, n]);
  for (let s = 0; s < 11; s++) {
    const b = 3 * s + 1;
    add("corner", [b, b + 1, b + 3, b + 4]);
    add("corner", [b + 1, b + 2, b + 4, b + 5]);
    add("sixline", [b, b + 1, b + 2, b + 3, b + 4, b + 5]);
  }
  add("trio", [0, 1, 2]);
  add("trio", [0, 2, 3]);
  add("basket", [0, 1, 2, 3]);
  return shapes;
}

function compareNumbers(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

const LINE_FIELDS = lineShapes()
  .sort((a, b) => LINE_TYPES.indexOf(a.type) - LINE_TYPES.indexOf(b.type) || compareNumbers(a.numbers, b.numbers))
  .map(({ type, numbers }) => {
    const frozen = Object.freeze([...numbers]);
    return Object.freeze({
      id: `${type}-${frozen.join("-")}`,
      kind: "line",
      type,
      numbers: frozen,
      label: lineLabel(type, frozen),
      ratio: LINE_RATIOS[type],
      colour: undefined,
      number: undefined,
      wins: (w) => frozen.includes(w),
    });
  });

/**
 * All 157 bet fields: 37 numbers, 108 lines, 12 outside bets. Inside bets come
 * first so result cards list in the order a dealer pays.
 */
export const BET_FIELDS = Object.freeze([...NUMBER_FIELDS, ...LINE_FIELDS, ...OUTSIDE_FIELDS]);

const BY_ID = new Map(BET_FIELDS.map((f) => [f.id, f]));

export function fieldById(id) {
  return BY_ID.get(id);
}

/**
 * For n in 1-36: the 6 non-line winners (the number, its colour, parity, half,
 * dozen and column) plus every line containing n - 11 to 17 ids in all. For 0:
 * the field 0 and the six lines touching it; every outside bet loses. Empty
 * for anything else. Catalogue order.
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
