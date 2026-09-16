import { buildAppHref } from "@/lib/appUrl";

export function TagFilterBar({
  allTags,
  selectedTagIds,
  untagged,
  publicOnly,
  hasUntagged,
  hasPublicBookmarks,
  q,
  handle,
  sort,
}: {
  allTags: { id: string; name: string; count: number }[];
  selectedTagIds: Set<string>;
  untagged: boolean;
  publicOnly: boolean;
  hasUntagged: boolean;
  hasPublicBookmarks: boolean;
  q: string;
  handle: string;
  sort: string;
}) {
  // A filter that would always show zero bookmarks just clutters the bar —
  // skip it, unless it's the one currently applied (so clearing it stays
  // possible even if its count changed to 0 since the link was loaded).
  const visibleTags = allTags.filter((tag) => tag.count > 0 || selectedTagIds.has(tag.id));
  const showUntagged = hasUntagged || untagged;
  const showPublic = hasPublicBookmarks || publicOnly;
  const handleValue = handle || undefined;
  const sortValue = sort === "created" ? "created" : undefined;

  if (visibleTags.length === 0 && !showUntagged && !showPublic) return null;

  function hrefToggling(tagId: string) {
    const next = new Set(selectedTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    return buildAppHref({
      tags: next.size > 0 ? [...next].join(",") : undefined,
      q,
      handle: handleValue,
      sort: sortValue,
    });
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs ${
      active
        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
    }`;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {visibleTags.map((tag) => (
        <a key={tag.id} href={hrefToggling(tag.id)} className={chipClass(selectedTagIds.has(tag.id))}>
          {tag.name} ({tag.count})
        </a>
      ))}
      {showUntagged && (
        <a
          href={
            untagged
              ? buildAppHref({ q, handle: handleValue, sort: sortValue })
              : buildAppHref({ untagged: "1", q, handle: handleValue, sort: sortValue })
          }
          className={chipClass(untagged)}
        >
          Untagged
        </a>
      )}
      {showPublic && (
        <a
          href={
            publicOnly
              ? buildAppHref({ q, handle: handleValue, sort: sortValue })
              : buildAppHref({ public: "1", q, handle: handleValue, sort: sortValue })
          }
          className={chipClass(publicOnly)}
        >
          Public
        </a>
      )}
      {(untagged || publicOnly || selectedTagIds.size > 0) && (
        <a href={buildAppHref({ q, handle: handleValue, sort: sortValue })} className="text-xs text-neutral-400 hover:underline">
          Clear filters
        </a>
      )}
    </div>
  );
}
