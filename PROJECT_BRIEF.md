# bkmarks — a bookmarks dashboard for X (working name)

**Read this whole document before writing code. Start with Phase 0 and do not
move to Phase 1 until Phase 0's checklist is answered.** This is a new,
separate repository — do not build this inside the replylane repo, and do not
import replylane code directly. Its patterns (below) are prior art from the
same builder, not a dependency.

**The launch set is exactly Phases 0–6, nothing more.** That boundary is the
point of this document — it exists so the build stops at a real, shippable
product instead of drifting into "one more feature" forever. Phase 7 (AI
tagging/semantic search) is real, wanted, and explicitly **not part of this
build**. If you find yourself adding anything not described in Phases 0–6
while building, stop and flag it instead of building it.

## What this is

Sign in with your X account, see every tweet you've bookmarked on X, in a
clean dashboard. Tag them, filter by tag. Turn any tag into a public,
shareable page — a running list of "what I'm bookmarking on the internet"
that isn't your main brand/posting feed, or a compiled resource list you hand
someone a link to. Everything else stays private by default.

## Non-negotiables

- **Read-only against X, always.** Never write, post, like, follow, or DM.
- **No feature beyond Phase 6.** Tags, filtering, and public/private sharing
  are launch features, not stretch goals — build them. Anything else is post-launch.
- **One vendor module for the X API**: `src/lib/x.ts`. This is the *official*
  X API (`api.x.com` / `developer.x.com`), not a third-party search vendor —
  bookmarks are private to the authenticated user and require that user's own
  OAuth token.
- **Log every sync run** (calls made, count fetched, count new).
- **A public page shows only what's explicitly marked public — nothing else,
  ever.** No route that renders a public page should be able to query or leak
  a private tag's name, a private bookmark, or a count derived from private
  data. Treat this as a security requirement, not a display detail.
- **Paid only, no free tier** — but that gate is Phase 6, not Phase 1. Use it
  yourself unpaywalled first.

## Stack

Next.js App Router, TypeScript, Tailwind, Drizzle + Postgres, deployed on
Vercel, npm (one lockfile, no ambiguity).

**Database: default to Supabase, same account as replylane**, so the
hard-won operational lessons transfer directly instead of getting relearned:
`prepare: false` on the postgres.js client (the transaction pooler doesn't
support prepared statements), env vars need a redeploy to take effect, and
commits need the GitHub noreply address or Vercel refuses the deploy. **Neon
is a fine alternative** if you want billing/project separation from
replylane's Supabase project — just re-verify the same prepared-statement
question against whichever driver you use with Neon's pooler; the lesson
likely transfers but confirm it rather than assume it.

## Data model (sketch — adjust as Phase 0/1 reveal real field shapes)

```
users                      -- auth identity = the X account that signed in
  id                pk
  x_user_id         unique
  x_handle
  x_display_name
  x_avatar_url
  access_token      encrypted
  refresh_token     encrypted
  token_expires_at
  created_at

bookmarks                  -- one row per saved tweet
  id                pk
  user_id           fk -> users.id
  tweet_id
  author_x_user_id
  author_handle
  author_display_name
  author_avatar_url
  text
  media             jsonb, nullable
  metrics           jsonb, nullable
  tweet_created_at
  imported_at
  source_order      int                 -- position X returned it in — see Phase 0
  last_verified_at
  deleted_at        nullable            -- soft delete: source gone
  unique(user_id, tweet_id)

tags                       -- the ONLY organizing primitive — also the sharing unit
  id                pk
  user_id           fk
  name                                  -- freeform, unique per user, case-insensitive
  is_public         boolean default false  -- flipping this makes it a shareable page
  created_at
  unique(user_id, lower(name))

bookmark_tags               -- many-to-many
  bookmark_id       fk
  tag_id            fk
  primary key (bookmark_id, tag_id)

sync_runs
  id                pk
  user_id           fk
  started_at
  finished_at
  status
  fetched_count
  new_count
  api_calls
  error
```

**Design decision: tags are the whole information architecture — there is no
separate "collections" or "boards" concept.** A private tag is just yours. A
public tag (`is_public = true`) becomes a shareable page at
`/u/:x_handle/:tag` listing every bookmark carrying that tag. Want to compile
a public resource list? Make a tag called "resources," tag the relevant
bookmarks, flip it public. Want your normal bookmarking to stay private? Just
don't make any tags public — nothing is shared by default. This is
deliberately one mechanism doing two jobs instead of two parallel systems —
don't build a second "collections" table alongside it.

