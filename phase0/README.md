# Phase 0 runbook — X API vendor spike

Goal: answer every question in `PROJECT_BRIEF.md`'s Phase 0 section with a
real API call against your own account, before any product code gets
written. Nothing here touches a database or renders anything — it's five
small scripts you run in order from a terminal.

## 0. One-time setup

```
npm install
cp .env.example .env
```

### Register the X API app

1. Go to https://developer.x.com and create a project + app (or reuse one).
2. **Note what tier/plan you're on and what it costs** — this is one of the
   Phase 0 answers. `bookmark.read` may not be available on the Free tier;
   if the app enrollment or the first bookmarks call gets rejected for
   access-level reasons, that rejection *is* the answer, record it.
3. In the app's **User authentication settings**, enable **OAuth 2.0**, set
   type to **Confidential client** (server-side app), and add this callback
   URL exactly: `http://127.0.0.1:3000/callback`
4. Under **Keys and tokens**, copy the **OAuth 2.0 Client ID** and **Client
   Secret** into `.env` as `X_CLIENT_ID` / `X_CLIENT_SECRET`.

## 1. Get an authorization URL

```
npm run phase0:auth-url
```

Open the printed URL in a browser, log in as the account whose bookmarks
you want to read, and approve the `bookmark.read tweet.read users.read
offline.access` scopes. X redirects you to
`http://127.0.0.1:3000/callback?code=...&state=...` — nothing is listening
on that port so the page itself will fail to load, that's expected. The
`code` you need is right there in the address bar.

## 2. Exchange the code for tokens

```
npm run phase0:exchange -- <code>
```

Records, in the terminal and in `phase0-output/02-token-exchange.json`:
access token lifetime (`expires_in`), whether a refresh token was issued,
and the granted scopes.

## 3. Resolve your user id

```
npm run phase0:me
```

Needed because the bookmarks endpoint is `/2/users/:id/bookmarks`.

## 4. Fetch bookmarks — the main spike call

```
npm run phase0:bookmarks
```

This answers most of the Phase 0 checklist in one response, saved to
`phase0-output/04-bookmarks-page1.json`:

- **Per-bookmark timestamp vs. order-only**: does each tweet have a real
  `created_at` (which is the tweet's *post* time, not necessarily when you
  bookmarked it), or is `source_order` genuinely all we get for "most
  recently bookmarked"?
- **Media shape**: check the sample media object the script prints —
  what fields exist, and does the `url`/`variants` look like a stable CDN
  link or a short-lived signed URL.
- **Rate limits**: the script prints every `x-rate-limit-*` response
  header. Check whether the limit looks per-app or per-user (compare
  against the app-level limits shown on the developer portal for this
  endpoint).

If there's a `next_token`, the script prints a ready-to-run command for the
next page:

```
npm run phase0:bookmarks -- <next_token>
```

Compare `phase0-output/04-bookmarks-page1.json` and `...page2.json`: if
page 1's bookmarks are newer than page 2's, pagination is
newest-bookmarked-first and the watermark strategy (stop syncing at the
first already-seen `tweet_id`) works for incremental sync.

## 5. Refresh token flow (optional, do this later)

Come back to this after the access token's `expires_in` has actually
elapsed (or force it by editing `phase0/.state.json`):

```
npm run phase0:refresh
```

Confirms the refresh flow works as documented and whether X rotates the
refresh token on use.

## 6. Write up the answers

Once you've run the above, fill in the "Phase 0 answers" block in
`../PROJECT_BRIEF.md` with the real numbers/behavior observed, replacing the
PENDING placeholder. Then Phase 1 can start.

## Notes

- `phase0/.state.json` and `phase0-output/*.json` are gitignored — they
  contain live OAuth tokens and raw API responses. Don't commit them.
- These scripts are throwaway spike tooling, not the product's `src/lib/x.ts`
  vendor module — Phase 1 starts that from scratch with what's learned here.
