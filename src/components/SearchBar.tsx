import { buildAppHref } from "@/lib/appUrl";

// Plain GET form, no client JS — same convention as TagFilterBar's chip
// links. Hidden inputs carry the active tag filters forward so submitting a
// search doesn't drop them (search composes with tag filters, per the
// design spec).
export function SearchBar({
  q,
  selectedTagIds,
  untagged,
  publicOnly,
}: {
  q: string;
  selectedTagIds: Set<string>;
  untagged: boolean;
  publicOnly: boolean;
}) {
  const tagsValue = selectedTagIds.size > 0 ? [...selectedTagIds].join(",") : undefined;
  const untaggedValue = untagged ? "1" : undefined;
  const publicValue = publicOnly ? "1" : undefined;

  return (
    <div className="mb-4 flex items-center gap-2">
      <form method="GET" action="/app" className="flex flex-1 items-center gap-2">
        {tagsValue && <input type="hidden" name="tags" value={tagsValue} />}
        {untaggedValue && <input type="hidden" name="untagged" value={untaggedValue} />}
        {publicValue && <input type="hidden" name="public" value={publicValue} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search your bookmarks…"
          className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
        />
      </form>
      {q && (
        <a
          href={buildAppHref({ tags: tagsValue, untagged: untaggedValue, public: publicValue })}
          className="text-xs whitespace-nowrap text-neutral-400 hover:underline"
        >
          Clear search
        </a>
      )}
    </div>
  );
}
