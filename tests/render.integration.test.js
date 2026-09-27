// Integration test for the render layer.
//
// HONEST SCOPE: this drives tableau.js and render.js against a minimal DOM
// stand-in, not a real browser. It proves the render LOGIC - which field gets
// which state, which fields are disabled, what figures reach the panel. It
// does NOT prove layout, contrast, touch-target size or gesture handling;
// those remain the on-device checks in quickstart.md.
import { test } from "node:test";
import assert from "node:assert/strict";

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.dataset = {};
    this.style = {};
    this.className = "";
    this.hidden = false;
    this.disabled = false;
    this._text = null;
  }
  get classList() {
    return {
      add: (...c) => { this.className = `${this.className} ${c.join(" ")}`.trim(); },
      contains: (c) => this.className.split(/\s+/).filter(Boolean).includes(c),
      toggle: (c, on) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        if (on) set.add(c); else set.delete(c);
        this.className = [...set].join(" ");
      },
    };
  }
  append(...nodes) { this.childNodes.push(...nodes); }
  setAttribute(name, value) { this[`attr:${name}`] = String(value); }
  replaceChildren(...nodes) { this.childNodes = nodes; this._text = null; }
  set textContent(v) { this.childNodes = []; this._text = String(v); }
  get textContent() {
    if (this._text !== null) return this._text;
    return this.childNodes.map((c) => (typeof c === "string" ? c : c.textContent)).join("");
  }
  get children() { return this.childNodes.filter((c) => typeof c !== "string"); }
  querySelector(sel) {
    const cls = sel.replace(/^\./, "");
    const walk = (node) => {
      for (const c of node.children) {
        if (c.classList.contains(cls)) return c;
        const found = walk(c);
        if (found) return found;
      }
      return null;
    };
    return walk(this);
  }
}

globalThis.document = {
  createElement: (tag) => new El(tag),
  createTextNode: (t) => String(t),
};

const { buildTableau } = await import("../public/js/ui/tableau.js");
const { render } = await import("../public/js/ui/render.js");
const { createRound, setWinningNumber, addStake, undo, clearField } = await import("../public/js/domain/round.js");
const { fieldById } = await import("../public/js/domain/wheel.js");

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10 };

function mount(options) {
  const el = () => new El("div");
  const containers = { tableau: el(), lineList: el() };
  const cells = buildTableau(containers, options);
  return {
    status: el(), results: el(), total: el(), subtotals: el(),
    btnUndo: el(), btnChange: el(), btnNext: el(), cells,
    tableau: containers.tableau, lineList: containers.lineList,
  };
}

// The map holds every element of a field; before line bets that is exactly one.
const one = (els, id) => els.cells.get(id)[0];
const firsts = (els) => [...els.cells].map(([id, list]) => [id, list[0]]);

// Expands an element's inline grid placement ("2 / 4" is end-exclusive, "5" is
// one track) into the "row|col" cells it covers.
function cellsOf(el) {
  const span = (v) => {
    const [a, b] = String(v).split("/").map((x) => Number(x.trim()));
    return Array.from({ length: (b ?? a + 1) - a }, (_, i) => a + i);
  };
  return span(el.style.gridRow).flatMap((r) => span(el.style.gridColumn).map((c) => `${r}|${c}`));
}

function assertNoSharedCell(elements) {
  const taken = new Map();
  for (const el of elements) {
    for (const cell of cellsOf(el)) {
      assert.equal(taken.has(cell), false, `${el.dataset.fieldId} and ${taken.get(cell)} share ${cell}`);
      taken.set(cell, el.dataset.fieldId);
    }
  }
}

test("the tableau builds all 49 fields", () => {
  const els = mount();
  assert.equal(els.cells.size, 49);
  assert.ok(els.cells.has("n0") && els.cells.has("n36") && els.cells.has("col3"));
  assert.equal(one(els, "n0").classList.contains("zero"), true);
  assert.equal(one(els, "n1").dataset.colour, "red");
  assert.equal(one(els, "n17").dataset.colour, "black");
  assert.equal(one(els, "n0").dataset.colour, "green");
});

test("before a number is entered every field is neutral and enabled", () => {
  const els = mount();
  render(createRound(), CONFIG, els);
  for (const [, cell] of firsts(els)) {
    assert.equal(cell.dataset.state, "neutral");
    assert.equal(cell.disabled, false);
  }
  assert.match(els.status.textContent, /Gewinnzahl eingeben/);
  assert.equal(els.total.textContent, "0 €");
});

