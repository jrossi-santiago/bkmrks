import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/x";

// Starts the OAuth 2.0 + PKCE flow. code_verifier/state live in short-lived
// cookies, separate from the session cookie, and are consumed and deleted
// by the callback.
export async function GET(request: NextRequest) {
  const codeVerifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = toBase64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier)))
  );
  const state = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const redirectUri = `${request.nextUrl.protocol}//${request.headers.get("host")}/api/auth/callback`;

  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizeUrl({ redirectUri, state, codeChallenge });
  } catch (err) {
    const url = new URL("/", request.url);
    url.searchParams.set(
      "login_error",
      err instanceof Error ? err.message : "Login isn't configured yet."
    );
    return NextResponse.redirect(url);
  }

  const cookieStore = await cookies();
  const pkceCookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  cookieStore.set("x_pkce_verifier", codeVerifier, pkceCookieOpts);
  cookieStore.set("x_pkce_state", state, pkceCookieOpts);

  return NextResponse.redirect(authorizeUrl);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
