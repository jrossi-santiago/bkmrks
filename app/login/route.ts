import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Phase 0 spike: kicks off the OAuth 2.0 + PKCE flow against the real X API.
// This same route is where Phase 1's "Sign in with X" button will point.
export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return new NextResponse(
      "Missing X_CLIENT_ID env var. Set it in the Vercel project's Environment Variables and redeploy.",
      { status: 500 }
    );
  }

  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${request.nextUrl.protocol}//${request.headers.get("host")}/api/auth/callback`;

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  cookieStore.set("x_code_verifier", codeVerifier, cookieOpts);
  cookieStore.set("x_oauth_state", state, cookieOpts);

  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "bookmark.read tweet.read users.read offline.access");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authorizeUrl);
}