test("entering 17 marks exactly six winners and disables all 43 losers", () => {
  const els = mount();
  render(setWinningNumber(createRound(), 17), CONFIG, els);
  const winners = firsts(els).filter(([, c]) => c.dataset.state === "winner").map(([id]) => id);
  assert.deepEqual(winners.sort(), ["black", "col2", "dozen2", "low", "n17", "odd"].sort());

  const losers = firsts(els).filter(([, c]) => c.dataset.state === "loser");
  assert.equal(losers.length, 43);
  for (const [id, cell] of losers) {
    assert.equal(cell.disabled, true, `${id} must be disabled, not merely dimmed`);
  }
});

test("on zero only field 0 is reachable", () => {
  const els = mount();
  render(setWinningNumber(createRound(), 0), CONFIG, els);
  assert.equal(one(els, "n0").dataset.state, "winner");
  assert.equal(one(els, "n0").disabled, false);
  for (const [id, cell] of firsts(els)) {
    if (id === "n0") continue;
    assert.equal(cell.disabled, true, `${id} must be locked on zero`);
  }
});

test("an occupied field shows its tap badge and flips to the occupied state", () => {
  const els = mount();
  let round = setWinningNumber(createRound(), 19); // red, odd, high, dozen2, col1
  round = addStake(addStake(addStake(round, "red"), "red"), "red");
  render(round, CONFIG, els);

  const red = one(els, "red");
  assert.equal(red.dataset.state, "occupied");
  const badge = red.querySelector(".taps");
  assert.equal(badge.hidden, false);
  assert.equal(badge.textContent, "3x");
  assert.equal(one(els, "dozen2").dataset.state, "winner", "unstaked winners stay winners");
});

test("the panel shows stake, win, total and the per-chip line", () => {
  const els = mount();
  let round = setWinningNumber(createRound(), 19);
  for (let i = 0; i < 4; i++) round = addStake(round, "red");
  render(round, CONFIG, els);

  const text = els.results.textContent;
  assert.match(text, /Rot/);
  assert.match(text, /4 x 10 €/);
  assert.match(text, /Einsatz 40 €/);
  assert.match(text, /Gewinn 40 €/);
  assert.match(text, /80 €/);
  assert.match(text, /pro Chip: 10 € Gewinn/);
});

test("the round total is the sum of the field totals", () => {
  const els = mount();
  let round = setWinningNumber(createRound(), 19);
  for (let i = 0; i < 4; i++) round = addStake(round, "red"); // 80
  for (let i = 0; i < 3; i++) round = addStake(round, "dozen2"); // 90
  round = addStake(addStake(round, "n19"), "n19"); // 360
  render(round, CONFIG, els);

  assert.equal(els.total.textContent, "530 €");
  assert.match(els.subtotals.textContent, /Einsatz 80 € \+ Gewinn 450 €/);
});

test("buttons enable and disable with the round state", () => {
  const els = mount();
  render(createRound(), CONFIG, els);
  assert.equal(els.btnUndo.disabled, true, "nothing to undo on a fresh round");
  assert.equal(els.btnChange.disabled, true, "no number to change yet");

  let round = addStake(setWinningNumber(createRound(), 19), "red");
  render(round, CONFIG, els);
  assert.equal(els.btnUndo.disabled, false);
  assert.equal(els.btnChange.disabled, false);
});

test("while picking a replacement number the whole board unlocks", () => {
  const els = mount();
  const round = addStake(setWinningNumber(createRound(), 19), "red");
  render(round, CONFIG, els, { pickingNumber: true });

  assert.match(els.status.textContent, /Neue Gewinnzahl eingeben/);
  for (const [id, cell] of firsts(els)) {
    assert.equal(cell.disabled, false, `${id} must be reachable when choosing a new number`);
  }
  assert.equal(els.btnChange.disabled, true, "cannot re-enter change mode while in it");
});

test("the currency symbol from config is used verbatim", () => {
  const els = mount();
  const cfg = { ...CONFIG, currencySymbol: "CHF" };
  let round = setWinningNumber(createRound(), 19);
  round = addStake(round, "red");
  render(round, cfg, els);
  assert.match(els.results.textContent, /Einsatz 10 CHF/);
  assert.equal(els.total.textContent, "20 CHF");
});

// ------------------------------------------------------------ line bets (002)

const zoneOf = (els, id) => els.cells.get(id).find((el) => el.classList.contains("zone"));
const lineIdsOf = (els) => [...els.cells.keys()].filter((id) => id.includes("-"));
const place = (el) => `${el.style.gridRow}|${el.style.gridColumn}`;

