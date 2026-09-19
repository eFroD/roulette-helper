// Payout arithmetic.
// PURE MODULE: no document, no window, no navigator, no timers.
//
// There is no division anywhere in this file. Every figure is a product of
// integers, so with whole-number base stakes every displayed amount is exact.

export function unitFor(field, config) {
  return field.kind === "number" ? config.baseStakeNumber : config.baseStakeOutside;
}

/**
 * Figures for one occupied field.
 *
 * `perChip` is deliberately `unit * ratio` and never `win / taps`. Both give
 * the same answer, but the product keeps division out of the money path
 * entirely - which is what lets the dealer pay several players on one field
 * without the app ever knowing whose chips are whose.
 */
export function resultFor(field, taps, config) {
  const unit = unitFor(field, config);
  const stake = taps * unit;
  const win = stake * field.ratio;
  return {
    fieldId: field.id,
    label: field.label,
    taps,
    unit,
    stake,
    win,
    total: stake + win,
    perChip: unit * field.ratio,
  };
}

export function roundTotals(results) {
  return results.reduce(
    (acc, r) => ({
      stakeTotal: acc.stakeTotal + r.stake,
      winTotal: acc.winTotal + r.win,
      payoutTotal: acc.payoutTotal + r.total,
    }),
    { stakeTotal: 0, winTotal: 0, payoutTotal: 0 },
  );
}
