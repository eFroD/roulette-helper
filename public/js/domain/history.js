// Bounded list of recent winning numbers. Display only - never feeds a
// calculation. PURE MODULE: no document, no window, no navigator, no timers.

import { isValidNumber } from "./wheel.js";

/**
 * Prepend a winning number, newest first, capped at `max`.
 * Returns the list unchanged when there is nothing to record.
 */
export function pushHistory(list, n, max) {
  const current = Array.isArray(list) ? list : [];
  if (!Number.isInteger(max) || max <= 0) return []; // historyLength 0 disables the strip
  if (!isValidNumber(n)) return current.slice(0, max); // round ended without a number
  return [n, ...current].slice(0, max);
}
