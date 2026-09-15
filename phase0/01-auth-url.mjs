// Step 1: build the authorize URL. Open it in a browser, log in as the
// account you want to spike against, and approve. X will redirect you to
// X_REDIRECT_URI with ?code=...&state=... in the URL — the page itself will
// likely fail to load (nothing is listening on that port), that's fine, the
// code you need is in the address bar.
import { randomBytes, createHash } from "node:crypto";
import { requireEnv, saveState } from "./lib.mjs";

const clientId = requireEnv("X_CLIENT_ID");
const redirectUri = requireEnv("X_REDIRECT_URI");

const codeVerifier = randomBytes(32).toString("base64url");
const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
const state = randomBytes(16).toString("hex");

saveState({ codeVerifier, state, redirectUri });

const scopes = ["bookmark.read", "tweet.read", "users.read", "offline.access"];

const url = new URL("https://x.com/i/oauth2/authorize");
url.searchParams.set("response_type", "code");
url.searchParams.set("client_id", clientId);
url.searchParams.set("redirect_uri", redirectUri);
url.searchParams.set("scope", scopes.join(" "));
url.searchParams.set("state", state);
url.searchParams.set("code_challenge", codeChallenge);
url.searchParams.set("code_challenge_method", "S256");

console.log("Open this URL in a browser, log in, and approve:\n");
console.log(url.toString());
console.log("\nAfter approving, you'll be redirected to a URL starting with");
console.log(`${redirectUri}?code=...&state=...`);
console.log("\nCopy the `code` value and run:");
console.log("  npm run phase0:exchange -- <code>");
