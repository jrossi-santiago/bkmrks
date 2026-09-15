import { eq, and, inArray, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks, syncRuns, users } from "./db/schema";
import { getBookmarks } from "./x";
import { getValidAccessToken } from "./db/users";

export type SyncResult = { fetched: number; new: number; apiCalls: number };

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

  try {
    const [user] = await db
      .select({ xUserId: users.xUserId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error("User not found");

    const [{ minOrder }] = await db
      .select({ minOrder: sql<number>`coalesce(min(${bookmarks.sourceOrder}), 0)` })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
    let nextOrder = minOrder - 1;

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

        await db
          .insert(bookmarks)
          .values({
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
            sourceOrder: nextOrder--,
          })
          .onConflictDoNothing();
        newCount++;
      }

      if (stop) break;
      paginationToken = page.meta?.next_token;
      if (!paginationToken) break;
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
