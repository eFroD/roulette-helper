import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BET_FIELDS, RED_NUMBERS, colourOf, fieldById, isWinner, winningFieldIds,
} from "../public/js/domain/wheel.js";

test("catalogue holds exactly 49 fields: 37 numbers + 12 outside bets", () => {
  assert.equal(BET_FIELDS.length, 49);
  assert.equal(BET_FIELDS.filter((f) => f.kind === "number").length, 37);
  assert.equal(BET_FIELDS.filter((f) => f.kind === "outside").length, 12);
});

test("colours: 18 red, 18 black, zero green", () => {
  assert.equal(RED_NUMBERS.size, 18);
  const counts = { red: 0, black: 0, green: 0 };
  for (let n = 0; n <= 36; n++) counts[colourOf(n)]++;
  assert.deepEqual(counts, { red: 18, black: 18, green: 1 });
});

test("every number 1-36 has EXACTLY six winning fields", () => {
  for (let n = 1; n <= 36; n++) {
    assert.equal(winningFieldIds(n).length, 6, `number ${n} should win exactly 6 fields`);
  }
});

test("each of the six winners is one per category, with no duplicates", () => {
  for (let n = 1; n <= 36; n++) {
    const ids = winningFieldIds(n);
    assert.equal(new Set(ids).size, 6);
    assert.ok(ids.includes(`n${n}`), `${n} must win its own straight bet`);
    assert.equal(ids.filter((id) => id.startsWith("dozen")).length, 1);
    assert.equal(ids.filter((id) => id.startsWith("col")).length, 1);
    assert.equal(ids.filter((id) => id === "red" || id === "black").length, 1);
    assert.equal(ids.filter((id) => id === "even" || id === "odd").length, 1);
    assert.equal(ids.filter((id) => id === "low" || id === "high").length, 1);
  }
});

test("zero wins only its own field - every outside bet loses in full", () => {
  assert.deepEqual(winningFieldIds(0), ["n0"]);
  for (const f of BET_FIELDS.filter((f) => f.kind === "outside")) {
    assert.equal(f.wins(0), false, `${f.id} must lose on zero`);
  }
});

test("payout ratios match the house table", () => {
  assert.ok(BET_FIELDS.filter((f) => f.kind === "number").every((f) => f.ratio === 35));
  for (const [id, ratio] of [["red", 1], ["black", 1], ["even", 1], ["odd", 1],
    ["low", 1], ["high", 1], ["dozen1", 2], ["dozen2", 2], ["dozen3", 2],
    ["col1", 2], ["col2", 2], ["col3", 2]]) {
    assert.equal(fieldById(id).ratio, ratio, `${id} pays ${ratio}:1`);
  }
});

test("nothing wins before a number is entered", () => {
  for (const f of BET_FIELDS) assert.equal(isWinner(f.id, null), false);
});

test("invalid input returns empty / false, never throws", () => {
  for (const bad of [-1, 37, 1.5, NaN, "17", null, undefined, {}]) {
    assert.deepEqual(winningFieldIds(bad), []);
    assert.equal(isWinner("red", bad), false);
    assert.equal(colourOf(bad), undefined);
  }
  assert.equal(isWinner("does-not-exist", 17), false);
  assert.equal(fieldById("does-not-exist"), undefined);
});
