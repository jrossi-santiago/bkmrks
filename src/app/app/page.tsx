import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, isNull, isNotNull, inArray, notExists, desc, sql, cosineDistance, getTableColumns } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE, READING_MODE_COOKIE } from "@/lib/session";
import { buildAppHref } from "@/lib/appUrl";
import { getDb } from "@/lib/db/client";
import { bookmarks, bookmarkTags, tags } from "@/lib/db/schema";
import { getMembershipActive } from "@/lib/db/users";
import { getUserTagsWithCounts, getTagsForBookmarks } from "@/lib/tags";
import { getUserHandlesWithCounts } from "@/lib/handles";
import { embedTexts } from "@/lib/openai";
import { AppHeader } from "@/components/AppHeader";
import { BookmarkCard } from "@/components/BookmarkCard";
import { SearchBar } from "@/components/SearchBar";
import { TagFilterBar } from "@/components/TagFilterBar";
import { HandleFilterBar } from "@/components/HandleFilterBar";
import { TagManager } from "@/components/TagManager";

// How many bookmarks the default (unsearched) list renders per page, and
// how much each "Show more" click adds. Previously unbounded: a heavy
// account shipped every row it had into the RSC payload and mounted a
// card — and every image — for each one, which was the single biggest
// contributor to a slow-feeling /app. Search already capped at 30.
const PAGE_SIZE = 100;
// Upper bound on ?limit= so "Show more" can't be clicked (or the URL
// edited) back into the unbounded-payload problem PAGE_SIZE exists to fix.
const MAX_LIMIT = PAGE_SIZE * 10;

// Phase 2: reads from the database — bookmarks are synced on login and on
// manual refresh (see /app/refresh), not fetched from X on every page load.
// Phase 3: tag chips filter which bookmarks are shown (?tags=id,id or
// ?untagged=1).
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{
    tags?: string;
    untagged?: string;
    public?: string;
    checkout?: string;
    q?: string;
    handle?: string;
    sort?: string;
    limit?: string;
  }>;
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
  // Filters the list down to one author's posts, composes with everything
  // else (tags, untagged/public, search) the same way `q` does. Leading "@"
  // stripped so both "elonmusk" and "@elonmusk" work when typed by hand
  // instead of picked from HandleFilterBar's datalist.
  const handle = (params.handle ?? "").trim().replace(/^@+/, "");

  // Sort only applies to the unsearched list — a search already ranks by
  // semantic similarity, which sorting by date would just override.
  // "created" = the tweet's original post time; "saved" (default) =
  // source_order, the closest thing to a "date bookmarked" X gives us (see
  // PROJECT_BRIEF.md Phase 0 answers — X exposes bookmark order, not a
  // bookmark timestamp).
  const sort = params.sort === "created" ? "created" : "saved";

  const requestedLimit = Number(params.limit);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_LIMIT)
      : PAGE_SIZE;

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
  if (handle) {
    // Case-insensitive equality, not ILIKE substring — the datalist offers
    // exact handles, and a substring match risks pulling in unrelated
    // profiles whose handle happens to contain what was typed.
    conditions.push(sql`lower(${bookmarks.authorHandle}) = lower(${handle})`);
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
  let hasMore = false;
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
    // Fetch one extra row to tell "exactly `limit` bookmarks exist" apart
    // from "there are more" without a separate count query.
    // ponytail: sort=created relies on the existing (user_id, deleted_at)
    // filter index and sorts tweet_created_at in memory — fine at personal
    // scale. Add a matching (user_id, tweet_created_at DESC) partial index,
    // like bookmarks_user_source_order_live_idx, if this gets slow.
    const orderColumn = sort === "created" ? bookmarks.tweetCreatedAt : bookmarks.sourceOrder;
    rows = await db
      .select(bookmarkColumns)
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(desc(orderColumn))
      .limit(limit + 1);
    hasMore = rows.length > limit;
    if (hasMore) rows = rows.slice(0, limit);
  }

  const [allTags, allHandles, tagsByBookmark, [untaggedCountRow]] = await Promise.all([
    getUserTagsWithCounts(session.userId),
    getUserHandlesWithCounts(session.userId),
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
  // Shared across every link below so toggling one filter never silently
  // drops another that's currently active.
  const tagsParam = selectedTagIds.size > 0 ? [...selectedTagIds].join(",") : undefined;
  const untaggedParam = untagged ? "1" : undefined;
  const publicParam = publicOnly ? "1" : undefined;
  const handleParam = handle || undefined;
  const sortParam = sort === "created" ? "created" : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 lg:max-w-7xl">
      <AppHeader
        name={session.name}
        username={session.username}
        avatarUrl={session.avatarUrl || null}
        readingMode={readingMode}
      />

      <h1 className="mb-4 text-lg font-semibold">Your bookmarks</h1>

      <SearchBar
        q={q}
        selectedTagIds={selectedTagIds}
        untagged={untagged}
        publicOnly={publicOnly}
        handle={handle}
        sort={sort}
      />
      <HandleFilterBar
        handle={handle}
        allHandles={allHandles}
        q={q}
        selectedTagIds={selectedTagIds}
        untagged={untagged}
        publicOnly={publicOnly}
        sort={sort}
      />
      <TagFilterBar
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        untagged={untagged}
        publicOnly={publicOnly}
        hasUntagged={hasUntagged}
        hasPublicBookmarks={hasPublicBookmarks}
        q={q}
        handle={handle}
        sort={sort}
      />
      <TagManager allTags={allTags} handle={session.username} />

      {!q && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="text-neutral-400">Sort:</span>
          {(["saved", "created"] as const).map((option) => (
            <a
              key={option}
              href={buildAppHref({
                tags: tagsParam,
                untagged: untaggedParam,
                public: publicParam,
                handle: handleParam,
                sort: option === "created" ? "created" : undefined,
              })}
              className={
                sort === option
                  ? "font-medium text-neutral-900 underline dark:text-neutral-100"
                  : "text-neutral-500 hover:underline"
              }
            >
              {option === "saved" ? "Recently saved" : "Recently posted"}
            </a>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-neutral-500">
          {q
            ? "No bookmarks match your search."
            : untagged || publicOnly || selectedTagIds.size > 0 || handle
              ? "No bookmarks match this filter."
              : "No bookmarks synced yet — if you just signed in, the first sync runs in the background and may take a moment. Try Refresh."}
        </p>
      ) : (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
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

      {!q && hasMore && (
        <div className="mt-6 text-center">
          {limit >= MAX_LIMIT ? (
            <p className="text-sm text-neutral-500">
              Showing your {MAX_LIMIT} most recent bookmarks. Use search or a tag filter to
              reach older ones.
            </p>
          ) : (
            <a
              href={buildAppHref({
                tags: tagsParam,
                untagged: untaggedParam,
                public: publicParam,
                handle: handleParam,
                sort: sortParam,
                limit: String(Math.min(limit + PAGE_SIZE, MAX_LIMIT)),
              })}
              className="inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Show more bookmarks
            </a>
          )}
        </div>
      )}
    </main>
  );
}
