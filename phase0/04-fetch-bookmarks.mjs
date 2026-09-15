// Step 4: the actual spike call. GET /2/users/:id/bookmarks with enough
// fields/expansions to answer every Phase 0 question in one shot: per-tweet
// timestamps vs. order-only, media shape + expiry, pagination direction,
// and real rate-limit headers.
//
// Usage:
//   npm run phase0:bookmarks                 # first page
//   npm run phase0:bookmarks -- <pagination_token>   # next page, to check ordering
import { loadState, writeOutput, headersToObject, rateLimitHeaders } from "./lib.mjs";

const state = loadState();
if (!state.accessToken) {
  console.error("No access_token in phase0/.state.json — run the earlier steps first.");
  process.exit(1);
}
if (!state.userId) {
  console.error("No userId in phase0/.state.json — run `npm run phase0:me` first.");
  process.exit(1);
}

const paginationToken = process.argv[2];

const url = new URL(`https://api.x.com/2/users/${state.userId}/bookmarks`);
url.searchParams.set("max_results", "10");
url.searchParams.set(
  "tweet.fields",
  "created_at,author_id,attachments,public_metrics,entities,text"
);
url.searchParams.set("expansions", "author_id,attachments.media_keys");
url.searchParams.set("user.fields", "username,name,profile_image_url");
url.searchParams.set(
  "media.fields",
  "media_key,type,url,preview_image_url,duration_ms,height,width,variants"
);
if (paginationToken) url.searchParams.set("pagination_token", paginationToken);

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${state.accessToken}` },
});
const responseHeaders = headersToObject(res.headers);
const json = await res.json();

const outFile = paginationToken ? "04-bookmarks-page2.json" : "04-bookmarks-page1.json";
const savedPath = writeOutput(outFile, { status: res.status, headers: responseHeaders, body: json });

if (!res.ok) {
  console.error(`GET /2/users/:id/bookmarks failed: HTTP ${res.status}`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

const tweets = json.data ?? [];
console.log(`Fetched ${tweets.length} bookmark(s).`);
console.log("rate limit headers:", rateLimitHeaders(res.headers));
console.log("next_token present:", Boolean(json.meta?.next_token));
console.log("meta:", json.meta);
if (tweets[0]) {
  console.log("\nFirst tweet id:", tweets[0].id);
  console.log("First tweet created_at present:", "created_at" in tweets[0]);
  console.log("First tweet created_at value:", tweets[0].created_at);
}
const media = json.includes?.media ?? [];
if (media[0]) {
  console.log("\nSample media object:", JSON.stringify(media[0], null, 2));
}
console.log(`\nFull response saved to ${savedPath}`);
if (json.meta?.next_token) {
  console.log("\nTo check pagination direction, run:");
  console.log(`  npm run phase0:bookmarks -- ${json.meta.next_token}`);
  console.log("...then compare page1 vs page2 tweet ids/order in phase0-output/.");
}
