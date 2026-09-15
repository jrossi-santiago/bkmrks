// The one vendor module for the official X API (api.x.com / x.com). Every
// call to X anywhere in this app goes through here. Read-only: bookmarks,
// the authenticated user's own profile, and the OAuth token endpoints.
// Nothing here ever writes, posts, likes, follows, or DMs.

const SCOPES = "bookmark.read tweet.read users.read offline.access";

export type XUser = {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
};

export type XMedia = {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
  duration_ms?: number;
  variants?: { bit_rate?: number; content_type: string; url: string }[];
};

export type XTweet = {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  attachments?: { media_keys?: string[] };
  public_metrics?: Record<string, number>;
};

export type BookmarksPage = {
  data?: XTweet[];
  includes?: { users?: XUser[]; media?: XMedia[] };
  meta?: { result_count: number; next_token?: string; previous_token?: string };
};

export type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope: string;
};

function credentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing X_CLIENT_ID / X_CLIENT_SECRET env vars.");
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(params: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const { clientId } = credentials();
  const url = new URL("https://x.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`X token request failed: HTTP ${res.status} ${detail}`);
  }
  return res.json();
}

export function exchangeCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    })
  );
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken })
  );
}

export async function getMe(accessToken: string): Promise<XUser> {
  const res = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`GET /2/users/me failed: HTTP ${res.status}`);
  const json = await res.json();
  return json.data as XUser;
}

// Unauthenticated connectivity check for /health — confirms DNS/TLS/routing
// to api.x.com without needing valid credentials.
export async function pingApi(): Promise<string> {
  try {
    const res = await fetch("https://api.x.com/2/openapi.json", { signal: AbortSignal.timeout(5000) });
    return `HTTP ${res.status} (any response here means DNS/TLS/routing to api.x.com works)`;
  } catch (err) {
    return `fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export type TweetLookupResponse = {
  data?: XTweet[];
  includes?: { users?: XUser[]; media?: XMedia[] };
  errors?: { value?: string; detail?: string; title?: string; type?: string }[];
};

// Confirmed against X's docs (docs.x.com/x-api/fundamentals/rate-limits and
// the tweet-lookup reference): GET /2/tweets accepts at most 100 IDs per
// request. Rate limit is 5,000 req/15-min for user-context auth, well above
// anything Phase 4's revalidation job needs.
export const TWEET_LOOKUP_MAX_IDS = 100;

// GET /2/tweets — batch tweet lookup by ID, used by the Phase 4 revalidation
// job to confirm bookmarked tweets still exist and to refresh media/text/
// metrics. IDs missing from the response's `data` (deleted, suspended
// author, account gone protected, etc.) are the caller's signal to
// soft-delete — this function itself makes no read/write decisions.
export async function getTweetsByIds(
  accessToken: string,
  ids: string[]
): Promise<TweetLookupResponse> {
  if (ids.length === 0) return { data: [] };
  if (ids.length > TWEET_LOOKUP_MAX_IDS) {
    throw new Error(
      `getTweetsByIds: ${ids.length} ids exceeds X's limit of ${TWEET_LOOKUP_MAX_IDS} per request`
    );
  }

  const url = new URL("https://api.x.com/2/tweets");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("tweet.fields", "created_at,author_id,attachments,public_metrics");
  url.searchParams.set("expansions", "author_id,attachments.media_keys");
  url.searchParams.set("user.fields", "username,name,profile_image_url");
  url.searchParams.set(
    "media.fields",
    "media_key,type,url,preview_image_url,duration_ms,height,width,variants"
  );

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`GET /2/tweets failed: HTTP ${res.status}`);
  return res.json();
}

export async function getBookmarks(
  accessToken: string,
  userId: string,
  paginationToken?: string
): Promise<BookmarksPage> {
  const url = new URL(`https://api.x.com/2/users/${userId}/bookmarks`);
  url.searchParams.set("max_results", "25");
  url.searchParams.set("tweet.fields", "created_at,author_id,attachments,public_metrics");
  url.searchParams.set("expansions", "author_id,attachments.media_keys");
  url.searchParams.set("user.fields", "username,name,profile_image_url");
  url.searchParams.set(
    "media.fields",
    "media_key,type,url,preview_image_url,duration_ms,height,width,variants"
  );
  if (paginationToken) url.searchParams.set("pagination_token", paginationToken);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`GET /2/users/:id/bookmarks failed: HTTP ${res.status}`);
  return res.json();
}
