import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { exchangeCode, getMe } from "@/lib/x";
import { encryptSession, SESSION_COOKIE, sessionCookieOptions, type Session } from "@/lib/session";
import { upsertUserFromLogin } from "@/lib/db/users";
import { runSync } from "@/lib/sync";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cookieStore = await cookies();

  const fail = (message: string) => {
    const url = new URL("/", request.url);
    url.searchParams.set("login_error", message);
    return NextResponse.redirect(url);
  };

  if (params.get("error")) {
    return fail(params.get("error_description") ?? params.get("error")!);
  }

  const code = params.get("code");
  const codeVerifier = cookieStore.get("x_pkce_verifier")?.value;
  const expectedState = cookieStore.get("x_pkce_state")?.value;
  cookieStore.delete("x_pkce_verifier");
  cookieStore.delete("x_pkce_state");

  if (!code || !codeVerifier) {
    return fail("Missing authorization code — the login link may have expired. Try again.");
  }
  if (params.get("state") !== expectedState) {
    return fail("Login session mismatch — try again.");
  }

  const redirectUri = `${request.nextUrl.protocol}//${request.headers.get("host")}/api/auth/callback`;

  try {
    const token = await exchangeCode({ code, redirectUri, codeVerifier });
    if (!token.refresh_token) {
      return fail("X didn't grant offline access — try logging in again.");
    }
    const xUser = await getMe(token.access_token);

    const userId = await upsertUserFromLogin({
      xUserId: xUser.id,
      xHandle: xUser.username,
      xDisplayName: xUser.name,
      xAvatarUrl: xUser.profile_image_url ?? "",
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    });

    const session: Session = {
      userId,
      username: xUser.username,
      name: xUser.name,
      avatarUrl: xUser.profile_image_url ?? "",
    };
    cookieStore.set(SESSION_COOKIE, await encryptSession(session), sessionCookieOptions);

    // Phase 6 paid gate: a non-member is authenticated (we know who they
    // are) but not entitled to a synced dashboard — skip the backfill
    // entirely rather than spending X API calls on an account that can't
    // see the results yet. It runs the first time they land on /app with
    // an active membership instead (see src/app/app/page.tsx — that path
    // still has no persisted bookmarks yet, same "No bookmarks synced
    // yet... try Refresh" case Phase 2 already handles).
    const db = getDb();
    const [dbUser] = await db
      .select({ membershipActive: users.membershipActive })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser?.membershipActive) {
      return NextResponse.redirect(new URL("/subscribe", request.url));
    }

    // Full backfill on first login, incremental sync (watermark) on every
    // login after that — same function either way. Runs after the redirect
    // is sent so login isn't blocked on however many bookmarks there are.
    after(() => runSync(userId).catch((err) => console.error("sync failed", err)));

    return NextResponse.redirect(new URL("/app", request.url));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Login failed.");
  }
}
