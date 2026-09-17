import assert from "node:assert/strict";
import { test } from "node:test";
import { parseExactPhrase, escapeIlikePattern } from "./search";

test("parseExactPhrase extracts the phrase from a fully-quoted query", () => {
  assert.equal(parseExactPhrase('"product pricing"'), "product pricing");
});

test("parseExactPhrase trims whitespace just inside the quotes", () => {
  assert.equal(parseExactPhrase('"  product pricing  "'), "product pricing");
});

test("parseExactPhrase returns empty for an unquoted query", () => {
  assert.equal(parseExactPhrase("product pricing"), "");
});

test("parseExactPhrase returns empty for a query quoted on only one side", () => {
  assert.equal(parseExactPhrase('"product pricing'), "");
  assert.equal(parseExactPhrase('product pricing"'), "");
});

test("parseExactPhrase returns empty for empty or whitespace-only quotes", () => {
  assert.equal(parseExactPhrase('""'), "");
  assert.equal(parseExactPhrase('"   "'), "");
});

test("parseExactPhrase returns empty for a bare quote character", () => {
  assert.equal(parseExactPhrase('"'), "");
});

test("escapeIlikePattern escapes %, _, and backslash so they match literally", () => {
  assert.equal(escapeIlikePattern("50% off"), "50\\% off");
  assert.equal(escapeIlikePattern("a_b"), "a\\_b");
  assert.equal(escapeIlikePattern("a\\b"), "a\\\\b");
});

test("escapeIlikePattern leaves an ordinary phrase untouched", () => {
  assert.equal(escapeIlikePattern("product pricing advice"), "product pricing advice");
});
