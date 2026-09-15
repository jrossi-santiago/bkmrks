import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Phase 0 spike: completes the OAuth exchange, resolves the user id, fetches
// one page of bookmarks, and dumps everything needed to answer the Phase 0
// checklist (rate limits, timestamp presence, media shape, pagination meta)
// straight to the browser. No database, no persistence — throwaway by design.
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

  const bookmarksUrl = new URL(`https://api.x.com/2/users/${userId}/bookmarks`);
  bookmarksUrl.searchParams.set("max_results", "10");
  bookmarksUrl.searchParams.set(
    "tweet.fields",
    "created_at,author_id,attachments,public_metrics,entities,text"
  );
  bookmarksUrl.searchParams.set("expansions", "author_id,attachments.media_keys");
  bookmarksUrl.searchParams.set("user.fields", "username,name,profile_image_url");
  bookmarksUrl.searchParams.set(
    "media.fields",
    "media_key,type,url,preview_image_url,duration_ms,height,width,variants"
  );

  const bookmarksRes = await fetch(bookmarksUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const bookmarksJson = await bookmarksRes.json();
  sections.push(section("GET /2/users/:id/bookmarks", bookmarksRes, bookmarksJson));

  cookieStore.delete("x_code_verifier");
  cookieStore.delete("x_oauth_state");

  return dump(sections.join("\n\n"));
}

function section(label: string, res: Response, body: unknown): string {
  const rateLimit: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    if (key.toLowerCase().includes("rate-limit")) rateLimit[key] = value;
  });
  return [
    `=== ${label} — HTTP ${res.status} ===`,
    Object.keys(rateLimit).length ? `rate limit headers: ${JSON.stringify(rateLimit, null, 2)}` : null,
    JSON.stringify(body, null, 2),
  ]
    .filter(Boolean)
    .join("\n");
}

function dump(text: string) {
  const escaped = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Phase 0 dump</title><pre style="white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,Menlo,monospace;padding:24px;max-width:960px;margin:0 auto;">${escaped}</pre>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
