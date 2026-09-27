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
  label.textContent = field.label;
  el.append(label);

  const taps = document.createElement("span");
  taps.className = "taps";
  taps.hidden = true;
  el.append(taps);
  return el;
}

/**
 * Builds the board and returns Map<fieldId, HTMLElement[]>. A field can have
 * more than one element (a line has its zone AND its list entry); render
 * applies one state to all of them, so the two routes can never disagree.
 *
 * With lineBets false (the default) the output is exactly the pre-line board.
 */
// ------------------------------------------------------- line-bet geometry
//
// With line bets on, the number area becomes an interleaved grid: thin line
// tracks sit between the number tracks, and every line bet owns exactly one
// thin grid cell. Grid items do not overlap unless told to, so no zone can
// ever steal a tap from a number cell (FR-021) - by construction, not by
// pixel arithmetic. See specs/002-line-bets/research.md R-103.
//
// Columns: 1 zero | 2 v0 | 3 c1 | 4 v1 | ... | 24 v11 | 25 c12 | 26 2:1
// Rows:    1 r3 (3,6..36) | 2 h32 | 3 r2 | 4 h21 | 5 r1 (1,4..34) | 6 hb (edge)
const ROW_OF_NUMBER = { 0: 1, 2: 3, 1: 5 }; // n % 3 -> row track
const H32 = 2;
const H21 = 4;
const EDGE = 6;
const V0 = 2;
const street = (n) => Math.floor((n - 1) / 3);
const numberColumn = (n) => 2 * street(n) + 3;
const lineColumnAfter = (n) => 2 * street(n) + 4; // the line right of n's street

export function numberGridPlacement(n) {
  if (n === 0) return { row: "1 / 6", column: "1" };
  return { row: String(ROW_OF_NUMBER[n % 3]), column: String(numberColumn(n)) };
}

export function columnButtonPlacement(k) {
  return { row: String(ROW_OF_NUMBER[k % 3]), column: "26" };
}

/** Where a line bet sits: the edge or corner between its numbers. */
export function lineGridPlacement(field) {
  const [a, b] = field.numbers;
  const low = field.numbers.find((n) => n > 0);
  const between = (n) => (n % 3 === 2 ? H32 : H21); // line under n's row
  let row;
  let column;
  switch (field.type) {
    case "split":
      if (a === 0) [row, column] = [ROW_OF_NUMBER[b % 3], V0];
      else if (b === a + 1) [row, column] = [between(a), numberColumn(a)];
      else [row, column] = [ROW_OF_NUMBER[a % 3], lineColumnAfter(a)];
      break;
    case "corner": [row, column] = [between(a), lineColumnAfter(a)]; break;
    case "trio": [row, column] = [field.numbers.includes(1) ? H21 : H32, V0]; break;
    case "street": [row, column] = [EDGE, numberColumn(low)]; break;
    case "sixline": [row, column] = [EDGE, lineColumnAfter(low)]; break;
    case "basket": [row, column] = [EDGE, V0]; break;
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

export function buildTableau({ tableau, dozens, outside, lineList }, { lineBets = false } = {}) {
  tableau.replaceChildren();
  dozens.replaceChildren();
  outside.replaceChildren();

  // Zero spans all three rows on the left, as on a real table.
  tableau.append(cell(fieldById("n0"), "zero"));

  // Rows run 3,6..36 / 2,5..35 / 1,4..34 - i.e. column 3, then 2, then 1.
  for (const offset of [3, 2, 1]) {
    for (let n = offset; n <= 36; n += 3) tableau.append(cell(fieldById(`n${n}`)));
    tableau.append(cell(fieldById(`col${offset}`), "colbtn outside"));
  }

  if (lineBets) {
    tableau.classList.add("lines");
    for (const el of [...tableau.children]) {
      const field = fieldById(el.dataset.fieldId);
      placeAt(el, field.kind === "number"
        ? numberGridPlacement(field.number)
        : columnButtonPlacement(Number(field.id.slice(3))));
    }
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

  for (const id of ["dozen1", "dozen2", "dozen3"]) dozens.append(cell(fieldById(id), "outside"));
  dozens.classList.add("dozens");

  for (const id of ["low", "even", "red", "black", "odd", "high"]) {
    outside.append(cell(fieldById(id), "outside"));
  }

  const byId = new Map();
  const containers = [tableau, dozens, outside, ...(lineBets && lineList ? [lineList] : [])];
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
