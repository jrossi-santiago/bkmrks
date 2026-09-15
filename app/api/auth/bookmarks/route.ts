import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { section, dump, dumpWithLinks } from "@/app/lib/dump";
import { bookmarksApiUrl } from "@/app/lib/bookmarks";

// Phase 0 spike: pages through bookmarks using the access token cached by
// /api/auth/callback, so checking page 2+ doesn't require a full re-login.
// Used to confirm pagination order (newest-bookmarked-first or not).
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("x_access_token")?.value;
  const userId = cookieStore.get("x_user_id")?.value;

  if (!accessToken || !userId) {
    return dump("No cached access token — it expired or you haven't logged in yet. Start over at /login.");
  }

  const paginationToken = request.nextUrl.searchParams.get("pagination_token") ?? undefined;
  const bookmarksUrl = bookmarksApiUrl(userId, paginationToken);
  const res = await fetch(bookmarksUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();

  const nextToken = json.meta?.next_token;
  const links = nextToken
    ? [
        {
          href: `/api/auth/bookmarks?pagination_token=${encodeURIComponent(nextToken)}`,
          label: "fetch next page →",
        },
      ]
    : [];

  return dumpWithLinks(section("GET /2/users/:id/bookmarks", res, json), links);
}
