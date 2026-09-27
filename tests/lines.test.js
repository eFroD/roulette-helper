// Line bets (specs/002): catalogue, geometry and the exhaustive winner check.
//
// The winner check (SC-001) is deliberately brute force: for each of the 37
// numbers it compares the domain's answer against "every line whose numbers
// contain n" across all 157 fields - no sampling.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BET_FIELDS, LINE_TYPES, fieldById, isWinner, winningFieldIds } from "../public/js/domain/wheel.js";
import { resultFor, roundTotals } from "../public/js/domain/payout.js";
import {
  addStake, changeWinningNumber, clearField, createRound, needsConfirmation, nextRound,
  occupiedFields, setWinningNumber, undo,
} from "../public/js/domain/round.js";

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10, lineBets: true };

const LINES = BET_FIELDS.filter((f) => f.kind === "line");
const lineIds = (ids) => ids.filter((id) => fieldById(id).kind === "line");

test("108 lines: 60 split, 12 street, 2 trio, 22 corner, 1 basket, 11 sixline", () => {
  const counts = Object.fromEntries(LINE_TYPES.map((t) => [t, 0]));
  for (const f of LINES) counts[f.type]++;
  assert.deepEqual(counts, { split: 60, street: 12, trio: 2, corner: 22, basket: 1, sixline: 11 });
  assert.equal(LINES.length, 108);
});

test("each line type pays its house ratio", () => {
  const RATIOS = { split: 17, street: 11, trio: 11, corner: 8, basket: 8, sixline: 5 };
  for (const f of LINES) assert.equal(f.ratio, RATIOS[f.type], `${f.id} pays ${RATIOS[f.type]}:1`);
});

test("numbers are sorted, unique, in range and sized for their type", () => {
  const SIZE = { split: 2, street: 3, trio: 3, corner: 4, basket: 4, sixline: 6 };
  for (const f of LINES) {
    assert.equal(f.numbers.length, SIZE[f.type], f.id);
    assert.equal(new Set(f.numbers).size, f.numbers.length, f.id);
    assert.ok(f.numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 36), f.id);
    assert.deepEqual([...f.numbers], [...f.numbers].sort((a, b) => a - b), f.id);
    assert.ok(Object.isFrozen(f) && Object.isFrozen(f.numbers), `${f.id} must be frozen`);
  }
});

test("adjacency: no line exists that is not on the physical felt (FR-003)", () => {
  for (const f of LINES.filter((l) => l.type === "split")) {
    const [a, b] = f.numbers;
    const inStreet = b === a + 1 && a % 3 !== 0 && a >= 1;
    const acrossStreets = b === a + 3 && a >= 1 && a <= 33;
    const withZero = a === 0 && [1, 2, 3].includes(b);
    assert.ok(inStreet || acrossStreets || withZero, `${f.id} is not a real split`);
  }
  for (const f of LINES.filter((l) => l.type === "corner")) {
    const b = f.numbers[0];
    assert.deepEqual([...f.numbers], [b, b + 1, b + 3, b + 4], f.id);
    assert.ok(b % 3 !== 0 && b >= 1 && b <= 32, `${f.id} is not a real corner`);
  }
  for (const phantom of ["split-3-4", "split-6-7", "split-34-37", "split-33-36-extra", "corner-3-4-6-7"]) {
    assert.equal(fieldById(phantom), undefined, `${phantom} must not exist`);
  }
});

test("ids are unique across all 157 fields", () => {
  assert.equal(new Set(BET_FIELDS.map((f) => f.id)).size, 157);
});

test("labels name the numbers involved (FR-004)", () => {
  const expected = {
    "split-16-17": "Split 16/17",
    "split-0-1": "Split 0/1",
    "street-16-17-18": "Street 16-17-18",
    "corner-13-14-16-17": "Corner 13/14/16/17",
    "sixline-13-14-15-16-17-18": "Sixline 13–18",
    "trio-0-1-2": "Trio 0-1-2",
    "basket-0-1-2-3": "Basket 0-1-2-3",
  };
  for (const [id, label] of Object.entries(expected)) assert.equal(fieldById(id).label, label);
});

test("SC-001: for every number the winning lines are exactly the lines containing it", () => {
  for (let n = 0; n <= 36; n++) {
    const expected = LINES.filter((f) => f.numbers.includes(n)).map((f) => f.id);
    assert.deepEqual(lineIds(winningFieldIds(n)), expected, `number ${n}`);
  }
});

