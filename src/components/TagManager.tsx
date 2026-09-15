import { toggleTagPublicAction } from "@/app/app/actions";
import { CopyShareLinkButton } from "./CopyShareLinkButton";

type Tag = { id: string; name: string; isPublic: boolean; count: number };

// Phase 5: flips a tag's is_public flag — the entire sharing mechanism. A
// public tag becomes visible, unauthenticated, at /u/:handle/:tag (see
// src/app/u/ and src/lib/public.ts for what "public" actually exposes).
export function TagManager({ allTags, handle }: { allTags: Tag[]; handle: string }) {
  if (allTags.length === 0) return null;

  return (
    <details className="mb-6 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <summary className="cursor-pointer select-none text-neutral-500">Manage tags</summary>
      <ul className="mt-3 space-y-2">
        {allTags.map((tag) => (
          <li key={tag.id} className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{tag.name}</span>
            <span className="text-xs text-neutral-400">({tag.count})</span>
            <form action={toggleTagPublicAction}>
              <input type="hidden" name="tagId" value={tag.id} />
              <input type="hidden" name="isPublic" value={tag.isPublic ? "0" : "1"} />
              <button
                type="submit"
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {tag.isPublic ? "Make private" : "Make public"}
              </button>
            </form>
            {tag.isPublic && (
              <>
                <span className="text-xs text-neutral-400">
                  /u/{handle}/{tag.name}
                </span>
                <CopyShareLinkButton path={`/u/${handle}/${encodeURIComponent(tag.name)}`} />
              </>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
