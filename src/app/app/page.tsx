import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { bookmarks } from "@/lib/db/schema";
import { BookmarkCard } from "@/components/BookmarkCard";

// Phase 2: reads from the database — bookmarks are synced on login and on
// manual refresh (see /app/refresh), not fetched from X on every page load.
export default async function AppPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");

  const db = getDb();
  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, session.userId))
    .orderBy(desc(bookmarks.sourceOrder));
  // desc() on sourceOrder is intentional even though newer bookmarks get
  // more-negative values (see schema.ts) — it sorts furthest-below-zero
  // (i.e. most recently added) first once compared against older, less
  // negative values.

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

      {rows.length === 0 ? (
        <p className="text-neutral-500">
          No bookmarks synced yet — if you just signed in, the first sync
          runs in the background and may take a moment. Try Refresh.
        </p>
      ) : (
        <ol className="space-y-4">
          {rows.map((bookmark, index) => (
            <li key={bookmark.id}>
              <BookmarkCard bookmark={bookmark} position={index + 1} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
