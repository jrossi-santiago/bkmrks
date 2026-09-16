import { eq, and, inArray, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks, syncRuns, users } from "./db/schema";
import { getBookmarks } from "./x";
import { getValidAccessToken } from "./db/users";
import { embedPendingBookmarks } from "./embed";

export type SyncResult = { fetched: number; new: number; apiCalls: number };

// Assigns sourceOrder to newly-synced tweets, already in X's newest-first
// order, so every one lands above `maxOrder` (the highest sourceOrder
// already stored for this user) instead of below the lowest — the bug this
// replaces buried each incremental sync's newest bookmarks under
// everything from earlier syncs. The newest tweet gets the highest value;
// each older one counts down from there, landing just above maxOrder for
// the oldest tweet in the batch.
export function assignSourceOrder<T>(
  newestFirst: readonly T[],
  maxOrder: number
): (T & { sourceOrder: number })[] {
  return newestFirst.map((item, i) => ({ ...item, sourceOrder: maxOrder + newestFirst.length - i }));
}

// Pages through bookmarks newest-first (confirmed order — see
// PROJECT_BRIEF.md Phase 0 answers) and stops at the first tweet_id already
// in the database: the watermark strategy. On a brand new user this never
// triggers, so it naturally runs a full backfill instead — one algorithm
// for both first login and every incremental sync after.
export async function runSync(userId: string): Promise<SyncResult> {
  const db = getDb();
  const runId = crypto.randomUUID();
  await db.insert(syncRuns).values({ id: runId, userId, status: "running" });

  let fetched = 0;
  let newCount = 0;
  let apiCalls = 0;
  // Collected here instead of inserted per-tweet because sourceOrder can't
  // be assigned until we know how many new tweets there are (see below) —
  // the pagination loop can span several pages before hitting the watermark.
  const newBookmarks: (typeof bookmarks.$inferInsert)[] = [];

  try {
    const [user] = await db
      .select({ xUserId: users.xUserId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error("User not found");

    let paginationToken: string | undefined;
    let stop = false;

    while (!stop) {
      const accessToken = await getValidAccessToken(userId);
      const page = await getBookmarks(accessToken, user.xUserId, paginationToken);
      apiCalls++;

      const tweets = page.data ?? [];
      if (tweets.length === 0) break;

      const authorsById = new Map((page.includes?.users ?? []).map((u) => [u.id, u]));
      const mediaByKey = new Map((page.includes?.media ?? []).map((m) => [m.media_key, m]));

      const existingIds = new Set(
        (
          await db
            .select({ tweetId: bookmarks.tweetId })
            .from(bookmarks)
            .where(
              and(
                eq(bookmarks.userId, userId),
                inArray(
                  bookmarks.tweetId,
                  tweets.map((t) => t.id)
                )
              )
            )
        ).map((row) => row.tweetId)
      );

      for (const tweet of tweets) {
        fetched++;
        if (existingIds.has(tweet.id)) {
          stop = true;
          break;
        }

        const author = authorsById.get(tweet.author_id);
        const media = (tweet.attachments?.media_keys ?? [])
          .map((key) => mediaByKey.get(key))
          .filter((m): m is NonNullable<typeof m> => Boolean(m));

        newBookmarks.push({
          id: crypto.randomUUID(),
          userId,
          tweetId: tweet.id,
          authorXUserId: tweet.author_id,
          authorHandle: author?.username ?? "unknown",
          authorDisplayName: author?.name ?? "Unknown",
          authorAvatarUrl: author?.profile_image_url ?? null,
          text: tweet.text,
          media: media.length ? media : null,
          metrics: tweet.public_metrics ?? null,
          tweetCreatedAt: new Date(tweet.created_at),
          sourceOrder: 0, // placeholder — assigned below once the batch size is known
        });
      }

      if (stop) break;
      paginationToken = page.meta?.next_token;
      if (!paginationToken) break;
    }

    newCount = newBookmarks.length;
    if (newCount > 0) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${bookmarks.sourceOrder}), 0)` })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));

      await db.insert(bookmarks).values(assignSourceOrder(newBookmarks, maxOrder)).onConflictDoNothing();
    }

    // Phase 7: embed whatever's pending for this user (newly-synced
    // bookmarks, plus any backlog from before this feature shipped).
    // Failure here shouldn't mark an otherwise-successful X sync as
    // "error" — embedding IS NULL just stays the pending state, and the
    // cron at /api/cron/embed catches up anything missed.
    try {
      await embedPendingBookmarks({ userId });
    } catch (err) {
      console.error(`embedPendingBookmarks failed for user ${userId}`, err);
    }

    await db
      .update(syncRuns)
      .set({ status: "ok", finishedAt: new Date(), fetchedCount: fetched, newCount, apiCalls })
      .where(eq(syncRuns.id, runId));

    return { fetched, new: newCount, apiCalls };
  } catch (err) {
    await db
      .update(syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        fetchedCount: fetched,
        newCount,
        apiCalls,
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(syncRuns.id, runId));
    throw err;
  }
}
