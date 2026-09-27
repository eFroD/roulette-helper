import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldById } from "../public/js/domain/wheel.js";
import { resultFor, roundTotals, unitFor } from "../public/js/domain/payout.js";

const CONFIG = { baseStakeOutside: 10, baseStakeNumber: 5, currencySymbol: "€", historyLength: 10 };

test("unit is chosen by field kind", () => {
  assert.equal(unitFor(fieldById("n17"), CONFIG), 5);
  assert.equal(unitFor(fieldById("red"), CONFIG), 10);
  assert.equal(unitFor(fieldById("dozen2"), CONFIG), 10);
  // Lines are inside bets: they take the number stake, never the outside one.
  assert.equal(unitFor(fieldById("split-16-17"), CONFIG), 5);
  assert.equal(unitFor(fieldById("sixline-13-14-15-16-17-18"), CONFIG), 5);
});

test("the four formulas hold across all three ratios", () => {
  for (const [id, taps] of [["n7", 3], ["black", 5], ["col1", 4]]) {
    const field = fieldById(id);
    const unit = unitFor(field, CONFIG);
    const r = resultFor(field, taps, CONFIG);
    assert.equal(r.stake, taps * unit);
    assert.equal(r.win, r.stake * field.ratio);
    assert.equal(r.total, r.stake + r.win);
    assert.equal(r.perChip, unit * field.ratio);
  }
});

test("perChip is unit x ratio, and stays exact where win/taps would not be", () => {
  // 1 chip of 5 on a straight bet: win 175. Three chips -> win 525, and
  // 525/3 is exact only by luck. The product form never depends on that luck.
  const field = fieldById("n17");
  for (const taps of [1, 2, 3, 7, 13]) {
    const r = resultFor(field, taps, CONFIG);
    assert.equal(r.perChip, 175, "perChip must not vary with tap count");
    assert.ok(Number.isInteger(r.perChip));
  }
  // A base stake that makes win/taps lossy still yields an exact perChip.
  const odd = { ...CONFIG, baseStakeNumber: 0.1 };
  assert.equal(resultFor(field, 3, odd).perChip, 0.1 * 35);
});

test("integer base stakes yield integer figures throughout", () => {
  for (const id of ["n0", "n36", "red", "odd", "dozen3", "col2"]) {
    const r = resultFor(fieldById(id), 6, CONFIG);
    for (const key of ["stake", "win", "total", "perChip"]) {
      assert.ok(Number.isInteger(r[key]), `${id}.${key} must be an integer`);
    }
  }
});

test("zero taps yields zero money", () => {
  const r = resultFor(fieldById("red"), 0, CONFIG);
  assert.equal(r.stake, 0);
  assert.equal(r.win, 0);
  assert.equal(r.total, 0);
});

test("roundTotals sums occupied fields; an empty round totals zero", () => {
  assert.deepEqual(roundTotals([]), { stakeTotal: 0, winTotal: 0, payoutTotal: 0 });
  const results = [
    resultFor(fieldById("red"), 4, CONFIG),   // 40 / 40 / 80
    resultFor(fieldById("dozen2"), 3, CONFIG), // 30 / 60 / 90
  ];
  assert.deepEqual(roundTotals(results), { stakeTotal: 70, winTotal: 100, payoutTotal: 170 });
});
