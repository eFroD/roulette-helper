// The single writer to the DOM. Called after every action, so a displayed
// figure can never drift from the round state that produced it.

import { colourOf, fieldById, winningFieldIds } from "../domain/wheel.js";
import { resultFor, roundTotals } from "../domain/payout.js";
import { needsConfirmation, occupiedFields } from "../domain/round.js";

const COLOUR_WORD = { red: "Rot", black: "Schwarz", green: "Null" };

export function money(value, symbol) {
  const rounded = Math.round(value * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)} ${symbol}`;
}

function renderStatus(el, round, picking) {
  if (picking) {
    el.textContent = "Neue Gewinnzahl eingeben";
    return;
  }
  if (round.winningNumber === null) {
    el.textContent = "Gewinnzahl eingeben";
    return;
  }
  const colour = colourOf(round.winningNumber);
  el.replaceChildren(document.createTextNode("Gewinnzahl"));
  const swatch = document.createElement("span");
  swatch.className = "swatch";
  swatch.dataset.colour = colour;
  swatch.style.background = `var(--${colour})`;
  swatch.textContent = round.winningNumber;
  swatch.title = COLOUR_WORD[colour];
  el.append(swatch);
}

function applyState(el, state, taps) {
  el.dataset.state = state;
  el.disabled = state === "loser";
  const badge = el.querySelector(".taps");
  badge.hidden = taps === 0;
  badge.textContent = taps > 0 ? `${taps}x` : "";
}

function renderFields(cells, round, picking) {
  const winners = new Set(winningFieldIds(round.winningNumber));
  // While a new number is being picked the whole board must be reachable -
  // otherwise the old winner set would lock away the number actually needed.
  const awaiting = picking || round.winningNumber === null;

  for (const [id, elements] of cells) {
    const taps = round.stakes[id] ?? 0;
    const state = awaiting ? "neutral" : !winners.has(id) ? "loser" : taps > 0 ? "occupied" : "winner";
    for (const el of elements) applyState(el, state, taps);
  }
}

// The list shows only what can be staked right now: the winning lines, once a
// number is set and not while a replacement is being picked.
function renderLineList(list, round, picking) {
  const items = [...list.children];
  if (items.length === 0) return;
  const awaiting = picking || round.winningNumber === null;
  const winners = new Set(awaiting ? [] : winningFieldIds(round.winningNumber));
  for (const el of items) {
    if (el.classList.contains("line-list-hint")) el.hidden = !awaiting;
    else el.hidden = !winners.has(el.dataset.fieldId);
  }
}

function resultCard(result, symbol) {
  const card = document.createElement("div");
  card.className = "result";

  const head = document.createElement("div");
  head.className = "result-head";
  const name = document.createElement("span");
  name.className = "result-name";
  name.textContent = result.label;
  const taps = document.createElement("span");
  taps.className = "result-taps";
  taps.textContent = `${result.taps} x ${money(result.unit, symbol)}`;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "result-clear";
  clear.dataset.clearField = result.fieldId;
  clear.title = `${result.label} leeren`;
  clear.textContent = "×";
  // Shown only in the compact layout, where the payout moves up into the head.
  const headTotal = document.createElement("span");
  headTotal.className = "result-total";
  headTotal.textContent = money(result.total, symbol);
  head.append(name, taps, headTotal, clear);

  const figures = document.createElement("div");
  figures.className = "result-figures";
  figures.append(
    document.createTextNode(`Einsatz ${money(result.stake, symbol)} → `),
  );
  const win = document.createElement("span");
  win.className = "win";
  win.textContent = `Gewinn ${money(result.win, symbol)}`;
  const figTotal = document.createElement("span");
  figTotal.className = "fig-total";
  figTotal.textContent = ` → ${money(result.total, symbol)}`;
  figures.append(win, figTotal);

  const perChip = document.createElement("div");
  perChip.className = "result-perchip";
  perChip.append(document.createTextNode("pro Chip: "));
  const strong = document.createElement("strong");
  strong.textContent = `${money(result.perChip, symbol)} Gewinn`;
  perChip.append(strong);

  // The compact layout's one-line summary: stake, win and per-chip stay
  // separate figures, the total sits large in the head.
  const compact = document.createElement("div");
  compact.className = "result-compact";
  compact.append(
    document.createTextNode(`${result.taps} × ${money(result.unit, symbol)} · Gewinn ${money(result.win, symbol)} · je Chip `),
  );
  const compactChip = document.createElement("strong");
  compactChip.textContent = money(result.perChip, symbol);
  compact.append(compactChip);

  card.append(head, figures, perChip, compact);
  return card;
}

export function render(round, config, els, view = {}) {
  const picking = view.pickingNumber === true;
  renderStatus(els.status, round, picking);
  renderFields(els.cells, round, picking);
  if (els.lineList) renderLineList(els.lineList, round, picking);

  const results = occupiedFields(round).map(({ field, taps }) => resultFor(field, taps, config));
  const symbol = config.currencySymbol;
  // Line bets make busy rounds busier: above five cards, switch to one-row
  // cards so the list still fits without scrolling (research R-107).
  els.results.classList.toggle("compact", results.length > 5);

  if (results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      picking || round.winningNumber === null
        ? "Zahl antippen, die gefallen ist."
        : "Auf jedes Gewinnerfeld so oft tippen, wie dort Grundeinsätze liegen.";
    els.results.replaceChildren(empty);
  } else {
    els.results.replaceChildren(...results.map((r) => resultCard(r, symbol)));
  }

  const totals = roundTotals(results);
  els.total.textContent = money(totals.payoutTotal, symbol);
  els.subtotals.textContent =
    results.length === 0
      ? ""
      : `Einsatz ${money(totals.stakeTotal, symbol)} + Gewinn ${money(totals.winTotal, symbol)}`;

  els.btnUndo.disabled = picking || round.undoLog.length === 0;
  els.btnChange.disabled = picking || round.winningNumber === null;
  els.btnNext.disabled = round.winningNumber === null && !needsConfirmation(round);
}

export { fieldById };
