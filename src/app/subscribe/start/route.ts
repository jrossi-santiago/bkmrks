import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { createCheckoutConfiguration } from "@/lib/whop";

// Mirrors /login's shape: a plain GET link the "Subscribe" button points
// at, which does the external-API work server-side and redirects the
// browser on. Needs a signed-in session (not an active membership — that's
// the whole point) so it knows which of our users to attach to the
// checkout via metadata.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const fail = (message: string) => {
    const url = new URL("/subscribe", request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  };

  try {
    const { purchaseUrl } = await createCheckoutConfiguration({
      userId: session.userId,
      redirectUrl: `${request.nextUrl.protocol}//${request.headers.get("host")}/app?checkout=return`,
    });
    return NextResponse.redirect(purchaseUrl);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Couldn't start checkout.");
  }
}
