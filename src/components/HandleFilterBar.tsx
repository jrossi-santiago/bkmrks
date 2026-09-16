import { buildAppHref } from "@/lib/appUrl";

// Plain GET form + <datalist>, same no-client-JS convention as SearchBar and
// TagFilterBar. The datalist lists every author the user has ever bookmarked
// so filtering down to "all posts from this profile" doesn't require typing
// the handle exactly — pick a suggestion or type one in and submit.
export function HandleFilterBar({
  handle,
  allHandles,
  q,
  selectedTagIds,
  untagged,
  publicOnly,
  sort,
  dir,
}: {
  handle: string;
  allHandles: { handle: string; count: number }[];
  q: string;
  selectedTagIds: Set<string>;
  untagged: boolean;
  publicOnly: boolean;
  sort: string;
  dir: string;
}) {
  if (allHandles.length === 0) return null;

  const qValue = q || undefined;
  const tagsValue = selectedTagIds.size > 0 ? [...selectedTagIds].join(",") : undefined;
  const untaggedValue = untagged ? "1" : undefined;
  const publicValue = publicOnly ? "1" : undefined;
  const sortValue = sort === "created" ? "created" : undefined;
  const dirValue = dir === "asc" ? "asc" : undefined;

  return (
    <div className="mb-4 flex items-center gap-2">
      <form method="GET" action="/app" className="flex items-center gap-2">
        {qValue && <input type="hidden" name="q" value={qValue} />}
        {tagsValue && <input type="hidden" name="tags" value={tagsValue} />}
        {untaggedValue && <input type="hidden" name="untagged" value={untaggedValue} />}
        {publicValue && <input type="hidden" name="public" value={publicValue} />}
        {sortValue && <input type="hidden" name="sort" value={sortValue} />}
        {dirValue && <input type="hidden" name="dir" value={dirValue} />}
        <input
          type="text"
          name="handle"
          list="bkmrks-handles"
          defaultValue={handle}
          placeholder="Filter by @handle…"
          className="w-48 rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
        />
        <datalist id="bkmrks-handles">
          {allHandles.map((h) => (
            <option key={h.handle} value={h.handle} label={`${h.count} bookmark${h.count === 1 ? "" : "s"}`} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Filter
        </button>
      </form>
      {handle && (
        <a
          href={buildAppHref({
            q: qValue,
            tags: tagsValue,
            untagged: untaggedValue,
            public: publicValue,
            sort: sortValue,
            dir: dirValue,
          })}
          className="text-xs whitespace-nowrap text-neutral-400 hover:underline"
        >
          Clear handle
        </a>
      )}
    </div>
  );
}
