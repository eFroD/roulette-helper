// The Reference Scenarios of specs/001 (seven) and specs/002 (six plus the
// basket case), which the specifications declare a binding acceptance proof
// ("verbindlicher Abnahmenachweis"). Numbering and naming follow the spec
// tables exactly. The 001 scenarios predate line bets, so they assert on the
// non-line winners only - their meaning is unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldById, winningFieldIds } from "../public/js/domain/wheel.js";
import { resultFor } from "../public/js/domain/payout.js";
import {
  addStake, changeWinningNumber, createRound, needsConfirmation, setWinningNumber, undo,
} from "../public/js/domain/round.js";

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10 };
const nonLine = (ids) => ids.filter((id) => fieldById(id).kind !== "line");
const figures = (id, taps) => {
  const { stake, win, total, perChip } = resultFor(fieldById(id), taps, CONFIG);
  return { stake, win, total, perChip };
};

test("Scenario 1: number 17 activates exactly six fields", () => {
  assert.deepEqual(
    [...nonLine(winningFieldIds(17))].sort(),
    ["black", "col2", "dozen2", "low", "n17", "odd"].sort(),
  );
  assert.equal(nonLine(winningFieldIds(17)).length, 6);
});

test("Scenario 2: number 0 activates only field 0, all outside bets locked", () => {
  assert.deepEqual(nonLine(winningFieldIds(0)), ["n0"]);
});

test("Scenario 3: single number, 2 stakes of 5 EUR -> 10 / 350 / 360, per chip 175", () => {
  assert.deepEqual(figures("n19", 2), { stake: 10, win: 350, total: 360, perChip: 175 });
});

test("Scenario 4: red, 4 stakes of 10 EUR -> 40 / 40 / 80, per chip 10", () => {
  assert.deepEqual(figures("red", 4), { stake: 40, win: 40, total: 80, perChip: 10 });
});

test("Scenario 5: dozen, 3 stakes of 10 EUR -> 30 / 60 / 90, per chip 20", () => {
  assert.deepEqual(figures("dozen2", 3), { stake: 30, win: 60, total: 90, perChip: 20 });
});

test("Scenario 6: undo after 3 taps on red leaves 2 stakes -> 20 / 20 / 40", () => {
  let r = setWinningNumber(createRound(), 19); // 19 is red
  for (let i = 0; i < 3; i++) r = addStake(r, "red");
  r = undo(r);
  assert.equal(r.stakes.red, 2);
  assert.deepEqual(figures("red", r.stakes.red), { stake: 20, win: 20, total: 40, perChip: 10 });
});

test("Scenario 7: changing the winning number prompts, then leaves a consistent state", () => {
  let r = setWinningNumber(createRound(), 19);
  r = addStake(addStake(r, "red"), "dozen2");
  assert.equal(needsConfirmation(r), true, "stakes present -> the UI must ask first");

  r = changeWinningNumber(r, 17);
  assert.equal(r.winningNumber, 17);
  assert.deepEqual(r.stakes, {}, "stakes discarded");
  assert.deepEqual(r.undoLog, []);
  // Red lost its claim; the winners now match 17 exactly.
  assert.equal(winningFieldIds(17).includes("red"), false);
  assert.deepEqual(addStake(r, "red"), r, "a now-losing field stays unstakeable");
  assert.equal(addStake(r, "black").stakes.black, 1, "a now-winning field accepts stakes");
});

// ------------------------------------------------------------- specs/002

test("002 Scenario 1: number 17 activates exactly 17 fields", () => {
  assert.deepEqual([...winningFieldIds(17)].sort(), [
    "n17", "black", "odd", "low", "dozen2", "col2",
    "split-14-17", "split-16-17", "split-17-18", "split-17-20",
    "street-16-17-18",
    "corner-13-14-16-17", "corner-14-15-17-18", "corner-16-17-19-20", "corner-17-18-20-21",
    "sixline-13-14-15-16-17-18", "sixline-16-17-18-19-20-21",
  ].sort());
});

test("002 Scenario 2: number 0 activates exactly 7 fields, no outside bet", () => {
  assert.deepEqual(winningFieldIds(0), [
    "n0", "split-0-1", "split-0-2", "split-0-3", "trio-0-1-2", "trio-0-2-3", "basket-0-1-2-3",
  ]);
});

test("002 Scenario 3: split, 2 stakes of 5 EUR -> 10 / 170 / 180, per chip 85", () => {
  assert.deepEqual(figures("split-16-17", 2), { stake: 10, win: 170, total: 180, perChip: 85 });
});

test("002 Scenario 4: street, 1 stake of 5 EUR -> 5 / 55 / 60, per chip 55", () => {
  assert.deepEqual(figures("street-16-17-18", 1), { stake: 5, win: 55, total: 60, perChip: 55 });
});

test("002 Scenario 5: corner, 3 stakes of 5 EUR -> 15 / 120 / 135, per chip 40", () => {
  assert.deepEqual(figures("corner-16-17-19-20", 3), { stake: 15, win: 120, total: 135, perChip: 40 });
});

test("002 Scenario 6: sixline, 2 stakes of 5 EUR -> 10 / 50 / 60, per chip 25", () => {
  assert.deepEqual(figures("sixline-13-14-15-16-17-18", 2), { stake: 10, win: 50, total: 60, perChip: 25 });
});

test("002 US2 AC5: basket on zero, 2 stakes of 5 EUR -> 10 / 80 / 90, per chip 40", () => {
  assert.deepEqual(figures("basket-0-1-2-3", 2), { stake: 10, win: 80, total: 90, perChip: 40 });
});
