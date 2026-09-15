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
- [x] `DATABASE_URL` — set (transaction pooler, port 6543 — app runtime)
- [x] `DIRECT_URL` — set (session pooler, port 5432 — migrations only;
      NOT the "Direct connection" tab, that one's IPv6-only and unreachable
      from Vercel)
- [x] `CRON_SECRET` — Phase 4's revalidation cron (`/api/cron/revalidate`)
      checks this against the `Authorization: Bearer ...` header Vercel
      sends on every cron invocation. **Vercel does not generate or set
      this for you** — generate one yourself (`openssl rand -base64 24` or
      similar, 16+ chars) and add it as an env var with that exact value.
      Without it, the route replies 401 to Vercel's own cron hits — check
      Project → Cron Jobs → View Logs if revalidation looks like it isn't
      running.

Then **redeploy** — env var changes need a redeploy to take effect, they
don't apply to an already-running deployment.

## 5. Migrations run automatically on deploy

No terminal needed — `vercel-build` (`node scripts/migrate.mjs && next
build`) runs pending migrations before every build, so as long as
`DATABASE_URL` and `DIRECT_URL` are set, pushing to `main` (or clicking
Redeploy) is enough. Safe to run repeatedly: already-applied migrations
(tracked in the `drizzle.__drizzle_migrations` table) are skipped.

`scripts/migrate.mjs` calls `drizzle-orm`'s `migrate()` directly rather
than shelling out to the `drizzle-kit migrate` CLI — the CLI's spinner-based
output swallowed the real error on Vercel (two builds failed with a bare
`exit 1` and nothing to diagnose). If a future migration ever fails, this
script will now print the actual Postgres error.

Migrations use `DIRECT_URL` specifically, not the pooled `DATABASE_URL` the
app uses at runtime — Supabase's transaction pooler (pgBouncer) doesn't
support the session-level behavior the migration tool needs. Use the
**Session pooler** string for `DIRECT_URL`, not the literal "Direct
connection" tab — that one resolves IPv6-only and is unreachable from
Vercel's build environment.

**Incident note**: the first deploy attempt (before `DIRECT_URL` existed)
partially applied migration 0000 over the transaction pooler — tables got
created but the tracking row never committed, so a later run collided with
`relation "bookmarks" already exists`. Fixed by dropping the orphaned
objects directly in Supabase's SQL Editor (`DROP SCHEMA IF EXISTS drizzle
CASCADE; DROP TABLE IF EXISTS bookmark_tags, tags, sync_runs, bookmarks,
users CASCADE;`) and redeploying clean. If this happens again on a
database that already has real user data, do **not** reuse that DROP
blindly — reconcile row-by-row instead.

If you ever do have a terminal handy and want to run one manually:
`DATABASE_URL=... DIRECT_URL=... npm run db:migrate`.

## 5b. Cron job (Phase 4 revalidation)

`vercel.json` declares one cron: `/api/cron/revalidate` daily at 09:00 UTC
(Hobby plans only allow once/day, with actual firing time anywhere in that
hour — this schedule works unchanged on Hobby or Pro). It picks up
automatically on deploy, same as everything else in `vercel.json` — no
manual step in the dashboard beyond setting `CRON_SECRET` (step 4 above).

Verify it's actually running: Project → Cron Jobs in the Vercel dashboard
shows the schedule and **View Logs** for past invocations — a 401 there
means `CRON_SECRET` is missing or doesn't match what the route expects.

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
- Phase 4's revalidation job (`src/lib/revalidate.ts`) checks at most 500
  of the stalest-verified bookmarks per run (oldest `last_verified_at`
  first), not every bookmark every day — bounds API calls/cost/duration
  per run while still cycling through everything over successive days.
  Watch `revalidation_runs` (and `sync_runs`, which is unrelated — one row
  per login/refresh) to see what it's actually doing in production.
- Phase 5's public routes (`/u/:handle`, `/u/:handle/:tag`) read only
  through `src/lib/public.ts` — every query there re-checks
  `is_public = true` at the SQL level. `npm test` runs `src/lib/
  public.test.ts`, which asserts that against the actual generated SQL
  (via drizzle's `.toSQL()`, no live DB needed) rather than just eyeballing
  the code — run it after touching that file.
