// Regression test for the incremental-sync ordering bug: new bookmarks
// must sort above everything already stored, not below it. See the
// assignSourceOrder doc comment in ./sync.ts for the full story.
import assert from "node:assert/strict";
import { test } from "node:test";
import { assignSourceOrder } from "./sync";

test("assignSourceOrder puts every new item above maxOrder, newest first", () => {
  const newestFirst = [{ id: "d" }, { id: "e" }, { id: "f" }];
  const maxOrder = -3; // e.g. an account that already has bookmarks a=-1, b=-2, c=-3

  const ordered = assignSourceOrder(newestFirst, maxOrder);

  assert.deepEqual(
    ordered.map((b) => b.sourceOrder),
    [0, -1, -2]
  );
  // Every new sourceOrder must be > maxOrder, so a DESC sort (newest first)
  // never buries these behind the pre-existing bookmarks.
  for (const b of ordered) assert.ok(b.sourceOrder > maxOrder);
  // Newest-first input order must produce a strictly descending sequence,
  // so ORDER BY sourceOrder DESC reproduces X's own newest-first order.
  for (let i = 1; i < ordered.length; i++) {
    assert.ok(ordered[i - 1].sourceOrder > ordered[i].sourceOrder);
  }
});

test("assignSourceOrder on an empty table (maxOrder 0) still puts the newest item highest", () => {
  const ordered = assignSourceOrder([{ id: "a" }, { id: "b" }], 0);
  assert.deepEqual(
    ordered.map((b) => b.sourceOrder),
    [2, 1]
  );
});
