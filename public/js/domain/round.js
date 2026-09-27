// The round state machine.
// PURE MODULE: no document, no window, no navigator, no timers.
//
// Every transition returns a NEW round; the argument is never mutated.
// Every guard violation is a no-op that returns the round unchanged - never a
// throw. Tapping a locked field, undoing nothing, or staking before a number
// is entered are all ordinary states of a fast-moving table, not errors, so
// the UI needs no error handling on the action path.
//
// Confirmation is the CALLER's job. changeWinningNumber() and nextRound()
// execute unconditionally; needsConfirmation() is advisory. That keeps this
// module synchronous and DOM-free, so tests never stub a prompt.

import { BET_FIELDS, isValidNumber, isWinner } from "./wheel.js";

export function createRound() {
  return { status: "awaiting-number", winningNumber: null, stakes: {}, undoLog: [] };
}

export function setWinningNumber(round, n) {
  if (round.status !== "awaiting-number" || !isValidNumber(n)) return round;
  return { status: "collecting", winningNumber: n, stakes: {}, undoLog: [] };
}

/** Discards every stake: the winning fields change, so the old stakes are meaningless. */
export function changeWinningNumber(round, n) {
  if (round.status !== "collecting" || !isValidNumber(n)) return round;
  return { status: "collecting", winningNumber: n, stakes: {}, undoLog: [] };
}

export function addStake(round, fieldId) {
  if (round.status !== "collecting") return round;
  if (!isWinner(fieldId, round.winningNumber)) return round;
  return {
    ...round,
    stakes: { ...round.stakes, [fieldId]: (round.stakes[fieldId] ?? 0) + 1 },
    undoLog: [...round.undoLog, { type: "stake", fieldId }],
  };
}

/** Reverses ONE tap - never a whole field. A cleared field restores in full. */
export function undo(round) {
  if (round.undoLog.length === 0) return round;
  const entry = round.undoLog[round.undoLog.length - 1];
  const undoLog = round.undoLog.slice(0, -1);
  const stakes = { ...round.stakes };

  if (entry.type === "stake") {
    const remaining = (stakes[entry.fieldId] ?? 0) - 1;
    if (remaining >= 1) stakes[entry.fieldId] = remaining;
    else delete stakes[entry.fieldId];
  } else if (entry.type === "clear") {
    stakes[entry.fieldId] = entry.count;
  }

  return { ...round, stakes, undoLog };
}

export function clearField(round, fieldId) {
  const count = round.stakes[fieldId] ?? 0;
  if (count < 1) return round;
  const stakes = { ...round.stakes };
  delete stakes[fieldId];
  return { ...round, stakes, undoLog: [...round.undoLog, { type: "clear", fieldId, count }] };
}

export function nextRound() {
  return createRound();
}

/** True when the round holds at least one stake: the UI's cue to confirm first. */
export function needsConfirmation(round) {
  return Object.keys(round.stakes).length > 0;
}

/** Occupied fields only (taps >= 1), in catalogue order so rendering is deterministic. */
export function occupiedFields(round) {
  return BET_FIELDS.filter((f) => (round.stakes[f.id] ?? 0) >= 1).map((f) => ({
    field: f,
    taps: round.stakes[f.id],
  }));
}
