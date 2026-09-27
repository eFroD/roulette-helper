// Builds the betting surface once at startup from the field catalogue.
// Nothing here changes after build; render.js only updates state attributes.

import { BET_FIELDS, fieldById } from "../domain/wheel.js";

function cell(field, extraClass = "") {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `cell ${extraClass}`.trim();
  el.dataset.fieldId = field.id;
  if (field.colour) el.dataset.colour = field.colour;
  el.dataset.state = "neutral";

  const label = document.createElement("span");
  label.className = "cell-label";
  label.textContent = field.feltLabel ?? field.label;
  el.append(label);

  const taps = document.createElement("span");
  taps.className = "taps";
  taps.hidden = true;
  el.append(taps);
  return el;
}

// ------------------------------------------------------------ felt geometry
//
// The French felt, as the dealer sees it on the table: 0 on top, twelve rows
// of three below it, the even chances flanking the numbers, the dozens on both
// sides, the columns at the bottom. Everything - numbers, outside bets, line
// zones - is one grid and every item is placed explicitly, so no two items can
// share a cell by construction (specs/003-french-layout/research.md R-201).
//
// Lines off (5 x 14):  columns  1 L | 2 c1 | 3 c2 | 4 c3 | 5 R
//                      rows     1 zero | 2..13 number rows | 14 columns
// Lines on  (8 x 26):  columns  1 L | 2 E (streets) | 3 c1 | 4 v12 | 5 c2 | 6 v23 | 7 c3 | 8 R
//                      rows     1 zero | 2 h0 | row k at 2k+1 | line under row k at 2k+2 | 26 columns
//
// If the host's felt has the sides or the street edge the other way round,
// the swap is here and nowhere else.

/** Top to bottom beside the numbers. The dozens appear on both sides. */
export const LEFT_SIDE = Object.freeze(["low", "even", "red", "dozen1", "dozen2", "dozen3"]);
export const RIGHT_SIDE = Object.freeze(["high", "odd", "black", "dozen1", "dozen2", "dozen3"]);

const rowOf = (n) => Math.floor((n - 1) / 3) + 1; // 1..12
const colOf = (n) => ({ 1: 1, 2: 2, 0: 3 })[n % 3]; // 1..3, smallest number left
const lineCol = (j) => 2 * j + 1; // number column j with lines on: 3, 5, 7
const EDGE = 2; // the street edge column with lines on
const H0 = 2; // the line between 0 and 1-2-3 with lines on

export function numberGridPlacement(n, { lineBets = false } = {}) {
  if (n === 0) return { row: "1", column: lineBets ? "3 / 8" : "2 / 5" };
  return lineBets
    ? { row: String(2 * rowOf(n) + 1), column: String(lineCol(colOf(n))) }
    : { row: String(rowOf(n) + 1), column: String(colOf(n) + 1) };
}

/** Every position of an outside bet: one for chances and columns, two for dozens (left first). */
export function sideGridPlacements(fieldId, { lineBets = false } = {}) {
  if (fieldId.startsWith("col")) {
    const j = Number(fieldId.slice(3));
    return [lineBets
      ? { row: "26", column: String(lineCol(j)) }
      : { row: "14", column: String(j + 1) }];
  }
  const band = (i) => (lineBets ? `${3 + 4 * i} / ${6 + 4 * i}` : `${2 + 2 * i} / ${4 + 2 * i}`);
  const out = [];
  const left = LEFT_SIDE.indexOf(fieldId);
  const right = RIGHT_SIDE.indexOf(fieldId);
  if (left >= 0) out.push({ row: band(left), column: "1" });
  if (right >= 0) out.push({ row: band(right), column: lineBets ? "8" : "5" });
  return out;
}

/** Where a line bet sits on the felt: the edge or corner between its numbers. */
export function lineGridPlacement(field) {
  const a = Math.min(...field.numbers.filter((n) => n > 0));
  const k = rowOf(a);
  const c = lineCol(colOf(a));
  const hasZero = field.numbers.includes(0);
  let row;
  let column;
  switch (field.type) {
    case "split":
      if (hasZero) [row, column] = [H0, c];
      else if (field.numbers[1] - field.numbers[0] === 1) [row, column] = [2 * k + 1, c + 1];
      else [row, column] = [2 * k + 2, c];
      break;
    case "corner": [row, column] = [2 * k + 2, c + 1]; break;
    case "trio": [row, column] = [H0, field.numbers.includes(1) ? 4 : 6]; break;
    case "street": [row, column] = [2 * k + 1, EDGE]; break;
    case "sixline": [row, column] = [2 * k + 2, EDGE]; break;
    case "basket": [row, column] = [H0, EDGE]; break;
    default: throw new Error(`unknown line type ${field.type}`);
  }
  return { row: String(row), column: String(column) };
}

function placeAt(el, { row, column }) {
  el.style.gridRow = row;
  el.style.gridColumn = column;
}

function zone(field) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "zone";
  el.dataset.fieldId = field.id;
  el.dataset.lineType = field.type;
  el.dataset.state = "neutral";
  el.title = field.label;
  el.setAttribute("aria-label", field.label);

  const taps = document.createElement("span");
  taps.className = "taps";
  taps.hidden = true;
  el.append(taps);
  return el;
}

function pick(field) {
  const el = cell(field, "pick");
  el.hidden = true;
  return el;
}

/**
 * Builds the board and returns Map<fieldId, HTMLElement[]>. A field can have
 * more than one element - a dozen sits on both sides of the felt, a line has
 * its zone AND its list entry - and render applies one state to all of them,
 * so two positions of one bet can never disagree.
 */
export function buildTableau({ tableau, lineList }, { lineBets = false } = {}) {
  tableau.replaceChildren();
  tableau.classList.add("french");
  const opts = { lineBets };

  for (let n = 0; n <= 36; n++) {
    const el = cell(fieldById(`n${n}`), n === 0 ? "zero" : "");
    placeAt(el, numberGridPlacement(n, opts));
    tableau.append(el);
  }

  for (const field of BET_FIELDS.filter((f) => f.kind === "outside")) {
    const extra = field.id.startsWith("col") ? "outside colbtn" : "outside";
    for (const at of sideGridPlacements(field.id, opts)) {
      const el = cell(field, extra);
      placeAt(el, at);
      tableau.append(el);
    }
  }

  if (lineBets) {
    tableau.classList.add("lines");
    for (const field of BET_FIELDS.filter((f) => f.kind === "line")) {
      const el = zone(field);
      placeAt(el, lineGridPlacement(field));
      tableau.append(el);
    }
  }

  // Built once, only ever shown or hidden by render: replacing a list entry
  // mid-press would drop the click that follows a long-press and swallow the
  // dealer's next tap (research R-104).
  if (lineBets && lineList) {
    lineList.replaceChildren();
    const hint = document.createElement("p");
    hint.className = "line-list-hint";
    hint.textContent = "Linienwetten erscheinen nach der Gewinnzahl";
    lineList.append(hint);
    for (const field of BET_FIELDS.filter((f) => f.kind === "line")) lineList.append(pick(field));
  }

  const byId = new Map();
  const containers = [tableau, ...(lineBets && lineList ? [lineList] : [])];
  for (const el of containers.flatMap((c) => [...c.children])) {
    const id = el.dataset.fieldId;
    if (!id) continue; // the list hint
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(el);
  }
  const expected = BET_FIELDS.filter((f) => lineBets || f.kind !== "line").length;
  if (byId.size !== expected) {
    console.error(`Tableau built ${byId.size} fields, expected ${expected}`);
  }
  return byId;
}
