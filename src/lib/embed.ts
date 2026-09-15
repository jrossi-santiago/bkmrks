import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks, users } from "./db/schema";
import { embedTexts } from "./openai";

export type EmbedResult = { embedded: number };

// Bounds each call's cost/duration the same way revalidate.ts's
// MAX_BOOKMARKS_PER_RUN does — a single user's first-ever backfill (or a
// global cron sweep) that exceeds this just gets the rest next run, since
// "embedding IS NULL" is a durable queue, not a one-shot job.
const DEFAULT_LIMIT = 500;

// Embeds bookmarks with no vector yet (embedding IS NULL doubles as the
// pending-work queue — see schema.ts). Called two ways:
// - scoped to one userId, as the last step of runSync (src/lib/sync.ts) —
//   embeds a user's newly-synced bookmarks right away.
// - unscoped, from the cron at src/app/api/cron/embed/route.ts — sweeps
//   every member's backlog, which is what actually backfills bookmarks that
//   existed before this feature shipped.
// The membership check applies either way (harmless when scoped, since
// runSync's own callers already gate on it) — same reasoning as
// revalidate.ts: no point spending calls on a lapsed account.
export async function embedPendingBookmarks(opts: {
  userId?: string;
  limit?: number;
}): Promise<EmbedResult> {
  const db = getDb();

  const conditions = [isNull(bookmarks.embedding), isNull(bookmarks.deletedAt), eq(users.membershipActive, true)];
  if (opts.userId) conditions.push(eq(bookmarks.userId, opts.userId));

  const candidates = await db
    .select({ id: bookmarks.id, text: bookmarks.text })
    .from(bookmarks)
    .innerJoin(users, eq(users.id, bookmarks.userId))
    .where(and(...conditions))
    .limit(opts.limit ?? DEFAULT_LIMIT);

  if (candidates.length === 0) return { embedded: 0 };

  const vectors = await embedTexts(candidates.map((c) => c.text));

  for (let i = 0; i < candidates.length; i++) {
    await db.update(bookmarks).set({ embedding: vectors[i] }).where(eq(bookmarks.id, candidates[i].id));
  }

  return { embedded: candidates.length };
}
