# Phase 0 via Vercel — no terminal, no secrets pasted into chat

This is the live-infra alternative to `phase0/README.md`'s local scripts.
Two routes do the whole spike:

- `GET /login` — starts the OAuth 2.0 + PKCE flow, redirects to X.
- `GET /api/auth/callback` — exchanges the code, resolves your user id,
  fetches one page of bookmarks, and prints the raw responses (status,
  rate-limit headers, body) straight to the page in your browser.

Nothing is persisted — no database, no cookie that outlives the flow beyond
its 10-minute expiry. This is also literally where Phase 1's "Sign in with
X" button will point, so it isn't thrown away afterward.

## 1. Connect the repo to Vercel

In the Vercel dashboard: **Add New → Project → Import** this GitHub repo
(`jrossi-santiago/bkmrks`), branch `claude/vigilant-edison-4gkjrp`. Accept
the Next.js framework defaults. Deploy — it'll succeed even without the X
env vars set yet (the routes just return a "missing env var" message until
you add them).

This gives you an HTTPS URL immediately, e.g. `bkmrks-xyz123.vercel.app`
(exact name depends on your Vercel project) — no DNS setup required to get
started. Add the `bkmrks.xyz` custom domain whenever you want; the callback
route works the same on either domain since it derives the redirect URI
from whichever host the request came in on.

## 2. Register the X API app

At developer.x.com:

1. Create a project + app (or reuse one).
2. **Note the tier/plan `bookmark.read` requires and its cost** — one of the
   Phase 0 answers.
3. User authentication settings → enable **OAuth 2.0**, type **Confidential
   client**, scopes `bookmark.read tweet.read users.read offline.access`.
4. **Callback URI / Redirect URL**: add
   `https://<your-vercel-domain>/api/auth/callback` — the exact host Vercel
   gave you in step 1 (and later, also `https://bkmrks.xyz/api/auth/callback`
   once that domain is attached, if the portal lets you list more than one —
   otherwise just swap this field to whichever domain you're testing).
5. Keys and tokens tab → copy the **OAuth 2.0 Client ID** and **Client
   Secret**.

## 3. Set env vars in Vercel (never touches this chat)

Project → Settings → Environment Variables:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`

Then **redeploy** — env var changes need a redeploy to take effect, they
don't apply to an already-running deployment.

## 4. Run the spike

Visit `https://<your-domain>/login` in your browser, log in as the account
you want to spike against, approve the scopes. You'll land back on
`/api/auth/callback`, which renders the raw API responses.

Read off (or copy/paste the whole page back to me):

- Token exchange response: `expires_in`, whether `refresh_token` is present,
  granted `scope`.
- `/2/users/me`: confirms auth works.
- `/2/users/:id/bookmarks`: the `rate limit headers` line (per-app or
  per-user?), whether each tweet has `created_at`, the shape of any object
  under `includes.media` (does its `url` look like a stable CDN link or a
  signed/expiring one), and `meta` (is there a `next_token`?).

If there's a `next_token`, I don't have a "next page" button wired up yet —
tell me and I'll add a quick `?pagination_token=` passthrough to check
whether page 2 is older or newer than page 1 (confirms the watermark
strategy for incremental sync).

## 5. Refresh token flow

Not wired up in this spike page. Once the rest of Phase 0 is answered, tell
me and I'll add a `/api/auth/refresh` debug route the same way, to test
after the access token's `expires_in` has elapsed.

## Then

I'll fold whatever the dump shows into `PROJECT_BRIEF.md`'s "Phase 0
answers" section, and we move to Phase 1.
