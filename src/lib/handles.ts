import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { bookmarks } from "./db/schema";

// Distinct authors among this user's live bookmarks, most-saved-from first —
// powers the handle filter's datalist (src/components/HandleFilterBar.tsx)
// so filtering to one profile's posts doesn't require typing its handle
// exactly. Grouped by lower(handle) since the same author's casing could in
// principle vary across bookmarks; min() picks a stable representative.
export async function getUserHandlesWithCounts(userId: string) {
  const db = getDb();
  return db
    .select({
      handle: sql<string>`min(${bookmarks.authorHandle})`,
      count: sql<number>`count(*)::int`,
    })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt)))
    .groupBy(sql`lower(${bookmarks.authorHandle})`)
    .orderBy(sql`count(*) desc`);
}
