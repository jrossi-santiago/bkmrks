import { cookies } from "next/headers";
import { section, dump } from "@/app/lib/dump";

// Phase 0 spike: uses the refresh token cached by /api/auth/callback to
// confirm the refresh flow works as documented, without waiting for the
// access token's expires_in (2h) to actually elapse.
export async function GET() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return dump("Missing X_CLIENT_ID / X_CLIENT_SECRET env vars.");
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("x_refresh_token")?.value;
  if (!refreshToken) {
    return dump("No cached refresh token — log in again at /login first (needs the offline.access scope).");
  }

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const json = await res.json();

  if (res.ok) {
    const cookieOpts = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: typeof json.expires_in === "number" ? json.expires_in : 3600,
    };
    cookieStore.set("x_access_token", json.access_token, cookieOpts);
    if (json.refresh_token) cookieStore.set("x_refresh_token", json.refresh_token, cookieOpts);
  }

  return dump(section("POST /2/oauth2/token (grant_type=refresh_token)", res, json));
}