test("with lineBets on, every line has a placed zone on the tableau", () => {
  const els = mount({ lineBets: true });
  assert.equal(els.cells.size, 157);
  assert.equal(els.tableau.classList.contains("lines"), true);
  const ids = lineIdsOf(els);
  assert.equal(ids.length, 108);
  for (const id of ids) {
    const zone = zoneOf(els, id);
    assert.ok(zone, `${id} needs a zone`);
    assert.ok(zone.style.gridRow && zone.style.gridColumn, `${id} zone must be placed`);
    assert.equal(zone.dataset.fieldId, id);
  }
});

test("lines on: no two tableau elements share a grid cell", () => {
  const els = mount({ lineBets: true });
  assert.equal(els.cells.size, 157);
  assert.equal([...els.cells.values()].flat().length, 268);
  assert.equal(els.tableau.children.length, 160);
  assertNoSharedCell(els.tableau.children);
});

test("lines on: zones sit between exactly their numbers (SC-003)", () => {
  const els = mount({ lineBets: true });
  const numberAt = new Map();
  for (let n = 0; n <= 36; n++) for (const c of cellsOf(one(els, `n${n}`))) numberAt.set(c, n);
  const at = (r, c) => numberAt.get(`${r}|${c}`);
  const sorted = (xs) => [...new Set(xs.filter((x) => x !== undefined))].sort((a, b) => a - b);

  for (const id of lineIdsOf(els)) {
    const field = fieldById(id);
    const [r, c] = [Number(zoneOf(els, id).style.gridRow), Number(zoneOf(els, id).style.gridColumn)];
    let found;
    switch (field.type) {
      case "split": case "corner": case "trio":
        found = [-1, 0, 1].flatMap((dr) => [-1, 0, 1].map((dc) => at(r + dr, c + dc)));
        break;
      case "street":
        assert.equal(c, 2, `${id} on the street edge`);
        found = [3, 5, 7].map((col) => at(r, col));
        break;
      case "sixline":
        assert.equal(c, 2, `${id} on the street edge`);
        found = [r - 1, r + 1].flatMap((row) => [3, 5, 7].map((col) => at(row, col)));
        break;
      case "basket":
        assert.deepEqual([r, c], [2, 2]);
        continue;
    }
    assert.deepEqual(sorted(found), [...field.numbers].sort((a, b) => a - b), `${id} at ${r}|${c}`);
  }

  // The worked example of data-model section 4.
  assert.equal(place(one(els, "n17")), "13|5");
  for (const [id, cell] of [
    ["split-16-17", "13|4"], ["split-17-18", "13|6"], ["split-14-17", "12|5"], ["split-17-20", "14|5"],
    ["street-16-17-18", "13|2"], ["sixline-13-14-15-16-17-18", "12|2"], ["basket-0-1-2-3", "2|2"],
    ["trio-0-1-2", "2|4"], ["split-0-3", "2|7"],
  ]) assert.equal(place(zoneOf(els, id)), cell, id);
});

test("zones are neutral before a number, then 11 winners and 97 disabled losers for 17", () => {
  const els = mount({ lineBets: true });
  render(createRound(), CONFIG, els);
  for (const id of lineIdsOf(els)) {
    assert.equal(zoneOf(els, id).dataset.state, "neutral");
    assert.equal(zoneOf(els, id).disabled, false);
  }
  render(setWinningNumber(createRound(), 17), CONFIG, els);
  const zones = lineIdsOf(els).map((id) => zoneOf(els, id));
  assert.equal(zones.filter((z) => z.dataset.state === "winner").length, 11);
  const losers = zones.filter((z) => z.dataset.state === "loser");
  assert.equal(losers.length, 97);
  assert.ok(losers.every((z) => z.disabled));
});

test("on zero exactly the six zero lines are winning zones", () => {
  const els = mount({ lineBets: true });
  render(setWinningNumber(createRound(), 0), CONFIG, els);
  const winners = lineIdsOf(els).filter((id) => zoneOf(els, id).dataset.state === "winner");
  assert.deepEqual(winners.sort(), [
    "basket-0-1-2-3", "split-0-1", "split-0-2", "split-0-3", "trio-0-1-2", "trio-0-2-3",
  ]);
});

