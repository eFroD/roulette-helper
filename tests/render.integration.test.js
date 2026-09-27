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
const { createRound, setWinningNumber, addStake, undo } = await import("../public/js/domain/round.js");

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10 };

function mount(options) {
  const el = () => new El("div");
  const containers = { tableau: el(), dozens: el(), outside: el(), lineList: el() };
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

test("no two zones share a grid cell, and no zone sits on a number cell (FR-021)", () => {
  const els = mount({ lineBets: true });
  const zones = lineIdsOf(els).map((id) => place(zoneOf(els, id)));
  assert.equal(new Set(zones).size, 108, "zones overlap each other");
  const numberCells = new Set();
  for (let n = 1; n <= 36; n++) numberCells.add(place(one(els, `n${n}`)));
  for (const k of [1, 2, 3]) numberCells.add(place(one(els, `col${k}`)));
  assert.equal(numberCells.size, 39, "number cells must be explicitly placed");
  for (const z of zones) assert.equal(numberCells.has(z), false, `zone at ${z} overlaps a cell`);
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

test("lineBets false builds exactly the pre-line board (FR-028)", () => {
  const els = mount({ lineBets: false });
  assert.equal(els.cells.size, 49);
  for (const [id, list] of els.cells) assert.equal(list.length, 1, `${id} has one element`);
  const all = [...els.cells.values()].flat();
  assert.equal(all.some((el) => el.classList.contains("zone") || el.classList.contains("pick")), false);
  assert.equal(els.tableau.classList.contains("lines"), false);
  assert.equal(all.some((el) => el.style.gridRow !== undefined), false, "no inline placement");
  assert.equal(els.lineList.children.length, 0);
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
