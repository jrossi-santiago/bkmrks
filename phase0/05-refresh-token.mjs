// Step 5 (optional, do this after the access token's expires_in has
// elapsed): confirm the refresh token flow actually works as documented.
import { requireEnv, loadState, saveState, writeOutput, headersToObject } from "./lib.mjs";

const state = loadState();
if (!state.refreshToken) {
  console.error("No refresh_token in phase0/.state.json — did the token exchange grant offline.access?");
  process.exit(1);
}

const clientId = requireEnv("X_CLIENT_ID");
const clientSecret = process.env.X_CLIENT_SECRET;

const body = new URLSearchParams({
  grant_type: "refresh_token",
  refresh_token: state.refreshToken,
});

const headers = { "Content-Type": "application/x-www-form-urlencoded" };
if (clientSecret) {
  headers.Authorization = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
} else {
  body.set("client_id", clientId);
}

const secondsSinceIssue = state.obtainedAt ? Math.round((Date.now() - state.obtainedAt) / 1000) : null;

const res = await fetch("https://api.x.com/2/oauth2/token", { method: "POST", headers, body });
const responseHeaders = headersToObject(res.headers);
const json = await res.json();

writeOutput("05-token-refresh.json", {
  status: res.status,
  secondsSinceOriginalIssue: secondsSinceIssue,
  headers: responseHeaders,
  body: json,
});

if (!res.ok) {
  console.error(`Token refresh failed: HTTP ${res.status}`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

saveState({
  accessToken: json.access_token,
  refreshToken: json.refresh_token ?? state.refreshToken,
  expiresIn: json.expires_in,
  obtainedAt: Date.now(),
});

console.log("Refresh OK.");
console.log("seconds since original token was issued:", secondsSinceIssue);
console.log("new expires_in:", json.expires_in);
console.log("new refresh_token issued:", Boolean(json.refresh_token));
console.log("\nFull response saved to phase0-output/05-token-refresh.json");
