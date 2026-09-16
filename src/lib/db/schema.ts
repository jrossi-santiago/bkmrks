import { pgTable, text, timestamp, integer, jsonb, boolean, vector, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { XMedia } from "../x";

type PublicMetrics = Record<string, number>;

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    xUserId: text("x_user_id").notNull().unique(),
    xHandle: text("x_handle").notNull(),
    xDisplayName: text("x_display_name").notNull(),
    xAvatarUrl: text("x_avatar_url"),
    accessToken: text("access_token").notNull(), // encrypted at rest, see src/lib/crypto.ts
    refreshToken: text("refresh_token").notNull(), // encrypted at rest
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Phase 6: the paid gate. Set only by the Whop webhook handler
    // (src/app/api/webhooks/whop/route.ts) reacting to membership.activated/
    // deactivated — never by anything the user's own browser can trigger
    // directly. Defaults false: no free tier, not even during the gap
    // between account creation and a completed checkout.
    whopMembershipId: text("whop_membership_id"),
    membershipActive: boolean("membership_active").notNull().default(false),
    membershipUpdatedAt: timestamp("membership_updated_at", { withTimezone: true }),
  },
  // Every public route (/u/:handle, /u/:handle/:tag) looks users up by
  // lower(x_handle) — see src/lib/public.ts. Without this the lookup is a
  // seq scan over every user on every unauthenticated page view.
  (table) => [index("users_x_handle_lower_idx").on(sql`lower(${table.xHandle})`)]
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tweetId: text("tweet_id").notNull(),
    authorXUserId: text("author_x_user_id").notNull(),
    authorHandle: text("author_handle").notNull(),
    authorDisplayName: text("author_display_name").notNull(),
    authorAvatarUrl: text("author_avatar_url"),
    text: text("text").notNull(),
    media: jsonb("media").$type<XMedia[]>(),
    metrics: jsonb("metrics").$type<PublicMetrics>(),
    tweetCreatedAt: timestamp("tweet_created_at", { withTimezone: true }).notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
    // Position among this user's bookmarks, most-recently-bookmarked first
    // (X gives us order, not a bookmark timestamp — see PROJECT_BRIEF.md
    // Phase 0 answers). Lower = more recent. New bookmarks get values below
    // the current minimum so they always sort first, preserving the
    // relative order X returned.
    sourceOrder: integer("source_order").notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Phase 4: soft delete when source tweet is gone
    // Phase 7: semantic search. NULL = not yet embedded, which doubles as
    // the pending-work queue for src/lib/embed.ts — no separate status
    // column. Cleared back to NULL by src/lib/revalidate.ts when a tweet's
    // text changes, so a stale vector doesn't linger.
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    uniqueIndex("bookmarks_user_tweet_unique").on(table.userId, table.tweetId),
    // The dashboard's default list: user's live bookmarks, most recent
    // first (src/app/app/page.tsx). Partial on deleted_at IS NULL because
    // every read path filters soft-deleted rows out. Matches the query's
    // ORDER BY so Postgres reads it pre-sorted instead of sorting the
    // whole table on every page load.
    index("bookmarks_user_source_order_live_idx")
      .on(table.userId, table.sourceOrder.desc())
      .where(sql`deleted_at is null`),
    // Phase 7 semantic search does an ORDER BY cosine distance; without an
    // ANN index that is an exact scan over every embedded row.
    index("bookmarks_embedding_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isPublic: boolean("is_public").notNull().default(false), // Phase 5: does nothing yet
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_user_name_unique").on(table.userId, sql`lower(${table.name})`),
    index("tags_user_idx").on(table.userId),
  ]
);

export const bookmarkTags = pgTable(
  "bookmark_tags",
  {
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),
    // The PK is bookmark_id-first, so it can't serve lookups that start
    // from a tag: the ?tags= filter subquery and the tag-count join in
    // src/lib/tags.ts both do exactly that.
    index("bookmark_tags_tag_idx").on(table.tagId),
  ]
);

export const syncRuns = pgTable("sync_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(), // "running" | "ok" | "error"
  fetchedCount: integer("fetched_count").notNull().default(0),
  newCount: integer("new_count").notNull().default(0),
  apiCalls: integer("api_calls").notNull().default(0),
  error: text("error"),
});

// Phase 4: logs the periodic compliance/hygiene job (src/lib/revalidate.ts)
// separately from sync_runs — that table is per-user (one row per login/
// refresh); this job runs once globally across all users per cron
// invocation, so it doesn't fit sync_runs' shape.
export const revalidationRuns = pgTable("revalidation_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(), // "running" | "ok" | "error"
  checkedCount: integer("checked_count").notNull().default(0),
  deletedCount: integer("deleted_count").notNull().default(0), // newly soft-deleted this run
  updatedCount: integer("updated_count").notNull().default(0), // text/media/metrics refreshed this run
  apiCalls: integer("api_calls").notNull().default(0),
  error: text("error"),
});