test("winning line counts: 17 -> 11, 1 -> 8, 0 -> 6, 34 and 36 -> 5, never more than 11", () => {
  const count = (n) => lineIds(winningFieldIds(n)).length;
  assert.equal(count(17), 11);
  assert.equal(count(1), 8);
  assert.equal(count(0), 6);
  assert.equal(count(34), 5);
  assert.equal(count(36), 5);
  let max = 0;
  for (let n = 0; n <= 36; n++) max = Math.max(max, count(n));
  assert.equal(max, 11);
});

test("the winning number 1 wins exactly the eight lines of US1 AC2", () => {
  assert.deepEqual(lineIds(winningFieldIds(1)).sort(), [
    "basket-0-1-2-3", "corner-1-2-4-5", "sixline-1-2-3-4-5-6", "split-0-1",
    "split-1-2", "split-1-4", "street-1-2-3", "trio-0-1-2",
  ]);
});

test("no line wins before a number is entered", () => {
  for (const f of LINES) assert.equal(isWinner(f.id, null), false, f.id);
});

// ------------------------------------------------------ stakes on lines (US2)

test("a winning line counts taps; a losing line and a line before any number do not", () => {
  let r = setWinningNumber(createRound(), 17);
  r = addStake(addStake(r, "split-16-17"), "split-16-17");
  assert.equal(r.stakes["split-16-17"], 2);
  assert.deepEqual(addStake(r, "split-1-2"), r, "losing line is a no-op");
  const fresh = createRound();
  assert.deepEqual(addStake(fresh, "split-16-17"), fresh, "no number yet is a no-op");
});

test("stakes only on lines still require confirmation before a number change (FR-019)", () => {
  const r = addStake(setWinningNumber(createRound(), 17), "corner-16-17-19-20");
  assert.equal(needsConfirmation(r), true);
});

test("results list the number first, then lines, then outside bets", () => {
  let r = setWinningNumber(createRound(), 17);
  for (const id of ["black", "split-16-17", "n17", "street-16-17-18"]) r = addStake(r, id);
  assert.deepEqual(occupiedFields(r).map(({ field }) => field.id), ["n17", "split-16-17", "street-16-17-18", "black"]);
});

test("the round total includes number, line and outside results alike", () => {
  let r = setWinningNumber(createRound(), 17);
  for (const id of ["n17", "split-16-17", "split-16-17", "black"]) r = addStake(r, id);
  const results = occupiedFields(r).map(({ field, taps }) => resultFor(field, taps, CONFIG));
  // n17 1x5: 180 · split 2x5: 180 · black 1x10: 20
  assert.deepEqual(roundTotals(results), { stakeTotal: 25, winTotal: 355, payoutTotal: 380 });
});

// ------------------------------------------------------ corrections (US3/US4)

test("undo unwinds number, outside and line taps in exact reverse order (FR-016)", () => {
  const seq = ["n17", "black", "split-16-17", "corner-16-17-19-20", "split-16-17"];
  let r = setWinningNumber(createRound(), 17);
  const snapshots = [r];
  for (const id of seq) snapshots.push((r = addStake(r, id)));
  for (let i = seq.length - 1; i >= 0; i--) {
    r = undo(r);
    assert.deepEqual(r.stakes, snapshots[i].stakes, `after undoing ${seq[i]}`);
  }
});

test("clearing a line leaves every other stake alone, and one undo restores it (FR-017)", () => {
  let r = setWinningNumber(createRound(), 17);
  for (const id of ["n17", "split-16-17", "split-16-17", "split-16-17"]) r = addStake(r, id);
  const cleared = clearField(r, "split-16-17");
  assert.deepEqual(cleared.stakes, { n17: 1 });
  assert.deepEqual(undo(cleared).stakes, r.stakes);
});

test("changing the number or starting the next round drops line stakes (FR-018, FR-019)", () => {
  let r = setWinningNumber(createRound(), 17);
  r = addStake(addStake(r, "split-16-17"), "n17");
  assert.deepEqual(changeWinningNumber(r, 5).stakes, {});
  assert.deepEqual(nextRound(r), createRound(), "US4 AC3: the next round is fully neutral");
});
