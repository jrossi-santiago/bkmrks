import type { XMedia, XTweet, XUser } from "@/lib/x";

// Respects X's Display Requirements: tweet text is rendered exactly as
// returned (no truncation/rewriting), author attribution (avatar, name,
// handle) is always shown, and every card links back to the original tweet.
export function BookmarkCard({
  tweet,
  author,
  media,
  position,
}: {
  tweet: XTweet;
  author?: XUser;
  media: XMedia[];
  position: number;
}) {
  const tweetUrl = author
    ? `https://x.com/${author.username}/status/${tweet.id}`
    : `https://x.com/i/status/${tweet.id}`;
  const postedAt = new Date(tweet.created_at);

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-neutral-400">#{position}</span>
        {author?.profile_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.profile_image_url} alt="" className="h-8 w-8 rounded-full" />
        )}
        <div className="text-sm">
          <a
            href={author ? `https://x.com/${author.username}` : "#"}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {author?.name ?? "Unknown"}
          </a>{" "}
          <span className="text-neutral-500">@{author?.username ?? "unknown"}</span>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm">{tweet.text}</p>

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {media.map((m) => {
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