test("a line result card shows its label and all four figures; the total includes it", () => {
  const els = mount({ lineBets: true });
  let round = setWinningNumber(createRound(), 17);
  round = addStake(addStake(round, "split-16-17"), "split-16-17");
  round = addStake(round, "n17");
  render(round, CONFIG, els);
  const text = els.results.textContent;
  assert.match(text, /Split 16\/17/);
  assert.match(text, /2 x 5 €/);
  assert.match(text, /Einsatz 10 €/);
  assert.match(text, /Gewinn 170 €/);
  assert.match(text, /180 €/);
  assert.match(text, /pro Chip: 85 € Gewinn/);
  // split 180 + one tap on n17 (5 stake + 175 win) = 360
  assert.equal(els.total.textContent, "360 €");
});

// ------------------------------------------------------ selection list (US3)

const picks = (els) => els.lineList.children.filter((el) => el.classList.contains("pick"));
const hint = (els) => els.lineList.children.find((el) => el.classList.contains("line-list-hint"));
const visiblePickIds = (els) => picks(els).filter((p) => !p.hidden).map((p) => p.dataset.fieldId);

test("the list holds one entry per line plus a hint, all hidden before a number", () => {
  const els = mount({ lineBets: true });
  render(createRound(), CONFIG, els);
  assert.equal(picks(els).length, 108);
  assert.ok(hint(els), "the list needs a hint element");
  assert.deepEqual(visiblePickIds(els), []);
  assert.equal(hint(els).hidden, false);
});

test("after 17 the list shows exactly its 11 winning lines, in list order", () => {
  const els = mount({ lineBets: true });
  render(setWinningNumber(createRound(), 17), CONFIG, els);
  assert.deepEqual(visiblePickIds(els), [
    "split-14-17", "split-16-17", "split-17-18", "split-17-20", "street-16-17-18",
    "corner-13-14-16-17", "corner-14-15-17-18", "corner-16-17-19-20", "corner-17-18-20-21",
    "sixline-13-14-15-16-17-18", "sixline-16-17-18-19-20-21",
  ]);
  assert.equal(hint(els).hidden, true);
  assert.match(picks(els).find((p) => p.dataset.fieldId === "split-16-17").textContent, /Split 16\/17/);
});

test("zone and list entry of one line always show the same state and count (FR-020a)", () => {
  const els = mount({ lineBets: true });
  render(addStake(setWinningNumber(createRound(), 17), "split-16-17"), CONFIG, els);
  const both = els.cells.get("split-16-17");
  assert.equal(both.length, 2, "a line has a zone and a list entry");
  for (const el of both) {
    assert.equal(el.dataset.state, "occupied");
    assert.equal(el.querySelector(".taps").textContent, "1x");
  }
});

test("while picking a new number the list hides again and the hint returns", () => {
  const els = mount({ lineBets: true });
  const round = addStake(setWinningNumber(createRound(), 17), "split-16-17");
  render(round, CONFIG, els, { pickingNumber: true });
  assert.deepEqual(visiblePickIds(els), []);
  assert.equal(hint(els).hidden, false);
});

// ------------------------------------------------------- switched off (US4)

test("lineBets false builds the French board: 49 ids, 52 elements", () => {
  const els = mount({ lineBets: false });
  assert.equal(els.cells.size, 49);
  for (const [id, list] of els.cells) {
    assert.equal(list.length, id.startsWith("dozen") ? 2 : 1, `${id} element count`);
  }
  const all = [...els.cells.values()].flat();
  assert.equal(all.some((el) => el.classList.contains("zone") || el.classList.contains("pick")), false);
  assert.equal(els.tableau.classList.contains("french"), true);
  assert.equal(els.tableau.classList.contains("lines"), false);
  for (const el of all) {
    assert.ok(el.style.gridRow && el.style.gridColumn, `${el.dataset.fieldId} must be placed`);
  }
  assert.equal(els.lineList.children.length, 0);
});

test("lines off: no two tableau elements share a grid cell", () => {
  const els = mount({ lineBets: false });
  assert.equal(els.tableau.children.length, 52);
  assertNoSharedCell(els.tableau.children);
});

test("lines off: placements follow the French felt (FR-001, FR-002, FR-005)", () => {
  const els = mount({ lineBets: false });
  const at = (el) => `${el.style.gridRow}|${el.style.gridColumn}`;
  const all = (id) => els.cells.get(id).map(at);
  assert.equal(at(one(els, "n0")), "1|2 / 5");
  assert.equal(at(one(els, "n1")), "2|2");
  assert.equal(at(one(els, "n3")), "2|4");
  assert.equal(at(one(els, "n34")), "13|2");
  assert.equal(at(one(els, "n36")), "13|4");
  assert.deepEqual(all("low"), ["2 / 4|1"]);
  assert.deepEqual(all("high"), ["2 / 4|5"]);
  assert.deepEqual(all("red"), ["6 / 8|1"]);
  assert.deepEqual(all("black"), ["6 / 8|5"]);
  assert.deepEqual(all("dozen3"), ["12 / 14|1", "12 / 14|5"]);
  assert.deepEqual(all("col1"), ["14|2"]);
  assert.deepEqual(all("col3"), ["14|4"]);

  const text = (id) => one(els, id).querySelector(".cell-label").textContent;
  assert.equal(text("low"), "Manque");
  assert.equal(text("dozen1"), "P12");
  assert.equal(one(els, "n0").classList.contains("zero"), true);
});

