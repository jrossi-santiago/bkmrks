import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { READING_MODE_COOKIE } from "@/lib/session";

// Mirrors the sign-out/refresh routes: a plain form POST, no client JS,
// redirect back to /app. The form in AppPage's header computes the desired
// next state and sends it as a hidden field (same pattern TagManager uses
// for toggleTagPublicAction).
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const next = formData.get("next") === "1";
  const cookieStore = await cookies();
  if (next) {
    cookieStore.set(READING_MODE_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  } else {
    cookieStore.delete(READING_MODE_COOKIE);
  }
  return NextResponse.redirect(new URL("/app", request.url));
}
