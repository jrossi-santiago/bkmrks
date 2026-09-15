import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { section, dump, dumpWithLinks } from "@/app/lib/dump";
import { bookmarksApiUrl } from "@/app/lib/bookmarks";

// Phase 0 spike: completes the OAuth exchange, resolves the user id, fetches
// one page of bookmarks, and dumps everything needed to answer the Phase 0
// checklist (rate limits, timestamp presence, media shape, pagination meta)
// straight to the browser. No database — the access token is cached in a
// short-lived httpOnly cookie only so /api/auth/bookmarks can page through
// results without a full re-login; it's discarded when the token expires.
export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return dump(
      "Missing X_CLIENT_ID / X_CLIENT_SECRET env vars. Set them in the Vercel project's Environment Variables and redeploy (env var changes need a redeploy to take effect)."
    );
  }

  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  if (error) {
    return dump(`X returned an error: ${error} — ${params.get("error_description") ?? ""}`);
  }

  const code = params.get("code");
  if (!code) {
    return dump("No `code` in callback query params.");
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("x_code_verifier")?.value;
  const expectedState = cookieStore.get("x_oauth_state")?.value;

  if (!codeVerifier) {
    return dump(
      "No code_verifier cookie found. Start over at /login — the cookie may have expired (10 min), or you're not in the same browser session."
    );
  }
  if (params.get("state") !== expectedState) {
    return dump("state mismatch — possible CSRF or stale session. Start over at /login.");
  }

  const redirectUri = `${request.nextUrl.protocol}//${request.headers.get("host")}/api/auth/callback`;
  const sections: string[] = [];

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  const tokenJson = await tokenRes.json();
  sections.push(section("POST /2/oauth2/token", tokenRes, tokenJson));
  if (!tokenRes.ok) return dump(sections.join("\n\n"));

  const accessToken: string = tokenJson.access_token;

  const meRes = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meJson = await meRes.json();
  sections.push(section("GET /2/users/me", meRes, meJson));
  if (!meRes.ok) return dump(sections.join("\n\n"));

  const userId: string = meJson.data.id;

  const bookmarksUrl = bookmarksApiUrl(userId);
  const bookmarksRes = await fetch(bookmarksUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const bookmarksJson = await bookmarksRes.json();
  sections.push(section("GET /2/users/:id/bookmarks", bookmarksRes, bookmarksJson));

  cookieStore.delete("x_code_verifier");
  cookieStore.delete("x_oauth_state");

  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: typeof tokenJson.expires_in === "number" ? tokenJson.expires_in : 3600,
  };
  cookieStore.set("x_access_token", accessToken, cookieOpts);
  cookieStore.set("x_user_id", userId, cookieOpts);
  if (tokenJson.refresh_token) {
    cookieStore.set("x_refresh_token", tokenJson.refresh_token, cookieOpts);
  }

  const nextToken = bookmarksJson.meta?.next_token;
  const links = [
    nextToken && {
      href: `/api/auth/bookmarks?pagination_token=${encodeURIComponent(nextToken)}`,
      label: "fetch next page →",
    },
    tokenJson.refresh_token && { href: "/api/auth/refresh", label: "test refresh token →" },
  ].filter((l): l is { href: string; label: string } => Boolean(l));

  return dumpWithLinks(sections.join("\n\n"), links);
}
