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

## 3. Get a Postgres database

Default per the brief: a Supabase project on the same account as replylane.
Create a new project there, then Project Settings → Database → copy the
**Transaction pooler** connection string (port `6543`, not Session pooler
or the direct `5432` connection — matches the `prepare: false` config
already in `src/lib/db/client.ts`, same lesson as replylane). Format:
`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`.

Two gotchas when copying it:
1. Supabase shows the URI with a `[YOUR-PASSWORD]` placeholder — swap in
   the real database password before pasting into Vercel.
2. If that password has special characters (`@`, `#`, `/`, etc.), it needs
   to be URL-encoded or `postgres.js` will fail to parse the string.

Neon is a fine alternative if you want billing/project separation — same
pooler caveat applies, the client config already handles it either way.

Also copy the **Session pooler** string (same page, "Session pooler" tab,
port `5432`) — the migration tool needs it (step 5 explains why); the app
itself never uses it. Don't use the "Direct connection" tab instead — it
resolves IPv6-only, which Vercel's build environment can't reach, and
fails near-instantly.

## 4. Set env vars in Vercel

Project → Settings → Environment Variables. Status:

- [x] `X_CLIENT_ID` — set
- [x] `X_CLIENT_SECRET` — set
- [x] `SESSION_SECRET` — set (any long random string, e.g.
      `openssl rand -base64 32`; encrypts the session cookie AND the X
      tokens stored at rest in the database — never commit the actual
      value anywhere)
- [ ] `DATABASE_URL` — the transaction pooler string (port 6543) from step 3
- [ ] `DIRECT_URL` — the session pooler string (port 5432) from step 3 —
      NOT the "Direct connection" tab (IPv6-only, unreachable from Vercel)

Then **redeploy** — env var changes need a redeploy to take effect, they
don't apply to an already-running deployment.

## 5. Migrations run automatically on deploy

No terminal needed — the `vercel-build` script (`drizzle-kit migrate &&
next build`) runs pending migrations before every build, so as long as
`DATABASE_URL` and `DIRECT_URL` are set, pushing to `main` (or clicking
Redeploy) is enough. Safe to run repeatedly: already-applied migrations are
skipped.

Migrations specifically use `DIRECT_URL`, not the pooled `DATABASE_URL` the
app uses at runtime — Supabase's transaction pooler (pgBouncer) doesn't
support the session-level behavior the migration tool needs, a separate
issue from the `prepare: false` fix for the app's regular queries. If
`DIRECT_URL` isn't set it falls back to `DATABASE_URL`, which fails with
"applying migrations..." hanging and exiting 1 on Vercel — the symptom of
this mismatch. Use Supabase's **Session pooler** string for `DIRECT_URL`,
not the literal "Direct connection" tab — that one resolves IPv6-only and
fails near-instantly from Vercel's build environment (same symptom, different
cause, easy to get both wrong in a row).

If you ever do have a terminal handy and want to run one manually:
`DATABASE_URL=... DIRECT_URL=... npm run db:migrate`.

## 6. Try it

Visit `https://<your-domain>/` and click **Sign in with X**. After
approving, you land on `/app`. The first sync (full backfill) runs in the
background — if the dashboard looks empty right after signing in, wait a
moment and click **Refresh**. After that, bookmarks are read straight from
the database; **Refresh** re-syncs (fast — it stops at the first bookmark
already known), and **Sign out** clears the session cookie.

`/health` is a standing diagnostic route (env var presence, the exact
callback URL this deployment sends, outbound reachability to api.x.com) —
useful any time login breaks.

## Notes

- `phase0/`'s local scripts are throwaway spike tooling from before this
  app existed. Everywhere in the live app, `src/lib/x.ts` is the one vendor
  module that talks to X — nothing else calls `api.x.com` directly.
- X tokens live encrypted in the `users` table, never in the session
  cookie — the cookie only carries which user is signed in.