test("lineBets false: 17 gives the six 001 winners and 43 losers, 0 only field 0", () => {
  const els = mount({ lineBets: false });
  render(setWinningNumber(createRound(), 17), CONFIG, els);
  const states = firsts(els).map(([, c]) => c.dataset.state);
  assert.equal(states.filter((st) => st === "winner").length, 6);
  assert.equal(states.filter((st) => st === "loser").length, 43);
  render(setWinningNumber(createRound(), 0), CONFIG, els);
  const reachable = firsts(els).filter(([, c]) => !c.disabled).map(([id]) => id);
  assert.deepEqual(reachable, ["n0"]);
});

// ------------------------------------------------------ compact results (US5)

// ------------------------------------------------ French felt (003 US2, US3)

test("both dozen positions are one bet (FR-004, US2 AC1-2)", () => {
  const els = mount({ lineBets: false });
  let round = setWinningNumber(createRound(), 5);
  render(round, CONFIG, els);
  for (const el of els.cells.get("dozen1")) assert.equal(el.dataset.state, "winner");
  for (const el of [...els.cells.get("dozen2"), ...els.cells.get("dozen3")]) {
    assert.equal(el.dataset.state, "loser");
    assert.equal(el.disabled, true);
  }
  round = addStake(addStake(round, "dozen1"), "dozen1");
  render(round, CONFIG, els);
  for (const el of els.cells.get("dozen1")) {
    assert.equal(el.dataset.state, "occupied");
    assert.equal(el.querySelector(".taps").textContent, "2x");
  }
  const cards = els.results.children.filter((c) => c.classList.contains("result"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /P12 \(1\. Dutzend\)/);
});

test("on zero every dozen and column position is locked (US2 AC3)", () => {
  const els = mount({ lineBets: false });
  render(setWinningNumber(createRound(), 0), CONFIG, els);
  const positions = ["dozen1", "dozen2", "dozen3", "col1", "col2", "col3"].flatMap((id) => els.cells.get(id));
  assert.equal(positions.length, 9);
  for (const el of positions) {
    assert.equal(el.dataset.state, "loser");
    assert.equal(el.disabled, true);
  }
});

test("clearing a dozen empties both positions (US2 AC4)", () => {
  const els = mount({ lineBets: false });
  const round = addStake(setWinningNumber(createRound(), 5), "dozen1");
  render(clearField(round, "dozen1"), CONFIG, els);
  for (const el of els.cells.get("dozen1")) {
    assert.equal(el.dataset.state, "winner");
    assert.equal(el.querySelector(".taps").hidden, true);
  }
});

test("result cards show French and German, the rest stays German (US3 AC1, FR-008)", () => {
  const els = mount({ lineBets: false });
  let round = setWinningNumber(createRound(), 14);
  for (const id of ["low", "even", "red", "dozen2"]) round = addStake(round, id);
  render(round, CONFIG, els);
  const text = els.results.textContent;
  for (const label of ["Manque (1–18)", "Pair (Gerade)", "Rouge (Rot)", "M12 (2. Dutzend)"]) {
    assert.ok(text.includes(label), `result list shows ${label}`);
  }
  assert.match(els.status.textContent, /Gewinnzahl/);
});

test("results turn compact above five occupied fields, and back again on undo", () => {
  const els = mount({ lineBets: true });
  let round = setWinningNumber(createRound(), 17);
  for (const id of ["n17", "black", "odd", "split-16-17", "street-16-17-18"]) round = addStake(round, id);
  render(round, CONFIG, els);
  assert.equal(els.results.classList.contains("compact"), false, "5 occupied: full cards");
  round = addStake(round, "corner-16-17-19-20");
  render(round, CONFIG, els);
  assert.equal(els.results.classList.contains("compact"), true, "6 occupied: compact");
  render(undo(round), CONFIG, els);
  assert.equal(els.results.classList.contains("compact"), false, "back to 5: full cards");
});
