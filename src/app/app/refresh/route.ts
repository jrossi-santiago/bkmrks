import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getMembershipActive } from "@/lib/db/users";
import { runSync } from "@/lib/sync";

// Manual "Refresh" button — runs synchronously (unlike the login-triggered
// background sync) since it's a short incremental sync in the common case:
// the watermark stops as soon as it hits the newest already-known bookmark.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  // Phase 6 paid gate — the /app page won't render this form for a lapsed
  // membership, but this costs real X API calls, so it's checked directly
  // rather than trusting the page didn't render the button.
  const membershipActive = await getMembershipActive(session.userId);
  if (!membershipActive) return NextResponse.redirect(new URL("/subscribe", request.url));

  await runSync(session.userId).catch((err) => console.error("manual refresh failed", err));

  return NextResponse.redirect(new URL("/app", request.url));
}
