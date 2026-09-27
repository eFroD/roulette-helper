import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BET_FIELDS, RED_NUMBERS, colourOf, fieldById, isWinner, winningFieldIds,
} from "../public/js/domain/wheel.js";

const nonLine = (ids) => ids.filter((id) => fieldById(id).kind !== "line");

test("catalogue holds exactly 157 fields: 37 numbers + 108 lines + 12 outside bets", () => {
  assert.equal(BET_FIELDS.length, 157);
  assert.equal(BET_FIELDS.filter((f) => f.kind === "number").length, 37);
  assert.equal(BET_FIELDS.filter((f) => f.kind === "line").length, 108);
  assert.equal(BET_FIELDS.filter((f) => f.kind === "outside").length, 12);
});

test("colours: 18 red, 18 black, zero green", () => {
  assert.equal(RED_NUMBERS.size, 18);
  const counts = { red: 0, black: 0, green: 0 };
  for (let n = 0; n <= 36; n++) counts[colourOf(n)]++;
  assert.deepEqual(counts, { red: 18, black: 18, green: 1 });
});

test("every number 1-36 has EXACTLY six winning non-line fields", () => {
  for (let n = 1; n <= 36; n++) {
    assert.equal(nonLine(winningFieldIds(n)).length, 6, `number ${n} should win exactly 6 non-line fields`);
  }
});

test("each of the six winners is one per category, with no duplicates", () => {
  for (let n = 1; n <= 36; n++) {
    const ids = nonLine(winningFieldIds(n));
    assert.equal(new Set(ids).size, 6);
    assert.ok(ids.includes(`n${n}`), `${n} must win its own straight bet`);
    assert.equal(ids.filter((id) => id.startsWith("dozen")).length, 1);
    assert.equal(ids.filter((id) => id.startsWith("col")).length, 1);
    assert.equal(ids.filter((id) => id === "red" || id === "black").length, 1);
    assert.equal(ids.filter((id) => id === "even" || id === "odd").length, 1);
    assert.equal(ids.filter((id) => id === "low" || id === "high").length, 1);
  }
});

