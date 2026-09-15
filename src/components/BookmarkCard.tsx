import type { bookmarks } from "@/lib/db/schema";

type BookmarkRow = typeof bookmarks.$inferSelect;

// Respects X's Display Requirements: tweet text is rendered exactly as
// stored (no truncation/rewriting), author attribution (avatar, name,
// handle) is always shown, and every card links back to the original tweet.
export function BookmarkCard({ bookmark, position }: { bookmark: BookmarkRow; position: number }) {
  const tweetUrl = `https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`;
  const postedAt = new Date(bookmark.tweetCreatedAt);

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-neutral-400">#{position}</span>
        {bookmark.authorAvatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bookmark.authorAvatarUrl} alt="" className="h-8 w-8 rounded-full" />
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          {bookmark.media.map((m) => {
            const src = m.type === "photo" ? m.url : m.preview_image_url;
            return src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.media_key} src={src} alt="" className="rounded-md object-cover" />
            ) : null;
          })}
        </div>
      )}

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
