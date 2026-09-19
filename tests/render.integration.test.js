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
    };
  }
  append(...nodes) { this.childNodes.push(...nodes); }
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
const { createRound, setWinningNumber, addStake } = await import("../public/js/domain/round.js");

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10 };

function mount() {
  const el = () => new El("div");
  const containers = { tableau: el(), dozens: el(), outside: el() };
  const cells = buildTableau(containers);
  return {
    status: el(), results: el(), total: el(), subtotals: el(),
    btnUndo: el(), btnChange: el(), btnNext: el(), cells,
  };
}

test("the tableau builds all 49 fields", () => {
  const els = mount();
  assert.equal(els.cells.size, 49);
  assert.ok(els.cells.has("n0") && els.cells.has("n36") && els.cells.has("col3"));
  assert.equal(els.cells.get("n0").classList.contains("zero"), true);
  assert.equal(els.cells.get("n1").dataset.colour, "red");
  assert.equal(els.cells.get("n17").dataset.colour, "black");
  assert.equal(els.cells.get("n0").dataset.colour, "green");
});

test("before a number is entered every field is neutral and enabled", () => {
  const els = mount();
  render(createRound(), CONFIG, els);
  for (const [, cell] of els.cells) {
    assert.equal(cell.dataset.state, "neutral");
    assert.equal(cell.disabled, false);
  }
  assert.match(els.status.textContent, /Gewinnzahl eingeben/);
  assert.equal(els.total.textContent, "0 €");
});

test("entering 17 marks exactly six winners and disables all 43 losers", () => {
  const els = mount();
  render(setWinningNumber(createRound(), 17), CONFIG, els);
  const winners = [...els.cells].filter(([, c]) => c.dataset.state === "winner").map(([id]) => id);
  assert.deepEqual(winners.sort(), ["black", "col2", "dozen2", "low", "n17", "odd"].sort());

  const losers = [...els.cells].filter(([, c]) => c.dataset.state === "loser");
  assert.equal(losers.length, 43);
  for (const [id, cell] of losers) {
    assert.equal(cell.disabled, true, `${id} must be disabled, not merely dimmed`);
  }
});

test("on zero only field 0 is reachable", () => {
  const els = mount();
  render(setWinningNumber(createRound(), 0), CONFIG, els);
  assert.equal(els.cells.get("n0").dataset.state, "winner");
  assert.equal(els.cells.get("n0").disabled, false);
  for (const [id, cell] of els.cells) {
    if (id === "n0") continue;
    assert.equal(cell.disabled, true, `${id} must be locked on zero`);
  }
});

test("an occupied field shows its tap badge and flips to the occupied state", () => {
  const els = mount();
  let round = setWinningNumber(createRound(), 19); // red, odd, high, dozen2, col1
  round = addStake(addStake(addStake(round, "red"), "red"), "red");
  render(round, CONFIG, els);

  const red = els.cells.get("red");
  assert.equal(red.dataset.state, "occupied");
  const badge = red.querySelector(".taps");
  assert.equal(badge.hidden, false);
  assert.equal(badge.textContent, "3x");
  assert.equal(els.cells.get("dozen2").dataset.state, "winner", "unstaked winners stay winners");
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
  for (const [id, cell] of els.cells) {
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
