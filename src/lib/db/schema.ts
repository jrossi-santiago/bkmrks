import { pgTable, text, timestamp, integer, jsonb, boolean, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { XMedia } from "../x";

type PublicMetrics = Record<string, number>;

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  xUserId: text("x_user_id").notNull().unique(),
  xHandle: text("x_handle").notNull(),
  xDisplayName: text("x_display_name").notNull(),
  xAvatarUrl: text("x_avatar_url"),
  accessToken: text("access_token").notNull(), // encrypted at rest, see src/lib/crypto.ts
  refreshToken: text("refresh_token").notNull(), // encrypted at rest
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  },
  (table) => [uniqueIndex("bookmarks_user_tweet_unique").on(table.userId, table.tweetId)]
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
  (table) => [primaryKey({ columns: [table.bookmarkId, table.tagId] })]
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
