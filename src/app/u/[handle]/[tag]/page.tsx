import { notFound } from "next/navigation";
import { getPublicTagByName, getPublicBookmarksForTag } from "@/lib/public";
import { PublicBookmarkCard } from "@/components/PublicBookmarkCard";

// Unauthenticated public tag page — the whole point of Phase 5. Looks up
// the tag through getPublicTagByName, which only ever returns a tag if
// is_public = true (src/lib/public.ts); a private tag and a nonexistent
// one are indistinguishable here (both 404), so this route can't be used
// to probe which tag names exist for a handle.
export const dynamic = "force-dynamic";

export default async function PublicTagPage({
  params,
}: {
  params: Promise<{ handle: string; tag: string }>;
}) {
  const { handle, tag: tagParam } = await params;

  const tag = await getPublicTagByName(handle, tagParam);
  if (!tag) notFound();

  const bookmarks = await getPublicBookmarksForTag(tag.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <a href={`/u/${handle}`} className="text-xs text-neutral-500 hover:underline">
          @{handle}
        </a>
        <h1 className="text-lg font-semibold">{tag.name}</h1>
      </header>

      {bookmarks.length === 0 ? (
        <p className="text-neutral-500">Nothing tagged here yet.</p>
      ) : (
        <ol className="space-y-4">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <PublicBookmarkCard bookmark={bookmark} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
