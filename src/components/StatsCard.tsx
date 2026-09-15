import type { UserStats } from "@/lib/stats";

function formatMemberSince(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// The one "screenshot-worthy" section in the app (everything else stays
// plain) — a dark brag card plus a plain-link "Share to X" button. No
// image export: X's share-intent URL can't attach one for you anyway, so
// this just pre-fills the tweet text and links back to the app.
export function StatsCard({
  stats,
  handle,
  shareUrl,
}: {
  stats: UserStats;
  handle: string;
  shareUrl: string;
}) {
  const maxWeekly = Math.max(1, ...stats.weeklyActivity.map((w) => w.count));
  const shareText = `I've bookmarked ${stats.totalBookmarks} things worth keeping on bkmrks${
    stats.publicBookmarks > 0 ? `, ${stats.publicBookmarks} of them public` : ""
  }. \u{1F516}`;
  const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div>
      <div className="rounded-2xl bg-neutral-900 p-6 text-white dark:bg-black">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">bkmrks</p>
        <p className="mt-1 text-sm text-neutral-300">@{handle}</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-3xl font-bold">{stats.totalBookmarks}</p>
            <p className="text-xs text-neutral-400">Total bookmarks</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.publicBookmarks}</p>
            <p className="text-xs text-neutral-400">Public</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.tagCount}</p>
            <p className="text-xs text-neutral-400">Tags</p>
          </div>
        </div>

        {stats.weeklyActivity.some((w) => w.count > 0) && (
          <div className="mt-6 flex h-12 items-end gap-1">
            {stats.weeklyActivity.map((w) => (
              <div
                key={w.week}
                className="flex-1 rounded-t bg-white/30"
                style={{ height: `${Math.max(8, (w.count / maxWeekly) * 100)}%` }}
                title={`Week of ${w.week}: ${w.count} bookmarked`}
              />
            ))}
          </div>
        )}

        {stats.memberSince && (
          <p className="mt-6 text-xs text-neutral-400">
            Member since {formatMemberSince(stats.memberSince)}
          </p>
        )}
      </div>

      <a
        href={intentUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Share to X
      </a>
    </div>
  );
}