`/u/:x_handle` is the public profile: it lists only that user's public tags
(and nothing else — no counts, no hints of private tags) and links to each
one's page. No visitors, no logins, no interactions on public pages — read-only,
like a public résumé, not a social feed.

## Phase 0 — Vendor spike (no product code yet)

Answer these with a real API call against your own account before writing
anything else:

1. Register an X API app (`developer.x.com`), enable OAuth 2.0 with PKCE.
   Scopes: `bookmark.read tweet.read users.read offline.access`.
2. Call `GET /2/users/:id/bookmarks` for your own account and record:
   - What tier/plan does `bookmark.read` require, and what does it cost/month?
   - Real rate limit numbers from the response headers — per-app or per-user?
   - Does the response carry a per-bookmark timestamp, or only return order?
     If only order, `source_order` is all you get for sorting.
   - What does the media object look like, and do URLs expire?
   - Does pagination return newest-bookmarked-first, so a watermark
     (stop at the first already-seen `tweet_id`) works for incremental sync?
   - Access token lifetime, and does the refresh token flow work as documented?

Write the real answers into this file before starting Phase 1.

<!-- PHASE0_ANSWERS_START -->
### Phase 0 answers — PENDING

Not yet answered. See `phase0/README.md` for the runbook. This section will
be filled in with real values from an actual API call once:

1. An X API app is registered at developer.x.com with OAuth 2.0 + PKCE
   enabled and scopes `bookmark.read tweet.read users.read offline.access`.
2. The `phase0/` scripts in this repo have been run end-to-end against that
   app and a real account's bookmarks.
<!-- PHASE0_ANSWERS_END -->

## Phase 1 — Auth + one-shot render

- "Sign in with X" (OAuth 2.0 + PKCE), encrypted token storage.
- One dashboard page: call the bookmarks endpoint live, render each as a
  lightweight card (avatar, handle, text, timestamp/`source_order`, media,
  link back to the tweet). No database yet.
- Respect X's Display Requirements: don't alter tweet text, show clear
  attribution, link back to the original.

Exit criteria: sign in, see your own real bookmarks rendered cleanly, end to end.

## Phase 2 — Persistence + full sync

- Add `bookmarks` and `sync_runs`.
- First login: full backfill, paginated, run as a background job (Next's
  `after()` continuation, not inline in the request).
- Later visits: incremental sync via the Phase 0 watermark answer.
- Dashboard reads from the database. Add a manual "Refresh" button.

Exit criteria: bookmarks persist to Supabase/Neon, a second login is fast, a
"Refresh" button pulls in what's new.

## Phase 3 — Tags and filtering

- Add `tags` and `bookmark_tags`.
- Add/remove tags on a bookmark from its card.
- Filter chips on the dashboard — filter by one or more tags, an "untagged"
  filter, and a way to browse all your tags.
- `is_public` exists on the schema already but does nothing yet — that's Phase 5.

Exit criteria: you can tag your real bookmarks and filter the dashboard down
to just a tag.

## Phase 4 — Compliance & hygiene

Do this **before** anything is shown publicly (Phase 5) — a stranger seeing a
dead or edited tweet on someone's public page is a worse failure than the
account owner seeing it privately.

- A periodic revalidation job: check whether a bookmarked tweet still exists;
  soft-delete (`deleted_at`) or update your copy if not.
- Handle expiring media URLs — re-fetch on view or cache your own copy.

## Phase 5 — Public/private sharing via tags

- Toggle `is_public` on a tag from its management UI.
- Public route `/u/:x_handle/:tag` — server-rendered, unauthenticated,
  queries **only** bookmarks tagged with that specific public tag, for that
  specific user. No other data reachable from this route.
- Public route `/u/:x_handle` — lists that user's public tags only.
- Verify directly (write a test for it, don't just eyeball it): a request to
  either public route can never return a private tag's name, a private
  bookmark, or any count derived from private data.
- A "Copy share link" button next to any tag once it's public.

Exit criteria: you can flip one tag public, get a link, open it in a private
browser window with no login, and see exactly that tag's bookmarks and
nothing else.

## Phase 6 — Paid gate

- Reuse the Whop pattern from replylane (`whop.ts`, checkout, webhook
  verification).
- No free tier: the gate is "must have an active membership to use the
  dashboard at all," not a feature-limited free plan.

## Phase 7 (explicitly deferred — not part of this build)

AI auto-tagging on import, semantic search, digest emails, multi-user/teams,
a browser extension or share-sheet for saving things beyond X bookmarks,
per-bookmark sharing overrides independent of tags, comments/reactions on
public pages, a "discover other people's public tags" browse feature. All
real ideas. None of them ship before Phases 0–6 are done and in daily use.
