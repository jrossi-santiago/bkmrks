import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/x";
import { decryptSession, encryptSession, SESSION_COOKIE, sessionCookieOptions, type Session } from "@/lib/session";

// Keeps the session's access token fresh before /app ever renders — Server
// Components can only read cookies, not write them, so refreshing has to
// happen here rather than in the page itself.
export async function proxy(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return NextResponse.redirect(new URL("/login", request.url));

  const session = await decryptSession(cookieValue);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const needsRefresh = Date.now() >= session.expiresAt - 60_000;
  if (!needsRefresh) return NextResponse.next();

  try {
    const refreshed = await refreshAccessToken(session.refreshToken);
    const next: Session = {
      ...session,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
    const res = NextResponse.next();
    res.cookies.set(SESSION_COOKIE, await encryptSession(next), sessionCookieOptions);
    return res;
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/app/:path*"],
};
