import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, resolveConfig } from "../public/js/domain/config.js";

test("a missing, empty, or non-object config yields the defaults silently", () => {
  for (const raw of [undefined, null, {}, "nonsense", 42]) {
    const { config, warnings } = resolveConfig(raw);
    assert.deepEqual(config, DEFAULT_CONFIG);
    assert.deepEqual(warnings, [], "absent configuration is not an error");
  }
});

test("valid values are taken as given", () => {
  const { config, warnings } = resolveConfig({
    baseStakeOutside: 20, baseStakeNumber: 2, currencySymbol: "$", historyLength: 5,
  });
  assert.deepEqual(config, {
    baseStakeOutside: 20, baseStakeNumber: 2, currencySymbol: "$", historyLength: 5, lineBets: true,
  });
  assert.deepEqual(warnings, []);
});

test("each invalid value falls back INDEPENDENTLY - valid siblings survive", () => {
  const { config, warnings } = resolveConfig({
    baseStakeOutside: -1, // invalid
    baseStakeNumber: 7, // valid, must be kept
    currencySymbol: "", // invalid
    historyLength: 3, // valid, must be kept
  });
  assert.equal(config.baseStakeOutside, DEFAULT_CONFIG.baseStakeOutside);
  assert.equal(config.baseStakeNumber, 7);
  assert.equal(config.currencySymbol, DEFAULT_CONFIG.currencySymbol);
  assert.equal(config.historyLength, 3);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.some((w) => w.includes("baseStakeOutside")), "the warning names the key");
  assert.ok(warnings.some((w) => w.includes("currencySymbol")));
});

test("rejects the specific invalid shapes the contract lists", () => {
  for (const bad of [0, -5, NaN, Infinity, "10", null, true]) {
    assert.equal(resolveConfig({ baseStakeNumber: bad }).config.baseStakeNumber, DEFAULT_CONFIG.baseStakeNumber);
  }
  for (const bad of ["", "   ", 5, null]) {
    assert.equal(resolveConfig({ currencySymbol: bad }).config.currencySymbol, DEFAULT_CONFIG.currencySymbol);
  }
  for (const bad of [-1, 2.5, "10", null]) {
    assert.equal(resolveConfig({ historyLength: bad }).config.historyLength, DEFAULT_CONFIG.historyLength);
  }
  assert.equal(resolveConfig({ historyLength: 0 }).config.historyLength, 0, "0 is valid: it hides the strip");
});

test("unknown keys are ignored, so the host can leave notes in the file", () => {
  const { config, warnings } = resolveConfig({ baseStakeNumber: 3, note: "Silvester 2026" });
  assert.equal(config.baseStakeNumber, 3);
  assert.equal("note" in config, false);
  assert.deepEqual(warnings, []);
});

test("the currency symbol is trimmed but otherwise verbatim", () => {
  assert.equal(resolveConfig({ currencySymbol: "  CHF " }).config.currencySymbol, "CHF");
});

test("line bets default to on; false switches them off", () => {
  assert.equal(DEFAULT_CONFIG.lineBets, true);
  assert.equal(resolveConfig({}).config.lineBets, true);
  const { config, warnings } = resolveConfig({ lineBets: false });
  assert.equal(config.lineBets, false);
  assert.deepEqual(warnings, []);
});

test("lineBets accepts only a real boolean - the string \"false\" is a warned typo", () => {
  for (const bad of ["false", 0, null, "no"]) {
    const { config, warnings } = resolveConfig({ lineBets: bad });
    assert.equal(config.lineBets, true, `${JSON.stringify(bad)} must fall back to the default`);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes("lineBets"), "the warning names the key");
  }
});

test("an invalid lineBets leaves valid siblings untouched", () => {
  const { config } = resolveConfig({ lineBets: "off", baseStakeNumber: 2, currencySymbol: "CHF" });
  assert.equal(config.baseStakeNumber, 2);
  assert.equal(config.currencySymbol, "CHF");
});
