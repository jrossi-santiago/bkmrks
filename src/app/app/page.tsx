import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, isNull, isNotNull, inArray, notExists, desc, sql, cosineDistance, getTableColumns } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE, READING_MODE_COOKIE } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { bookmarks, bookmarkTags, tags } from "@/lib/db/schema";
import { getMembershipActive } from "@/lib/db/users";
import { getUserTagsWithCounts, getTagsForBookmarks } from "@/lib/tags";
import { embedTexts } from "@/lib/openai";
import { AppHeader } from "@/components/AppHeader";
import { BookmarkCard } from "@/components/BookmarkCard";
import { SearchBar } from "@/components/SearchBar";
import { TagFilterBar } from "@/components/TagFilterBar";
import { TagManager } from "@/components/TagManager";

// How many bookmarks the default (unsearched) list renders. Previously
// unbounded: a heavy account shipped every row it had into the RSC payload
// and mounted a card — and every image — for each one, which was the single
// biggest contributor to a slow-feeling /app. Search already capped at 30.
const PAGE_SIZE = 100;

// Phase 2: reads from the database — bookmarks are synced on login and on
// manual refresh (see /app/refresh), not fetched from X on every page load.
// Phase 3: tag chips filter which bookmarks are shown (?tags=id,id or
// ?untagged=1).
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string; untagged?: string; public?: string; checkout?: string; q?: string }>;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");
  const readingMode = cookieStore.get(READING_MODE_COOKIE)?.value === "1";

  const params = await searchParams;

  // Phase 6 paid gate. Not active -> normally straight to /subscribe;
  // the one exception is landing here right after a Whop checkout
  // redirect, where the membership.activated webhook may not have been
  // processed yet (Whop's own guidance: react to the webhook, don't poll)
  // — show a "just a moment" message in place instead of bouncing back to
  // /subscribe, which would just bounce them right back here anyway.
  const db = getDb();
  const membershipActive = await getMembershipActive(session.userId);

  if (!membershipActive) {
    if (params.checkout !== "return") redirect("/subscribe");
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-lg font-semibold">Confirming your membership&hellip;</h1>
        <p className="mb-6 text-sm text-neutral-500">
          This usually takes a few seconds. If it&apos;s been longer than a minute, try
          reloading.
        </p>
        <a href="/app" className="text-sm underline">
          Reload
        </a>
      </main>
    );
  }

  const untagged = params.untagged === "1";
  const publicOnly = !untagged && params.public === "1";
  const selectedTagIds = new Set(
    untagged || publicOnly ? [] : (params.tags?.split(",").filter(Boolean) ?? [])
  );
  // Phase 7: semantic search, composes with the tag filters above (AND) —
  // not a separate mode.
  const q = (params.q ?? "").trim();

  // Reused below both to filter (?untagged=1) and to check whether the
  // "Untagged" chip should even be shown (no point offering a filter that's
  // always empty). NOT EXISTS rather than NOT IN (subquery): correlated, so
  // Postgres anti-joins against bookmark_tags' primary key instead of first
  // materialising the id of every tagged bookmark in the table.
  const hasNoTags = notExists(
    db
      .select({ one: sql`1` })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.bookmarkId, bookmarks.id))
  );

  const conditions = [eq(bookmarks.userId, session.userId), isNull(bookmarks.deletedAt)];
  if (untagged) {
    conditions.push(hasNoTags);
  } else if (publicOnly) {
    conditions.push(
      inArray(
        bookmarks.id,
        db
          .select({ id: bookmarkTags.bookmarkId })
          .from(bookmarkTags)
          .innerJoin(tags, eq(tags.id, bookmarkTags.tagId))
          .where(and(eq(tags.userId, session.userId), eq(tags.isPublic, true)))
      )
    );
  } else if (selectedTagIds.size > 0) {
    conditions.push(
      inArray(
        bookmarks.id,
        db
          .select({ id: bookmarkTags.bookmarkId })
          .from(bookmarkTags)
          .where(inArray(bookmarkTags.tagId, [...selectedTagIds]))
      )
    );
  }

  // Every column except `embedding` — a 1536-float vector BookmarkCard
  // never renders, not worth shipping in the page payload.
  const { embedding: _embedding, ...bookmarkColumns } = getTableColumns(bookmarks);

  // Phase 7: ranked by semantic similarity to `q` instead of recency when a
  // search is active. Bookmarks with no embedding yet (still-pending, per
  // src/lib/embed.ts) are excluded rather than left to sort arbitrarily —
  // Postgres puts NULLs first on a DESC order by default, which would bury
  // real matches under un-embedded rows.
  let rows;
  if (q) {
    const [queryEmbedding] = await embedTexts([q]);
    const similarity = sql<number>`1 - (${cosineDistance(bookmarks.embedding, queryEmbedding)})`;
    rows = await db
      .select(bookmarkColumns)
      .from(bookmarks)
      .where(and(...conditions, isNotNull(bookmarks.embedding)))
      .orderBy(desc(similarity))
      .limit(30);
  } else {
    // desc() on sourceOrder is intentional even though newer bookmarks get
    // more-negative values (see schema.ts) — it sorts furthest-below-zero
    // (i.e. most recently added) first once compared against older, less
    // negative values.
    rows = await db
      .select(bookmarkColumns)
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(desc(bookmarks.sourceOrder))
      .limit(PAGE_SIZE);
  }

  const [allTags, tagsByBookmark, [untaggedCountRow]] = await Promise.all([
    getUserTagsWithCounts(session.userId),
    getTagsForBookmarks(rows.map((r) => r.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.userId),
          isNull(bookmarks.deletedAt),
          hasNoTags
        )
      ),
  ]);
  const publicTagIds = new Set(allTags.filter((t) => t.isPublic).map((t) => t.id));
  // Hide filter chips that would always show zero bookmarks — no point
  // cluttering the bar with a filter that leads nowhere.
  const hasUntagged = (untaggedCountRow?.count ?? 0) > 0;
  const hasPublicBookmarks = allTags.some((t) => t.isPublic && t.count > 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <AppHeader
        name={session.name}
        username={session.username}
        avatarUrl={session.avatarUrl || null}
        readingMode={readingMode}
      />

      <h1 className="mb-4 text-lg font-semibold">Your bookmarks</h1>

      <SearchBar q={q} selectedTagIds={selectedTagIds} untagged={untagged} publicOnly={publicOnly} />
      <TagFilterBar
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        untagged={untagged}
        publicOnly={publicOnly}
        hasUntagged={hasUntagged}
        hasPublicBookmarks={hasPublicBookmarks}
        q={q}
      />
      <TagManager allTags={allTags} handle={session.username} />

      {rows.length === 0 ? (
        <p className="text-neutral-500">
          {q
            ? "No bookmarks match your search."
            : untagged || publicOnly || selectedTagIds.size > 0
              ? "No bookmarks match this filter."
              : "No bookmarks synced yet — if you just signed in, the first sync runs in the background and may take a moment. Try Refresh."}
        </p>
      ) : (
        <ol className="space-y-4">
          {rows.map((bookmark, index) => (
            <li key={bookmark.id}>
              <BookmarkCard
                bookmark={bookmark}
                tags={tagsByBookmark.get(bookmark.id) ?? []}
                position={index + 1}
                readingMode={readingMode}
                isPublic={(tagsByBookmark.get(bookmark.id) ?? []).some((t) => publicTagIds.has(t.id))}
              />
            </li>
          ))}
        </ol>
      )}

      {!q && rows.length === PAGE_SIZE && (
        <p className="mt-6 text-sm text-neutral-500">
          Showing your {PAGE_SIZE} most recent bookmarks. Use search or a tag filter to
          reach older ones.
        </p>
      )}
    </main>
  );
}
