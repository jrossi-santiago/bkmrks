import { eq, and, isNull, inArray, asc } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks, revalidationRuns, users } from "./db/schema";
import { getTweetsByIds, TWEET_LOOKUP_MAX_IDS } from "./x";
import { getValidAccessToken } from "./db/users";

export type RevalidateResult = { checked: number; deleted: number; updated: number; apiCalls: number };

// Postgres's jsonb columns store object keys in their own canonical order,
// not the order they were inserted in — so a plain JSON.stringify of a
// freshly-fetched API object never matches JSON.stringify of the same data
// read back from `media`/`metrics` below, even when nothing actually
// changed. Sorting keys recursively before comparing makes the check care
// about content, not storage order.
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

// Bounds each run's cost and duration regardless of how many bookmarks
// exist across all users — at 100 ids/request (X's confirmed max) this is
// at most 5 batch lookups per cron invocation. Ordering candidates by
// last_verified_at ascending means the same cap still gets every bookmark
// re-checked eventually, oldest first, across successive daily runs.
const MAX_BOOKMARKS_PER_RUN = 500;

// Phase 4 compliance/hygiene job, run on a schedule by Vercel Cron (see
// vercel.json + src/app/api/cron/revalidate/route.ts). For the stalest
// not-yet-deleted bookmarks, confirms the source tweet still exists via
// X's batch tweet lookup and refreshes text/media/metrics from the latest
// response. A tweet X no longer returns for any reason (deleted, author
// suspended, account gone protected) gets soft-deleted immediately, on the
// first run that observes it — per the brief's own priority, a stranger
// seeing a dead tweet on a public page (Phase 5) is worse than a false-
// positive hide of a bookmark that was actually a transient API hiccup.
export async function runRevalidation(): Promise<RevalidateResult> {
  const db = getDb();
  const runId = crypto.randomUUID();
  await db.insert(revalidationRuns).values({ id: runId, status: "running" });

  let checked = 0;
  let deleted = 0;
  let updated = 0;
  let apiCalls = 0;

  try {
    const candidates = await db
      .select({
        id: bookmarks.id,
        userId: bookmarks.userId,
        tweetId: bookmarks.tweetId,
        text: bookmarks.text,
        media: bookmarks.media,
        metrics: bookmarks.metrics,
      })
      .from(bookmarks)
      .innerJoin(users, eq(users.id, bookmarks.userId))
      // Phase 6: no point spending X API calls (real, metered cost) keeping
      // a lapsed or never-paying account's bookmarks fresh.
      .where(and(isNull(bookmarks.deletedAt), eq(users.membershipActive, true)))
      .orderBy(asc(bookmarks.lastVerifiedAt))
      .limit(MAX_BOOKMARKS_PER_RUN);

    const byUser = new Map<string, typeof candidates>();
    for (const row of candidates) {
      const list = byUser.get(row.userId) ?? [];
      list.push(row);
      byUser.set(row.userId, list);
    }

    for (const [userId, rows] of byUser) {
      let accessToken: string;
      try {
        accessToken = await getValidAccessToken(userId);
      } catch (err) {
        // Don't fail the whole run over one user's dead/revoked token —
        // their bookmarks simply stay at the front of next run's queue.
        console.error(`revalidation: couldn't get access token for user ${userId}`, err);
        continue;
      }

      for (let i = 0; i < rows.length; i += TWEET_LOOKUP_MAX_IDS) {
        const batch = rows.slice(i, i + TWEET_LOOKUP_MAX_IDS);
        const byTweetId = new Map(batch.map((r) => [r.tweetId, r]));

        const page = await getTweetsByIds(accessToken, batch.map((r) => r.tweetId));
        apiCalls++;
        checked += batch.length;

        const mediaByKey = new Map((page.includes?.media ?? []).map((m) => [m.media_key, m]));
        const foundIds = new Set<string>();

        for (const tweet of page.data ?? []) {
          const existing = byTweetId.get(tweet.id);
          if (!existing) continue;
          foundIds.add(tweet.id);

          const media = (tweet.attachments?.media_keys ?? [])
            .map((key) => mediaByKey.get(key))
            .filter((m): m is NonNullable<typeof m> => Boolean(m));
          const newMedia = media.length ? media : null;
          const newMetrics = tweet.public_metrics ?? null;

          const changed =
            tweet.text !== existing.text ||
            stableStringify(newMedia) !== stableStringify(existing.media) ||
            stableStringify(newMetrics) !== stableStringify(existing.metrics);

          await db
            .update(bookmarks)
            .set(
              changed
                // Phase 7: text changed, so the stored embedding (if any) no
                // longer matches — null it out to re-enter the pending
                // queue src/lib/embed.ts drains.
                ? { text: tweet.text, media: newMedia, metrics: newMetrics, lastVerifiedAt: new Date(), embedding: null }
                : { lastVerifiedAt: new Date() }
            )
            .where(eq(bookmarks.id, existing.id));
          if (changed) updated++;
        }

        const missingIds = batch.filter((r) => !foundIds.has(r.tweetId)).map((r) => r.id);
        if (missingIds.length > 0) {
          await db
            .update(bookmarks)
            .set({ deletedAt: new Date(), lastVerifiedAt: new Date() })
            .where(inArray(bookmarks.id, missingIds));
          deleted += missingIds.length;
        }
      }
    }

    await db
      .update(revalidationRuns)
      .set({ status: "ok", finishedAt: new Date(), checkedCount: checked, deletedCount: deleted, updatedCount: updated, apiCalls })
      .where(eq(revalidationRuns.id, runId));

    return { checked, deleted, updated, apiCalls };
  } catch (err) {
    await db
      .update(revalidationRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        checkedCount: checked,
        deletedCount: deleted,
        updatedCount: updated,
        apiCalls,
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(revalidationRuns.id, runId));
    throw err;
  }
}
