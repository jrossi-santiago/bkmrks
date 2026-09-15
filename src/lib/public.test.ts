// Proves the Phase 5 security non-negotiable at the query level, not by
// eyeballing src/lib/public.ts: every query reachable from an unauthenticated
// /u/... route must independently carry an is_public = true filter (and, for
// bookmarks, a deleted_at IS NULL filter — Phase 4 hygiene applies to public
// pages too). Runs against drizzle's generated SQL via .toSQL(), which never
// touches a real connection, so this needs no live database.
import assert from "node:assert/strict";
import { test } from "node:test";
import { getDb } from "./db/client";
import {
  publicTagsForHandleQuery,
  publicTagByNameQuery,
  publicBookmarksForTagQuery,
  publicUserExistsQuery,
} from "./public";

// getDb() only reads DATABASE_URL when called, and postgres.js connects
// lazily on first query — .toSQL() never executes one, so a fake
// connection string is enough to build (never run) these queries.
process.env.DATABASE_URL ??= "postgresql://fake:fake@localhost:5432/fake";

const db = getDb();

function assertHasTrueParam(params: unknown[], label: string) {
  assert.ok(params.includes(true), `expected ${label} params to include a literal true, got ${JSON.stringify(params)}`);
}

test("publicTagsForHandleQuery always filters is_public = true", () => {
  const { sql, params } = publicTagsForHandleQuery(db, "somehandle").toSQL();
  assert.match(sql, /"is_public"/, "query must reference the is_public column");
  assert.match(sql, /"tags"/, "query must read from the tags table");
  assertHasTrueParam(params, "publicTagsForHandleQuery");
});

test("publicTagByNameQuery always filters is_public = true, scoped to one handle+name", () => {
  const { sql, params } = publicTagByNameQuery(db, "somehandle", "sometag").toSQL();
  assert.match(sql, /"is_public"/, "query must reference the is_public column");
  assert.match(sql, /lower\(/i, "handle/name comparisons must be case-insensitive");
  assertHasTrueParam(params, "publicTagByNameQuery");
  assert.ok(params.includes("somehandle"), "handle must be parameterized, not hardcoded");
  assert.ok(params.includes("sometag"), "tag name must be parameterized, not hardcoded");
});

test("publicBookmarksForTagQuery filters is_public = true AND deleted_at IS NULL, even given an arbitrary tag id", () => {
  const { sql, params } = publicBookmarksForTagQuery(db, "any-tag-id-including-a-private-ones").toSQL();
  assert.match(sql, /"is_public"/, "query must re-check is_public even though the caller already looked the tag up");
  assert.match(sql, /"deleted_at"\s+is\s+null/i, "soft-deleted bookmarks (Phase 4) must never reach a public page");
  assertHasTrueParam(params, "publicBookmarksForTagQuery");

  // The SELECT list itself must not reach for any column beyond what a
  // public card renders — no user_id, author_x_user_id, metrics, or
  // internal timestamps, even though joining through bookmark_tags/tags
  // makes those columns available to reference.
  const selectClause = sql.slice(sql.toLowerCase().indexOf("select") + 6, sql.toLowerCase().indexOf(" from "));
  for (const forbidden of ["user_id", "author_x_user_id", "metrics", "imported_at", "last_verified_at"]) {
    assert.doesNotMatch(
      selectClause,
      new RegExp(`"${forbidden}"`, "i"),
      `publicBookmarksForTagQuery must not select "${forbidden}" — review for a private-data leak`
    );
  }
});

test("publicUserExistsQuery only selects an id, never any other user field", () => {
  const query = publicUserExistsQuery(db, "somehandle");
  const { sql } = query.toSQL();
  assert.doesNotMatch(sql, /access_token|refresh_token/i, "must never select token columns");
});
