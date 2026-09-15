import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";

// Auth gate for /app/*. As of Phase 2 the session cookie holds no tokens
// (those live encrypted in the database), so there's nothing to refresh
// here anymore — just reject anyone without a valid session.
export async function proxy(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const session = cookieValue ? await decryptSession(cookieValue) : null;

  if (!session) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    if (cookieValue) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
