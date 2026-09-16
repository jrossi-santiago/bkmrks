import type { bookmarks } from "@/lib/db/schema";
import type { XMedia } from "@/lib/x";
import { addTagAction, removeTagAction, addToPublicAction } from "@/app/app/actions";

// /app/page.tsx selects every column except `embedding` (a 1536-float
// vector nothing here renders — no reason to ship it in the page payload).
type BookmarkRow = Omit<typeof bookmarks.$inferSelect, "embedding">;
type Tag = { id: string; name: string };

function MediaGrid({ media }: { media: XMedia[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((m) => {
        const src = m.type === "photo" ? m.url : m.preview_image_url;
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
              key={m.media_key}
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="rounded-md object-cover"
            />
        ) : null;
      })}
    </div>
  );
}

// Respects X's Display Requirements: tweet text is rendered exactly as
// stored (no truncation/rewriting), author attribution (avatar, name,
// handle) is always shown, and every card links back to the original tweet.
export function BookmarkCard({
  bookmark,
  tags,
  position,
  readingMode = false,
  isPublic = false,
}: {
  bookmark: BookmarkRow;
  tags: Tag[];
  position: number;
  readingMode?: boolean;
  isPublic?: boolean;
}) {
  const tweetUrl = `https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`;
  const postedAt = new Date(bookmark.tweetCreatedAt);

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-neutral-400">#{position}</span>
        {!readingMode && bookmark.authorAvatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bookmark.authorAvatarUrl}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="text-sm">
          <a
            href={`https://x.com/${bookmark.authorHandle}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {bookmark.authorDisplayName}
          </a>{" "}
          <span className="text-neutral-500">@{bookmark.authorHandle}</span>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm">{bookmark.text}</p>

      {bookmark.media && bookmark.media.length > 0 && (
        readingMode ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-neutral-500 hover:underline [&::-webkit-details-marker]:hidden list-none">
              Load image
            </summary>
            <div className="mt-2">
              <MediaGrid media={bookmark.media} />
            </div>
          </details>
        ) : (
          <div className="mt-3">
            <MediaGrid media={bookmark.media} />
          </div>
        )
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <form key={tag.id} action={removeTagAction} className="inline-flex">
            <input type="hidden" name="bookmarkId" value={bookmark.id} />
            <input type="hidden" name="tagId" value={tag.id} />
            <button
              type="submit"
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              title="Remove tag"
            >
              {tag.name} &times;
            </button>
          </form>
        ))}
        <form action={addTagAction} className="inline-flex items-center gap-1">
          <input type="hidden" name="bookmarkId" value={bookmark.id} />
          <input
            type="text"
            name="name"
            placeholder="+ tag"
            className="w-16 rounded-full border border-neutral-200 bg-transparent px-2 py-0.5 text-xs placeholder:text-neutral-400 focus:w-24 focus:outline-none dark:border-neutral-700"
          />
        </form>
        {!isPublic && (
          <form action={addToPublicAction} className="inline-flex">
            <input type="hidden" name="bookmarkId" value={bookmark.id} />
            <button
              type="submit"
              className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
            >
              Add to public page
            </button>
          </form>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <span title="This is the tweet's original post time, not when it was bookmarked">
          Posted {postedAt.toLocaleDateString()}
        </span>
        <a href={tweetUrl} target="_blank" rel="noreferrer" className="hover:underline">
          View on X &rarr;
        </a>
      </div>
    </article>
  );
}
