import type { XMedia } from "@/lib/x";

type PublicBookmark = {
  id: string;
  tweetId: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  text: string;
  media: XMedia[] | null;
  tweetCreatedAt: Date;
};

// Deliberately NOT a variant of BookmarkCard: this renders on an
// unauthenticated public page (see src/app/u/), so it must be structurally
// incapable of rendering the tag-edit forms/Server Actions BookmarkCard
// uses — no shared "editable" flag to accidentally default the wrong way.
// Same X Display Requirements as BookmarkCard: text verbatim, clear
// attribution, link back to the original.
export function PublicBookmarkCard({ bookmark }: { bookmark: PublicBookmark }) {
  const tweetUrl = `https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`;
  const postedAt = new Date(bookmark.tweetCreatedAt);

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2">
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
