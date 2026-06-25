import test from "node:test";
import assert from "node:assert/strict";
import { normalizePrice, normalizeStringList, requireInteger, requireString } from "../server/validators.js";

test("requireString trims non-empty strings and rejects blank values", () => {
  assert.equal(requireString("  Watch  ", "name"), "Watch");
  assert.throws(() => requireString(" ", "name"), /name is required/);
});

test("requireInteger accepts integer-like values and rejects decimals", () => {
  assert.equal(requireInteger("12", "price"), 12);
  assert.throws(() => requireInteger("12.5", "price"), /price must be an integer/);
});

test("normalizePrice accepts single prices and price ranges", () => {
  assert.equal(normalizePrice("200", "price"), 200);
  assert.equal(normalizePrice("200-700", "price"), "200-700");
  assert.equal(normalizePrice("200 – 700", "price"), "200-700");
  assert.throws(() => normalizePrice("700-200", "price"), /price range must start with the lower price/);
});

test("normalizeStringList supports arrays and comma-separated values", () => {
  assert.deepEqual(normalizeStringList([" Black ", "White"], "colors"), ["Black", "White"]);
  assert.deepEqual(normalizeStringList("7, 8, 9", "sizes"), ["7", "8", "9"]);
});
