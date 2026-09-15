import { notFound } from "next/navigation";
import { getPublicTagsForHandle, publicUserExists } from "@/lib/public";

// Unauthenticated public profile: lists only this user's public tags, and
// nothing else — no counts, no hint that any private tag exists (per
// PROJECT_BRIEF.md's Phase 5 non-negotiable). getPublicTagsForHandle
// (src/lib/public.ts) is the only data this page ever reads.
export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const [exists, tags] = await Promise.all([publicUserExists(handle), getPublicTagsForHandle(handle)]);
  if (!exists) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold">@{handle}</h1>

      {tags.length === 0 ? (
        <p className="text-neutral-500">No public tags yet.</p>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <a href={`/u/${handle}/${encodeURIComponent(tag.name)}`} className="text-sm hover:underline">
                {tag.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
