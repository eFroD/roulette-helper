import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addStake, changeWinningNumber, clearField, createRound, needsConfirmation,
  nextRound, occupiedFields, setWinningNumber, undo,
} from "../public/js/domain/round.js";

const at = (n) => setWinningNumber(createRound(), n); // 19: red, odd, high, dozen2, col1

test("a fresh round awaits a number and holds no stakes", () => {
  const r = createRound();
  assert.equal(r.status, "awaiting-number");
  assert.equal(r.winningNumber, null);
  assert.deepEqual(r.stakes, {});
  assert.deepEqual(r.undoLog, []);
});

test("setWinningNumber moves to collecting", () => {
  const r = at(19);
  assert.equal(r.status, "collecting");
  assert.equal(r.winningNumber, 19);
  assert.deepEqual(r.stakes, {});
});

test("no stake can exist while no number is entered", () => {
  const r = createRound();
  for (const id of ["red", "n19", "dozen2"]) {
    assert.deepEqual(addStake(r, id), r, `${id} must not be stakeable`);
  }
});

test("a losing field is unrepresentable, not merely unclickable", () => {
  const r = at(19); // 19 is red, odd, high, dozen2, col1
  for (const id of ["black", "even", "low", "dozen1", "dozen3", "col2", "col3", "n18"]) {
    assert.deepEqual(addStake(r, id), r, `${id} loses on 19 and must never enter stakes`);
  }
});

test("every guard violation is a no-op, never a throw", () => {
  const empty = createRound();
  assert.deepEqual(undo(empty), empty);
  assert.deepEqual(clearField(empty, "red"), empty);
  assert.deepEqual(setWinningNumber(at(19), 7), at(19)); // already collecting
  assert.deepEqual(changeWinningNumber(empty, 7), empty); // not collecting yet
  for (const bad of [-1, 37, 1.5, NaN, "19", null]) {
    assert.deepEqual(setWinningNumber(empty, bad), empty);
  }
  assert.deepEqual(addStake(at(19), "no-such-field"), at(19));
});

test("transitions never mutate their input", () => {
  const before = addStake(addStake(at(19), "red"), "red");
  const snapshot = structuredClone(before);
  addStake(before, "red");
  undo(before);
  clearField(before, "red");
  changeWinningNumber(before, 7);
  nextRound(before);
  assert.deepEqual(before, snapshot, "the original round must be untouched");
});

test("undo reverses one tap, never the whole field", () => {
  let r = at(19);
  for (let i = 0; i < 3; i++) r = addStake(r, "red");
  assert.equal(r.stakes.red, 3);
  r = undo(r);
  assert.equal(r.stakes.red, 2);
  r = undo(r);
  assert.equal(r.stakes.red, 1);
  r = undo(r);
  assert.equal("red" in r.stakes, false, "a field at zero is deleted, not stored as 0");
  assert.deepEqual(r.undoLog, []);
});

test("clearField empties one field and leaves the others alone", () => {
  let r = at(19);
  r = addStake(addStake(r, "red"), "red");
  r = addStake(r, "dozen2");
  r = clearField(r, "red");
  assert.equal("red" in r.stakes, false);
  assert.equal(r.stakes.dozen2, 1);
});

test("undoing a clearField restores the full count in one step", () => {
  let r = at(19);
  for (let i = 0; i < 4; i++) r = addStake(r, "red");
  r = clearField(r, "red");
  assert.equal("red" in r.stakes, false);
  r = undo(r);
  assert.equal(r.stakes.red, 4, "a cleared field returns whole, not tap by tap");
});

test("changing the number discards stakes and the undo log", () => {
  let r = at(19);
  r = addStake(addStake(r, "red"), "dozen2");
  r = changeWinningNumber(r, 17);
  assert.equal(r.winningNumber, 17);
  assert.deepEqual(r.stakes, {}, "old stakes belong to fields that may now lose");
  assert.deepEqual(r.undoLog, [], "their undo entries must not outlive them");
});

test("changeWinningNumber and nextRound execute unconditionally - confirming is the caller's job", () => {
  const r = addStake(at(19), "red");
  assert.equal(needsConfirmation(r), true);
  assert.equal(changeWinningNumber(r, 17).winningNumber, 17, "the model does not refuse");
  assert.equal(nextRound(r).status, "awaiting-number");
  assert.equal(needsConfirmation(at(19)), false, "no stakes, nothing to confirm");
});

test("occupiedFields returns only staked fields, in catalogue order", () => {
  let r = at(19);
  r = addStake(r, "dozen2");
  r = addStake(addStake(r, "n19"), "n19");
  r = addStake(r, "red");
  assert.deepEqual(
    occupiedFields(r).map((o) => [o.field.id, o.taps]),
    [["n19", 2], ["red", 1], ["dozen2", 1]], // numbers before outside bets
  );
});
