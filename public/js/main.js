// Wiring: config, tableau build, action dispatch, render. The only module that
// knows about both the domain and the browser.

import { resolveConfig } from "./domain/config.js";
import { fieldById } from "./domain/wheel.js";
import { pushHistory } from "./domain/history.js";
import {
  addStake, changeWinningNumber, clearField, createRound, needsConfirmation,
  nextRound, setWinningNumber, undo,
} from "./domain/round.js";
import { buildTableau } from "./ui/tableau.js";
import { render } from "./ui/render.js";
import { confirmAction, initDialogs } from "./ui/dialogs.js";
import { renderHistory } from "./ui/history.js";
import { enableNoSleep } from "./platform/nosleep.js";
import { initFullscreen } from "./platform/fullscreen.js";

const LONG_PRESS_MS = 550;

const { config: initialConfig, warnings } = resolveConfig(window.ROULETTE_CONFIG);
let config = { ...initialConfig };
let round = createRound();
let history = [];
// True between tapping "Zahl ändern" and picking the replacement number.
let pickingNumber = false;

const $ = (id) => document.getElementById(id);
const els = {
  status: $("status"),
  results: $("results"),
  total: $("total"),
  subtotals: $("subtotals"),
  btnUndo: $("btn-undo"),
  btnChange: $("btn-change"),
  btnNext: $("btn-next"),
  history: $("history"),
  lineList: $("line-list"),
  cells: buildTableau(
    { tableau: $("tableau"), lineList: $("line-list") },
    { lineBets: config.lineBets },
  ),
};
els.lineList.hidden = !config.lineBets;
document.querySelector(".stage").classList.toggle("lines", config.lineBets);

initDialogs();
initFullscreen($("btn-fullscreen"));
showWarnings(warnings);

// Every element of the tapped field pulses - the zone and its list entry - so
// a dealer using the list also sees where that bet sits on the felt (FR-023).
const FLASH_MS = 260;
const flashTimers = new WeakMap();
function flash(fieldId) {
  for (const el of els.cells.get(fieldId) ?? []) {
    clearTimeout(flashTimers.get(el));
    delete el.dataset.flash;
    void el.offsetWidth; // restart the animation on rapid repeat taps
    el.dataset.flash = "";
    flashTimers.set(el, setTimeout(() => delete el.dataset.flash, FLASH_MS));
  }
}

function update(next) {
  round = next;
  render(round, config, els, { pickingNumber });
}

// ---------------------------------------------------------------- warnings
function showWarnings(list) {
  if (list.length === 0) return;
  const box = $("warnings");
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "OK";
  dismiss.addEventListener("click", () => {
    box.hidden = true;
  });
  const title = document.createElement("strong");
  title.textContent = "Konfiguration unvollständig – Standardwerte aktiv:";
  const ul = document.createElement("ul");
  for (const w of list) {
    const li = document.createElement("li");
    li.textContent = w;
    ul.append(li);
  }
  box.replaceChildren(dismiss, title, ul);
  box.hidden = false;
}

// ------------------------------------------------------------ field taps
// One delegated handler. Long-press clears a field; the click that follows the
// press is suppressed so the two gestures never fire together.
let pressTimer = null;
let pressConsumed = false;

function fieldFrom(event) {
  const el = event.target.closest?.("[data-field-id]");
  return el?.dataset.fieldId;
}

document.addEventListener("pointerdown", (event) => {
  const fieldId = fieldFrom(event);
  if (!fieldId) return;
  pressConsumed = false;
  pressTimer = setTimeout(() => {
    pressTimer = null;
    if ((round.stakes[fieldId] ?? 0) > 0) {
      pressConsumed = true;
      update(clearField(round, fieldId));
    }
  }, LONG_PRESS_MS);
});

for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
  document.addEventListener(type, () => {
    clearTimeout(pressTimer);
    pressTimer = null;
  });
}

document.addEventListener("click", (event) => {
  // The first tap anywhere arms the wake lock: a user gesture is mandatory.
  enableNoSleep();

  const clearId = event.target.closest?.("[data-clear-field]")?.dataset.clearField;
  if (clearId) {
    update(clearField(round, clearId));
    return;
  }

  const fieldId = fieldFrom(event);
  if (!fieldId) return;
  if (pressConsumed) {
    pressConsumed = false;
    return;
  }

  const field = fieldById(fieldId);

  if (pickingNumber) {
    // Replacing the number of a round already in progress: stakes are dropped
    // by the domain, the round never leaves "collecting".
    if (field?.kind !== "number") return; // FR-009: a line can never set the number
    pickingNumber = false;
    update(changeWinningNumber(round, field.number));
    return;
  }

  if (round.winningNumber === null) {
    // Before a number exists, only a number field can set one - a line zone or
    // list entry tapped now does nothing (FR-009).
    if (field?.kind === "number") update(setWinningNumber(round, field.number));
    return;
  }
  const next = addStake(round, fieldId);
  const staked = next !== round; // a no-op tap (guard) gets no confirmation
  update(next);
  if (staked) flash(fieldId);
});

// ---------------------------------------------------------------- actions
els.btnUndo.addEventListener("click", () => update(undo(round)));

els.btnChange.addEventListener("click", async () => {
  if (round.winningNumber === null) return;
  if (needsConfirmation(round)) {
    const ok = await confirmAction(
      "Gewinnzahl ändern? Die bereits erfassten Einsätze werden verworfen.",
      "Ändern",
    );
    if (!ok) return;
  }
  pickingNumber = true;
  update(round); // unlock the board; the next number tap replaces the winner
});

els.btnNext.addEventListener("click", async () => {
  if (needsConfirmation(round)) {
    const ok = await confirmAction("Runde beenden und alles zurücksetzen?", "Nächste Runde");
    if (!ok) return;
  }
  history = pushHistory(history, round.winningNumber, config.historyLength);
  renderHistory(els.history, history);
  pickingNumber = false;
  update(nextRound(round));
});

// --------------------------------------------------------------- settings
const settings = $("settings");
$("btn-settings").addEventListener("click", () => {
  $("set-outside").value = config.baseStakeOutside;
  $("set-number").value = config.baseStakeNumber;
  settings.hidden = false;
});
$("settings-close").addEventListener("click", () => {
  settings.hidden = true;
});
$("settings-apply").addEventListener("click", () => {
  // Runtime only, never persisted (FR-030). Tap counts are untouched; every
  // figure is simply re-derived from the new units.
  const { config: next } = resolveConfig({
    ...config,
    baseStakeOutside: Number($("set-outside").value),
    baseStakeNumber: Number($("set-number").value),
  });
  config = next;
  settings.hidden = true;
  render(round, config, els, { pickingNumber });
});

render(round, config, els, { pickingNumber });
