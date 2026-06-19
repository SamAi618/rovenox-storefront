import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStringList, requireInteger, requireString } from "../server/validators.js";

test("requireString trims non-empty strings and rejects blank values", () => {
  assert.equal(requireString("  Watch  ", "name"), "Watch");
  assert.throws(() => requireString(" ", "name"), /name is required/);
});

test("requireInteger accepts integer-like values and rejects decimals", () => {
  assert.equal(requireInteger("12", "price"), 12);
  assert.throws(() => requireInteger("12.5", "price"), /price must be an integer/);
});

test("normalizeStringList supports arrays and comma-separated values", () => {
  assert.deepEqual(normalizeStringList([" Black ", "White"], "colors"), ["Black", "White"]);
  assert.deepEqual(normalizeStringList("7, 8, 9", "sizes"), ["7", "8", "9"]);
});
