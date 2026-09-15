import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { users, tags, bookmarks, bookmarkTags } from "./db/schema";

// Every query here is reachable from an unauthenticated public route
// (/u/:handle, /u/:handle/:tag — see src/app/u/) and is the ONLY place
// those routes are allowed to read from. This is the brief's explicit
// non-negotiable: no route that renders a public page should be able to
// query a private tag's name, a private bookmark, or a count derived from
// private data. Each *_Query function below builds (but doesn't execute)
// a query that independently re-asserts is_public = true, so a private
// tag can never be reached even if a caller passes a stale/guessed tag id.
//
// The *_Query functions are exported and unawaited on purpose: public.test.ts
// asserts against their generated SQL (drizzle's .toSQL(), no DB connection
// needed) that the is_public filter is actually present in the query sent
// to Postgres — not just present somewhere in this file's source text.

type Db = ReturnType<typeof getDb>;

export function publicUserExistsQuery(db: Db, handle: string) {
  return db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.xHandle}) = lower(${handle})`)
    .limit(1);
}

export async function publicUserExists(handle: string): Promise<boolean> {
  const [row] = await publicUserExistsQuery(getDb(), handle);
  return Boolean(row);
}

export function publicTagsForHandleQuery(db: Db, handle: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .innerJoin(users, eq(users.id, tags.userId))
    .where(and(sql`lower(${users.xHandle}) = lower(${handle})`, eq(tags.isPublic, true)))
    .orderBy(tags.name);
}

export async function getPublicTagsForHandle(handle: string) {
  return publicTagsForHandleQuery(getDb(), handle);
}

export function publicTagByNameQuery(db: Db, handle: string, tagName: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .innerJoin(users, eq(users.id, tags.userId))
    .where(
      and(
        sql`lower(${users.xHandle}) = lower(${handle})`,
        sql`lower(${tags.name}) = lower(${tagName})`,
        eq(tags.isPublic, true)
      )
    )
    .limit(1);
}

export async function getPublicTagByName(handle: string, tagName: string) {
  const [row] = await publicTagByNameQuery(getDb(), handle, tagName);
  return row ?? null;
}

export function publicBookmarksForTagQuery(db: Db, tagId: string) {
  return db
    .select({
      id: bookmarks.id,
      tweetId: bookmarks.tweetId,
      authorHandle: bookmarks.authorHandle,
      authorDisplayName: bookmarks.authorDisplayName,
      authorAvatarUrl: bookmarks.authorAvatarUrl,
      text: bookmarks.text,
      media: bookmarks.media,
      tweetCreatedAt: bookmarks.tweetCreatedAt,
    })
    .from(bookmarks)
    .innerJoin(bookmarkTags, eq(bookmarkTags.bookmarkId, bookmarks.id))
    .innerJoin(tags, eq(tags.id, bookmarkTags.tagId))
    .where(and(eq(tags.id, tagId), eq(tags.isPublic, true), isNull(bookmarks.deletedAt)))
    .orderBy(desc(bookmarks.sourceOrder));
}

export async function getPublicBookmarksForTag(tagId: string) {
  return publicBookmarksForTagQuery(getDb(), tagId);
}
