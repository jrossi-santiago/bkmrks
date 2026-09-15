import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, isNull, inArray, notInArray, desc, sql } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE, READING_MODE_COOKIE } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { bookmarks, bookmarkTags, tags } from "@/lib/db/schema";
import { getMembershipActive } from "@/lib/db/users";
import { getUserTagsWithCounts, getTagsForBookmarks } from "@/lib/tags";
import { AppHeader } from "@/components/AppHeader";
import { BookmarkCard } from "@/components/BookmarkCard";
import { TagFilterBar } from "@/components/TagFilterBar";
import { TagManager } from "@/components/TagManager";

// Phase 2: reads from the database — bookmarks are synced on login and on
// manual refresh (see /app/refresh), not fetched from X on every page load.
// Phase 3: tag chips filter which bookmarks are shown (?tags=id,id or
// ?untagged=1).
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string; untagged?: string; public?: string; checkout?: string }>;
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

  // Reused below both to filter (?untagged=1) and to check whether the
  // "Untagged" chip should even be shown (no point offering a filter that's
  // always empty).
  const bookmarkIdsWithAnyTag = db.select({ id: bookmarkTags.bookmarkId }).from(bookmarkTags);

  const conditions = [eq(bookmarks.userId, session.userId), isNull(bookmarks.deletedAt)];
  if (untagged) {
    conditions.push(notInArray(bookmarks.id, bookmarkIdsWithAnyTag));
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

  const rows = await db
    .select()
    .from(bookmarks)
    .where(and(...conditions))
    .orderBy(desc(bookmarks.sourceOrder));
  // desc() on sourceOrder is intentional even though newer bookmarks get
  // more-negative values (see schema.ts) — it sorts furthest-below-zero
  // (i.e. most recently added) first once compared against older, less
  // negative values.

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
          notInArray(bookmarks.id, bookmarkIdsWithAnyTag)
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

      <TagFilterBar
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        untagged={untagged}
        publicOnly={publicOnly}
        hasUntagged={hasUntagged}
        hasPublicBookmarks={hasPublicBookmarks}
      />
      <TagManager allTags={allTags} handle={session.username} />

      {rows.length === 0 ? (
        <p className="text-neutral-500">
          {untagged || publicOnly || selectedTagIds.size > 0
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
    </main>
  );
}
