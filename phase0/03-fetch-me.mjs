// Step 3: resolve the authenticated user's id (needed for the bookmarks
// endpoint, which is path-scoped to a user id).
import { loadState, saveState, writeOutput, headersToObject, rateLimitHeaders } from "./lib.mjs";

const state = loadState();
if (!state.accessToken) {
  console.error("No access_token in phase0/.state.json — run `npm run phase0:exchange -- <code>` first.");
  process.exit(1);
}

const res = await fetch("https://api.x.com/2/users/me", {
  headers: { Authorization: `Bearer ${state.accessToken}` },
});
const responseHeaders = headersToObject(res.headers);
const json = await res.json();

writeOutput("03-users-me.json", { status: res.status, headers: responseHeaders, body: json });

if (!res.ok) {
  console.error(`GET /2/users/me failed: HTTP ${res.status}`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

saveState({ userId: json.data.id, username: json.data.username });

console.log("user id:", json.data.id);
console.log("username:", json.data.username);
console.log("rate limit headers:", rateLimitHeaders(res.headers));
console.log("\nFull response saved to phase0-output/03-users-me.json");
console.log("Next: npm run phase0:bookmarks");
