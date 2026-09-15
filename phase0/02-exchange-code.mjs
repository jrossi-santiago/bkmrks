// Step 2: exchange the authorization code from step 1 for an access token
// (and refresh token, since we requested offline.access).
import { requireEnv, loadState, saveState, writeOutput, headersToObject } from "./lib.mjs";

const code = process.argv[2];
if (!code) {
  console.error("Usage: npm run phase0:exchange -- <code>");
  process.exit(1);
}

const clientId = requireEnv("X_CLIENT_ID");
const clientSecret = process.env.X_CLIENT_SECRET; // present for confidential clients
const redirectUri = requireEnv("X_REDIRECT_URI");
const state = loadState();

if (!state.codeVerifier) {
  console.error("No code_verifier found in phase0/.state.json — run `npm run phase0:auth-url` first.");
  process.exit(1);
}

const body = new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: redirectUri,
  code_verifier: state.codeVerifier,
});

const headers = { "Content-Type": "application/x-www-form-urlencoded" };
if (clientSecret) {
  headers.Authorization = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
} else {
  body.set("client_id", clientId); // public-client PKCE, no secret
}

const res = await fetch("https://api.x.com/2/oauth2/token", { method: "POST", headers, body });
const responseHeaders = headersToObject(res.headers);
const json = await res.json();

writeOutput("02-token-exchange.json", { status: res.status, headers: responseHeaders, body: json });

if (!res.ok) {
  console.error(`Token exchange failed: HTTP ${res.status}`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

const obtainedAt = Date.now();
saveState({
  accessToken: json.access_token,
  refreshToken: json.refresh_token ?? null,
  tokenType: json.token_type,
  scope: json.scope,
  expiresIn: json.expires_in,
  obtainedAt,
});

console.log("Token exchange OK.");
console.log("token_type:", json.token_type);
console.log("scope granted:", json.scope);
console.log("expires_in (seconds):", json.expires_in);
console.log("refresh_token present:", Boolean(json.refresh_token));
console.log("\nFull response saved to phase0-output/02-token-exchange.json");
console.log("Next: npm run phase0:me");
