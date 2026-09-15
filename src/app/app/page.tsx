import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getBookmarks } from "@/lib/x";
import { BookmarkCard } from "@/components/BookmarkCard";

// Phase 1 exit criteria: sign in, see your own real bookmarks rendered
// cleanly, end to end. Calls the bookmarks endpoint live on every load — no
// database yet, that's Phase 2.
export default async function AppPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");

  const page = await getBookmarks(session.accessToken, session.userId);
  const tweets = page.data ?? [];
  const users = new Map((page.includes?.users ?? []).map((u) => [u.id, u]));
  const media = new Map((page.includes?.media ?? []).map((m) => [m.media_key, m]));

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
        <form action="/app/sign-out" method="post">
          <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            Sign out
          </button>
        </form>
      </header>

      <h1 className="mb-4 text-lg font-semibold">Your bookmarks</h1>

      {tweets.length === 0 ? (
        <p className="text-neutral-500">No bookmarks found.</p>
      ) : (
        <ol className="space-y-4">
          {tweets.map((tweet, index) => (
            <li key={tweet.id}>
              <BookmarkCard
                tweet={tweet}
                position={index + 1}
                author={users.get(tweet.author_id)}
                media={(tweet.attachments?.media_keys ?? [])
                  .map((key) => media.get(key))
                  .filter((m): m is NonNullable<typeof m> => Boolean(m))}
              />
            </li>
          ))}
        </ol>
      )}

      {page.meta?.next_token && (
        <p className="mt-6 text-sm text-neutral-500">
          There are more bookmarks than shown here — paging through all of
          them lands in Phase 2, once bookmarks are persisted to a database.
        </p>
      )}
    </main>
  );
}
