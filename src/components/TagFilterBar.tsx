export function TagFilterBar({
  allTags,
  selectedTagIds,
  untagged,
}: {
  allTags: { id: string; name: string; count: number }[];
  selectedTagIds: Set<string>;
  untagged: boolean;
}) {
  if (allTags.length === 0) return null;

  function hrefToggling(tagId: string) {
    const next = new Set(selectedTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    return next.size > 0 ? `/app?tags=${[...next].join(",")}` : "/app";
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs ${
      active
        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
    }`;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {allTags.map((tag) => (
        <a key={tag.id} href={hrefToggling(tag.id)} className={chipClass(selectedTagIds.has(tag.id))}>
          {tag.name} ({tag.count})
        </a>
      ))}
      <a href={untagged ? "/app" : "/app?untagged=1"} className={chipClass(untagged)}>
        Untagged
      </a>
      {(untagged || selectedTagIds.size > 0) && (
        <a href="/app" className="text-xs text-neutral-400 hover:underline">
          Clear filters
        </a>
      )}
    </div>
  );
}
