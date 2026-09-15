import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks, bookmarkTags, tags, users } from "./db/schema";

export type WeeklyActivity = { week: string; count: number };

export type UserStats = {
  totalBookmarks: number;
  publicBookmarks: number;
  tagCount: number;
  memberSince: Date | null;
  weeklyActivity: WeeklyActivity[]; // oldest -> newest, last 12 weeks
};

// All-time bookmarking stats for the /app/stats "brag card". Every query
// here is scoped to userId and reads tables that already exist — no new
// tracking/schema for this, just aggregates over what's already stored.
export async function getUserStats(userId: string): Promise<UserStats> {
  const db = getDb();

  const [totalsRows, publicRows, tagRows, userRows, weeklyRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt))),

    db
      .select({ count: sql<number>`count(distinct ${bookmarks.id})::int` })
      .from(bookmarks)
      .innerJoin(bookmarkTags, eq(bookmarkTags.bookmarkId, bookmarks.id))
      .innerJoin(tags, eq(tags.id, bookmarkTags.tagId))
      .where(and(eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt), eq(tags.isPublic, true))),

    db.select({ count: sql<number>`count(*)::int` }).from(tags).where(eq(tags.userId, userId)),

    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1),

    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${bookmarks.importedAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt)))
      .groupBy(sql`date_trunc('week', ${bookmarks.importedAt})`)
      .orderBy(sql`date_trunc('week', ${bookmarks.importedAt}) desc`)
      .limit(12),
  ]);

  return {
    totalBookmarks: totalsRows[0]?.count ?? 0,
    publicBookmarks: publicRows[0]?.count ?? 0,
    tagCount: tagRows[0]?.count ?? 0,
    memberSince: userRows[0]?.createdAt ?? null,
    weeklyActivity: weeklyRows.reverse(),
  };
}