test("zero wins its own field and the six lines touching it - every outside bet loses in full", () => {
  assert.deepEqual(winningFieldIds(0), [
    "n0", "split-0-1", "split-0-2", "split-0-3", "trio-0-1-2", "trio-0-2-3", "basket-0-1-2-3",
  ]);
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

// ---------------------------------------------------- French layout (003)

// Taken from the 002 build before any 003 change. The French felt moves and
// renames fields; it must never change what wins (FR-011, FR-015: no La
// Partage, no En Prison).
const SNAPSHOT = {
  0: ["n0","split-0-1","split-0-2","split-0-3","trio-0-1-2","trio-0-2-3","basket-0-1-2-3"],
  1: ["n1","split-0-1","split-1-2","split-1-4","street-1-2-3","trio-0-1-2","corner-1-2-4-5","basket-0-1-2-3","sixline-1-2-3-4-5-6","low","red","odd","dozen1","col1"],
  2: ["n2","split-0-2","split-1-2","split-2-3","split-2-5","street-1-2-3","trio-0-1-2","trio-0-2-3","corner-1-2-4-5","corner-2-3-5-6","basket-0-1-2-3","sixline-1-2-3-4-5-6","low","even","black","dozen1","col2"],
  3: ["n3","split-0-3","split-2-3","split-3-6","street-1-2-3","trio-0-2-3","corner-2-3-5-6","basket-0-1-2-3","sixline-1-2-3-4-5-6","low","red","odd","dozen1","col3"],
  4: ["n4","split-1-4","split-4-5","split-4-7","street-4-5-6","corner-1-2-4-5","corner-4-5-7-8","sixline-1-2-3-4-5-6","sixline-4-5-6-7-8-9","low","even","black","dozen1","col1"],
  5: ["n5","split-2-5","split-4-5","split-5-6","split-5-8","street-4-5-6","corner-1-2-4-5","corner-2-3-5-6","corner-4-5-7-8","corner-5-6-8-9","sixline-1-2-3-4-5-6","sixline-4-5-6-7-8-9","low","red","odd","dozen1","col2"],
  6: ["n6","split-3-6","split-5-6","split-6-9","street-4-5-6","corner-2-3-5-6","corner-5-6-8-9","sixline-1-2-3-4-5-6","sixline-4-5-6-7-8-9","low","even","black","dozen1","col3"],
  7: ["n7","split-4-7","split-7-8","split-7-10","street-7-8-9","corner-4-5-7-8","corner-7-8-10-11","sixline-4-5-6-7-8-9","sixline-7-8-9-10-11-12","low","red","odd","dozen1","col1"],
  8: ["n8","split-5-8","split-7-8","split-8-9","split-8-11","street-7-8-9","corner-4-5-7-8","corner-5-6-8-9","corner-7-8-10-11","corner-8-9-11-12","sixline-4-5-6-7-8-9","sixline-7-8-9-10-11-12","low","even","black","dozen1","col2"],
  9: ["n9","split-6-9","split-8-9","split-9-12","street-7-8-9","corner-5-6-8-9","corner-8-9-11-12","sixline-4-5-6-7-8-9","sixline-7-8-9-10-11-12","low","red","odd","dozen1","col3"],
  10: ["n10","split-7-10","split-10-11","split-10-13","street-10-11-12","corner-7-8-10-11","corner-10-11-13-14","sixline-7-8-9-10-11-12","sixline-10-11-12-13-14-15","low","even","black","dozen1","col1"],
  11: ["n11","split-8-11","split-10-11","split-11-12","split-11-14","street-10-11-12","corner-7-8-10-11","corner-8-9-11-12","corner-10-11-13-14","corner-11-12-14-15","sixline-7-8-9-10-11-12","sixline-10-11-12-13-14-15","low","black","odd","dozen1","col2"],
  12: ["n12","split-9-12","split-11-12","split-12-15","street-10-11-12","corner-8-9-11-12","corner-11-12-14-15","sixline-7-8-9-10-11-12","sixline-10-11-12-13-14-15","low","even","red","dozen1","col3"],
  13: ["n13","split-10-13","split-13-14","split-13-16","street-13-14-15","corner-10-11-13-14","corner-13-14-16-17","sixline-10-11-12-13-14-15","sixline-13-14-15-16-17-18","low","black","odd","dozen2","col1"],
  14: ["n14","split-11-14","split-13-14","split-14-15","split-14-17","street-13-14-15","corner-10-11-13-14","corner-11-12-14-15","corner-13-14-16-17","corner-14-15-17-18","sixline-10-11-12-13-14-15","sixline-13-14-15-16-17-18","low","even","red","dozen2","col2"],
  15: ["n15","split-12-15","split-14-15","split-15-18","street-13-14-15","corner-11-12-14-15","corner-14-15-17-18","sixline-10-11-12-13-14-15","sixline-13-14-15-16-17-18","low","black","odd","dozen2","col3"],
  16: ["n16","split-13-16","split-16-17","split-16-19","street-16-17-18","corner-13-14-16-17","corner-16-17-19-20","sixline-13-14-15-16-17-18","sixline-16-17-18-19-20-21","low","even","red","dozen2","col1"],
  17: ["n17","split-14-17","split-16-17","split-17-18","split-17-20","street-16-17-18","corner-13-14-16-17","corner-14-15-17-18","corner-16-17-19-20","corner-17-18-20-21","sixline-13-14-15-16-17-18","sixline-16-17-18-19-20-21","low","black","odd","dozen2","col2"],
  18: ["n18","split-15-18","split-17-18","split-18-21","street-16-17-18","corner-14-15-17-18","corner-17-18-20-21","sixline-13-14-15-16-17-18","sixline-16-17-18-19-20-21","low","even","red","dozen2","col3"],
  19: ["n19","split-16-19","split-19-20","split-19-22","street-19-20-21","corner-16-17-19-20","corner-19-20-22-23","sixline-16-17-18-19-20-21","sixline-19-20-21-22-23-24","red","odd","high","dozen2","col1"],
  20: ["n20","split-17-20","split-19-20","split-20-21","split-20-23","street-19-20-21","corner-16-17-19-20","corner-17-18-20-21","corner-19-20-22-23","corner-20-21-23-24","sixline-16-17-18-19-20-21","sixline-19-20-21-22-23-24","even","black","high","dozen2","col2"],
  21: ["n21","split-18-21","split-20-21","split-21-24","street-19-20-21","corner-17-18-20-21","corner-20-21-23-24","sixline-16-17-18-19-20-21","sixline-19-20-21-22-23-24","red","odd","high","dozen2","col3"],
  22: ["n22","split-19-22","split-22-23","split-22-25","street-22-23-24","corner-19-20-22-23","corner-22-23-25-26","sixline-19-20-21-22-23-24","sixline-22-23-24-25-26-27","even","black","high","dozen2","col1"],
  23: ["n23","split-20-23","split-22-23","split-23-24","split-23-26","street-22-23-24","corner-19-20-22-23","corner-20-21-23-24","corner-22-23-25-26","corner-23-24-26-27","sixline-19-20-21-22-23-24","sixline-22-23-24-25-26-27","red","odd","high","dozen2","col2"],
  24: ["n24","split-21-24","split-23-24","split-24-27","street-22-23-24","corner-20-21-23-24","corner-23-24-26-27","sixline-19-20-21-22-23-24","sixline-22-23-24-25-26-27","even","black","high","dozen2","col3"],
  25: ["n25","split-22-25","split-25-26","split-25-28","street-25-26-27","corner-22-23-25-26","corner-25-26-28-29","sixline-22-23-24-25-26-27","sixline-25-26-27-28-29-30","red","odd","high","dozen3","col1"],
  26: ["n26","split-23-26","split-25-26","split-26-27","split-26-29","street-25-26-27","corner-22-23-25-26","corner-23-24-26-27","corner-25-26-28-29","corner-26-27-29-30","sixline-22-23-24-25-26-27","sixline-25-26-27-28-29-30","even","black","high","dozen3","col2"],
  27: ["n27","split-24-27","split-26-27","split-27-30","street-25-26-27","corner-23-24-26-27","corner-26-27-29-30","sixline-22-23-24-25-26-27","sixline-25-26-27-28-29-30","red","odd","high","dozen3","col3"],
  28: ["n28","split-25-28","split-28-29","split-28-31","street-28-29-30","corner-25-26-28-29","corner-28-29-31-32","sixline-25-26-27-28-29-30","sixline-28-29-30-31-32-33","even","black","high","dozen3","col1"],
  29: ["n29","split-26-29","split-28-29","split-29-30","split-29-32","street-28-29-30","corner-25-26-28-29","corner-26-27-29-30","corner-28-29-31-32","corner-29-30-32-33","sixline-25-26-27-28-29-30","sixline-28-29-30-31-32-33","black","odd","high","dozen3","col2"],
  30: ["n30","split-27-30","split-29-30","split-30-33","street-28-29-30","corner-26-27-29-30","corner-29-30-32-33","sixline-25-26-27-28-29-30","sixline-28-29-30-31-32-33","even","red","high","dozen3","col3"],
  31: ["n31","split-28-31","split-31-32","split-31-34","street-31-32-33","corner-28-29-31-32","corner-31-32-34-35","sixline-28-29-30-31-32-33","sixline-31-32-33-34-35-36","black","odd","high","dozen3","col1"],
  32: ["n32","split-29-32","split-31-32","split-32-33","split-32-35","street-31-32-33","corner-28-29-31-32","corner-29-30-32-33","corner-31-32-34-35","corner-32-33-35-36","sixline-28-29-30-31-32-33","sixline-31-32-33-34-35-36","even","red","high","dozen3","col2"],
  33: ["n33","split-30-33","split-32-33","split-33-36","street-31-32-33","corner-29-30-32-33","corner-32-33-35-36","sixline-28-29-30-31-32-33","sixline-31-32-33-34-35-36","black","odd","high","dozen3","col3"],
  34: ["n34","split-31-34","split-34-35","street-34-35-36","corner-31-32-34-35","sixline-31-32-33-34-35-36","even","red","high","dozen3","col1"],
  35: ["n35","split-32-35","split-34-35","split-35-36","street-34-35-36","corner-31-32-34-35","corner-32-33-35-36","sixline-31-32-33-34-35-36","black","odd","high","dozen3","col2"],
  36: ["n36","split-33-36","split-35-36","street-34-35-36","corner-32-33-35-36","sixline-31-32-33-34-35-36","even","red","high","dozen3","col3"],
};

test("winning sets for 0-36 are unchanged by the French layout (SC-002, FR-015)", () => {
  for (let n = 0; n <= 36; n++) assert.deepEqual(winningFieldIds(n), SNAPSHOT[n], `number ${n}`);
  for (const f of BET_FIELDS.filter((f) => f.kind === "outside")) {
    assert.equal(f.wins(0), false, `${f.id} must lose in full on zero`);
  }
});

test("outside fields carry French felt labels and French+German result labels (FR-006, FR-007)", () => {
  const expected = {
    low: ["Manque", "Manque (1–18)"],
    high: ["Passe", "Passe (19–36)"],
    even: ["Pair", "Pair (Gerade)"],
    odd: ["Impair", "Impair (Ungerade)"],
    red: ["Rouge", "Rouge (Rot)"],
    black: ["Noir", "Noir (Schwarz)"],
    dozen1: ["P12", "P12 (1. Dutzend)"],
    dozen2: ["M12", "M12 (2. Dutzend)"],
    dozen3: ["D12", "D12 (3. Dutzend)"],
  };
  for (const [id, [felt, label]] of Object.entries(expected)) {
    assert.equal(fieldById(id).feltLabel, felt, `${id} felt label`);
    assert.equal(fieldById(id).label, label, `${id} result label`);
  }
  for (const k of [1, 2, 3]) {
    assert.equal(fieldById(`col${k}`).label, `${k}. Kolonne`);
    assert.equal(fieldById(`col${k}`).feltLabel, undefined);
  }
  for (const f of BET_FIELDS.filter((f) => f.kind !== "outside")) {
    assert.equal(f.feltLabel, undefined, `${f.id} has no felt label`);
  }
});
