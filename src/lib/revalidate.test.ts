// Regression test: Postgres jsonb reorders object keys on storage, so a
// plain JSON.stringify comparison between a freshly-fetched API object and
// the same data read back from a jsonb column flags every row as "changed"
// even when nothing did — which permanently wiped `embedding` back to NULL
// on every revalidation pass and broke search. stableStringify must be
// insensitive to key order while still catching real content changes. See
// the stableStringify doc comment in ./revalidate.ts for the full story.
import assert from "node:assert/strict";
import { test } from "node:test";
import { stableStringify } from "./revalidate";

test("stableStringify treats differently-ordered keys as equal", () => {
  const fresh = { retweet_count: 1, reply_count: 2, like_count: 3, quote_count: 0, bookmark_count: 5, impression_count: 100 };
  // Same data, keys in the order Postgres's jsonb canonicalizes them to
  // (shortest key first, alphabetical within a tie) — mimics what a
  // round-tripped column read actually comes back as.
  const roundTripped = { like_count: 3, quote_count: 0, reply_count: 2, retweet_count: 1, bookmark_count: 5, impression_count: 100 };

  assert.equal(stableStringify(fresh), stableStringify(roundTripped));
});

test("stableStringify still detects a real content change", () => {
  const before = { retweet_count: 1, like_count: 3 };
  const after = { retweet_count: 1, like_count: 4 };

  assert.notEqual(stableStringify(before), stableStringify(after));
});

test("stableStringify is order-insensitive inside array elements too", () => {
  const fresh = [{ media_key: "3_1", type: "photo", url: "https://x.com/a.jpg" }];
  const roundTripped = [{ type: "photo", url: "https://x.com/a.jpg", media_key: "3_1" }];

  assert.equal(stableStringify(fresh), stableStringify(roundTripped));
});

test("stableStringify treats null the same both ways", () => {
  assert.equal(stableStringify(null), stableStringify(null));
});
