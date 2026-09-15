import { eq, and, sql, inArray } from "drizzle-orm";
import { getDb } from "./db/client";
import { tags, bookmarkTags, bookmarks } from "./db/schema";

export async function getUserTagsWithCounts(userId: string) {
  const db = getDb();
  return db
    .select({
      id: tags.id,
      name: tags.name,
      isPublic: tags.isPublic,
      count: sql<number>`count(${bookmarkTags.bookmarkId})::int`,
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(bookmarkTags.tagId, tags.id))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id)
    .orderBy(tags.name);
}

// Tag names are freeform but unique per user, case-insensitive (see
// schema.ts's functional unique index) — find the existing one regardless
// of casing before creating a new one.
async function findOrCreateTag(userId: string, name: string): Promise<string> {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name can't be empty.");

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), sql`lower(${tags.name}) = lower(${trimmed})`))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(tags)
    .values({ id: crypto.randomUUID(), userId, name: trimmed })
    .returning({ id: tags.id });
  return created.id;
}

async function assertOwnsBookmark(userId: string, bookmarkId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Bookmark not found.");
}

export async function addTagToBookmark(userId: string, bookmarkId: string, tagName: string) {
  await assertOwnsBookmark(userId, bookmarkId);
  const tagId = await findOrCreateTag(userId, tagName);
  const db = getDb();
  await db.insert(bookmarkTags).values({ bookmarkId, tagId }).onConflictDoNothing();
}

export async function removeTagFromBookmark(userId: string, bookmarkId: string, tagId: string) {
  await assertOwnsBookmark(userId, bookmarkId);
  const db = getDb();
  await db
    .delete(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)));
}

// Phase 5: the entire "sharing" mechanism — flipping this makes the tag
// (and every bookmark carrying it) reachable, unauthenticated, at
// /u/:handle/:tag (see src/lib/public.ts). Ownership check is in the WHERE
// clause itself, not a separate lookup, so there's no window to toggle
// someone else's tag by guessing its id.
export async function setTagPublic(userId: string, tagId: string, isPublic: boolean) {
  const db = getDb();
  const [row] = await db
    .update(tags)
    .set({ isPublic })
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning({ id: tags.id });
  if (!row) throw new Error("Tag not found.");
}

// Tags per bookmark, for a set of bookmark ids already known to belong to
// this user (caller's responsibility — this doesn't re-check ownership).
export async function getTagsForBookmarks(bookmarkIds: string[]) {
  if (bookmarkIds.length === 0) return new Map<string, { id: string; name: string }[]>();
  const db = getDb();
  const rows = await db
    .select({ bookmarkId: bookmarkTags.bookmarkId, id: tags.id, name: tags.name })
    .from(bookmarkTags)
    .innerJoin(tags, eq(tags.id, bookmarkTags.tagId))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  const map = new Map<string, { id: string; name: string }[]>();
  for (const row of rows) {
    const list = map.get(row.bookmarkId) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.bookmarkId, list);
  }
  return map;
}
