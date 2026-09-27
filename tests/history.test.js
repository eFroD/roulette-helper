import { test } from "node:test";
import assert from "node:assert/strict";
import { pushHistory } from "../public/js/domain/history.js";

test("newest first", () => {
  assert.deepEqual(pushHistory([], 17, 10), [17]);
  assert.deepEqual(pushHistory([17], 0, 10), [0, 17]);
  assert.deepEqual(pushHistory([0, 17], 36, 10), [36, 0, 17]);
});

test("capped at historyLength, oldest dropped", () => {
  let list = [];
  for (let n = 1; n <= 15; n++) list = pushHistory(list, n, 10);
  assert.equal(list.length, 10);
  assert.deepEqual(list, [15, 14, 13, 12, 11, 10, 9, 8, 7, 6]);
});

test("historyLength 0 disables the strip entirely", () => {
  assert.deepEqual(pushHistory([1, 2, 3], 17, 0), []);
});

test("a round that ended without a winning number records nothing", () => {
  assert.deepEqual(pushHistory([17], null, 10), [17]);
  assert.deepEqual(pushHistory([17], undefined, 10), [17]);
  assert.deepEqual(pushHistory([17], 37, 10), [17]);
});

test("zero is a real result and is recorded", () => {
  assert.deepEqual(pushHistory([17], 0, 10), [0, 17]);
});
