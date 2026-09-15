# Deploying to Vercel

## 1. Connect the repo to Vercel

In the Vercel dashboard: **Add New → Project → Import** this GitHub repo
(`jrossi-santiago/bkmrks`), branch `main`. Accept the Next.js framework
defaults and deploy — it'll succeed even without the env vars below set yet
(the app just redirects to a login error until they're set).

This gives you an HTTPS URL immediately, e.g. `bkmrks-xyz123.vercel.app` —
no DNS setup required to get started. Add the `bkmrks.xyz` custom domain
whenever you want; the callback route works the same on either domain
since it derives the redirect URI from whichever host the request came in
on.

## 2. Register the X API app

At developer.x.com:

1. Create a project + app (or reuse one).
2. User authentication settings → enable **OAuth 2.0**, type **Confidential
   client**, scopes `bookmark.read tweet.read users.read offline.access`.
3. **Callback URI / Redirect URL**: add
   `https://<your-vercel-domain>/api/auth/callback` — the exact host Vercel
   gave you in step 1 (and later, also `https://bkmrks.xyz/api/auth/callback`
   once that domain is attached).
4. Keys and tokens tab → copy the **OAuth 2.0 Client ID** and **Client
   Secret**.

## 3. Set env vars in Vercel

Project → Settings → Environment Variables:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `SESSION_SECRET` — any long random string (`openssl rand -base64 32`).
  Encrypts the session cookie holding the signed-in user's tokens.

Then **redeploy** — env var changes need a redeploy to take effect, they
don't apply to an already-running deployment.

## 4. Try it

Visit `https://<your-domain>/` and click **Sign in with X**. After
approving, you land on `/app` — your real bookmarks, live from the X API,
rendered as cards (avatar, handle, text, media, link back to the original
tweet). **Sign out** clears the session cookie.

`/health` is a standing diagnostic route (env var presence, the exact
callback URL this deployment sends, outbound reachability to api.x.com) —
useful any time login breaks.

## Notes

- No database yet (Phase 2) — the dashboard calls the bookmarks endpoint
  live on every load, capped at one page (25 most recent). The signed-in
  user's tokens live only in one encrypted, httpOnly cookie.
- `phase0/`'s local scripts are throwaway spike tooling from before this
  app existed. Everywhere in the live app, `src/lib/x.ts` is the one vendor
  module that talks to X — nothing else calls `api.x.com` directly.
