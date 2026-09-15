import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, isNull, inArray, notInArray, desc } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { bookmarks, bookmarkTags, users } from "@/lib/db/schema";
import { getUserTagsWithCounts, getTagsForBookmarks } from "@/lib/tags";
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
  searchParams: Promise<{ tags?: string; untagged?: string; checkout?: string }>;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");

  const params = await searchParams;

  // Phase 6 paid gate. Not active -> normally straight to /subscribe;
  // the one exception is landing here right after a Whop checkout
  // redirect, where the membership.activated webhook may not have been
  // processed yet (Whop's own guidance: react to the webhook, don't poll)
  // — show a "just a moment" message in place instead of bouncing back to
  // /subscribe, which would just bounce them right back here anyway.
  const db = getDb();
  const [user] = await db
    .select({ membershipActive: users.membershipActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user?.membershipActive) {
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
  const selectedTagIds = new Set(untagged ? [] : (params.tags?.split(",").filter(Boolean) ?? []));

  const conditions = [eq(bookmarks.userId, session.userId), isNull(bookmarks.deletedAt)];
  if (untagged) {
    conditions.push(
      notInArray(bookmarks.id, db.select({ id: bookmarkTags.bookmarkId }).from(bookmarkTags))
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

  const [allTags, tagsByBookmark] = await Promise.all([
    getUserTagsWithCounts(session.userId),
    getTagsForBookmarks(rows.map((r) => r.id)),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {session.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
          )}
          <div>
            <p className="font-semibold">{session.name}</p>
            <p className="text-sm text-neutral-500">@{session.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <form action="/app/refresh" method="post">
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Refresh
            </button>
          </form>
          <form action="/app/sign-out" method="post">
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <h1 className="mb-4 text-lg font-semibold">Your bookmarks</h1>

      <TagFilterBar allTags={allTags} selectedTagIds={selectedTagIds} untagged={untagged} />
      <TagManager allTags={allTags} handle={session.username} />

      {rows.length === 0 ? (
        <p className="text-neutral-500">
          {untagged || selectedTagIds.size > 0
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
              />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
