# bkmrks

> **Status of this document.** Written from the repo as it stands at commit
> `eb39974` on `main`. Every product claim below is traceable to a file in
> §15. Where the founder brief and the code disagree, the code wins and the
> gap is called out explicitly. Anything not settled in the repo is marked
> **unset**.

**Recon note — what this product IS vs. what the brief said it is.**

The brief describes a tool that "makes it easier to view X/Twitter bookmarks
so people never lose, bury, or forget old saves." The code delivers about
two-thirds of that, plus one large thing the brief never mentions:

- **It does deliver findability.** Semantic (meaning-based) search over your
  own bookmarks, tag filters, an author/@handle filter, and a sort toggle
  between "recently saved" and "recently posted," newest or oldest first.
  That is a real answer to "chronological and hard to search."
- **It does deliver durability.** Bookmarks are copied into this app's own
  Postgres on first login and kept there. A daily job re-checks each saved
  tweet against X and soft-deletes ones that vanished. Your library survives
  X losing the post; the text you saved does not disappear from your view.
- **It does NOT deliver "never forget."** There are no resurfacing
  mechanics in this repo at all — no digest email, no reminders, no unread
  state, no "resurface a random old save," no spaced review. `PROJECT_BRIEF.md`
  lists digest emails under Phase 7 as explicitly deferred. **This is the
  single biggest gap between the founder brief and the shipped product.**
  Today the product makes old saves *retrievable on demand*; it does not
  *bring them back to you*. The final tagline (§12) is scoped to exactly that
  distinction and stays on the right side of it — it claims forgotten
  bookmarks end because you can reach them, never that the product remembers
  for you.
- **It has a pillar the brief omits: publishing.** Any tag can be flipped
  public, which creates an unauthenticated, shareable page at
  `/u/:handle/:tag` plus a public profile at `/u/:handle` listing your
  public tags. There is a one-click "Add to public page" button on every
  bookmark. This is roughly half the built surface area and needs to be in
  any marketing story.
- **It is paid-only, with no free tier, and the price is unset.** Whop
  subscription gate; every route under `/app` requires an active membership.

---

## 1. One-liner

bkmrks is a paid dashboard that copies your X bookmarks into a private,
searchable library you actually own — and lets you turn any tag of them into
a public, shareable link.

## 2. Problem

**What X bookmarks are like today.** Native bookmarks are one flat,
reverse-chronological list. X exposes no "date bookmarked" field at all —
only the order it returns things in (`PROJECT_BRIEF.md`, Phase 0 answer 3),
which is why even X itself can only show you a stack. There is no tagging, no
grouping, no meaning-based search, no sharing, and no export.

**Why people save and never return.** Saving is one tap and costs nothing, so
the list grows faster than anyone reads it. Retrieval is the expensive part:
you remember *what a post was about*, not its wording, its author, or where
it sits in a 3,000-item scroll. So the list becomes write-only.

**The specific pain this repo attacks.**

- *Can't search by meaning.* `/app` embeds your bookmark text with OpenAI
  `text-embedding-3-small` and ranks by cosine similarity in pgvector, so
  "product pricing advice" can surface a tweet about SaaS pricing that never
  uses those words (`src/lib/openai.ts`, `src/lib/embed.ts`, `src/app/app/page.tsx`).
- *Can't group anything.* Freeform tags, applied inline from the card
  (`src/lib/tags.ts`, `src/components/BookmarkCard.tsx`).
- *Can't find "that thing from that person."* A `@handle` filter with a
  datalist of every author you've ever bookmarked, ranked by how often
  (`src/lib/handles.ts`, `src/components/HandleFilterBar.tsx`).
- *Can't get at the bottom of the pile.* A "Show oldest first" toggle
  inverts the whole list, so the oldest saves — the ones most buried in X —
  are one click away (`src/app/app/page.tsx`).
- *Saves rot.* A daily job re-checks stale bookmarks against X, refreshes
  changed text/media/metrics, and soft-deletes tweets that are gone
  (`src/lib/revalidate.ts`).
- *Saves are trapped.* A tag can be published as a standalone page anyone can
  open with no login (`src/lib/public.ts`, `src/app/u/`).

**Not attacked (be honest in marketing):** *being reminded.* Nothing in the
product prompts you to come back — no digest, no reminder, no unread queue.
Note the seam this creates with the final tagline ("No more endless &
forgotten bookmarks," §12): the product ends forgetting on the **retrieval**
side, by making any save reachable on demand. It does not end it on the
**prompting** side. Marketing gets the first half and never the second.

## 3. Who it is for

**Primary: the heavy X saver who already knows their bookmarks are a
graveyard and is willing to pay to fix it.** The product's actual workflow —
sign in, full backfill, then search/tag/filter — only pays off above a few
hundred bookmarks. The display cap is 5,000 bookmarks (`MAX_LIMIT` in
`src/app/app/page.tsx`), which tells you the builder expected heavy accounts.

**Secondary: the curator who wants to publish a link list without polluting
their main feed.** The "Add to public page" button, the `Public` filter chip
(an owner-side view of "what my audience sees"), the "Copy share link"
button, and the `/u/:handle/:tag` route exist specifically for this
(`src/components/TagManager.tsx`, `src/components/CopyShareLinkButton.tsx`).
This is the person who wants a "resources" page or a running "what I'm
reading" list.

**Also served, lightly: the researcher doing recall.** Semantic search plus
tag plus author filters compose with AND, so "everything I saved from
@someone, tagged pricing, about cold outreach" is one URL. Real, but capped
at 30 results per search and semantic-only — see §5.

**Who it is NOT for.**

- Anyone who wants a general bookmark manager. X bookmarks are the only
  input. There is no URL saver, no browser extension, no share sheet, no
  import from anywhere else.
- Anyone who saves things outside X.
- Teams. Every table is scoped to one `user_id`; there is no sharing, no
  collaboration, no seats.
- Free users. There is no free tier, not even a limited one
  (`src/app/subscribe/page.tsx`).
- Anyone who wants to *act* on X from here — no posting, liking, replying,
  following, or DMing is possible (`src/lib/x.ts` is read-only by design).

## 4. What it does (current product)

### Ingest / sync

- **Sign in with X (OAuth 2.0 + PKCE)**, scopes `bookmark.read tweet.read
  users.read offline.access` — the official X API, using your own token, so
  it reads only your own bookmarks (`src/lib/x.ts`, `src/app/login/route.ts`).
- **Full backfill on first login**, run in the background after the redirect
  via Next's `after()` so login isn't blocked (`src/app/api/auth/callback/route.ts`).
- **Incremental sync after that**, using a watermark: page newest-first and
  stop at the first tweet ID already stored. Same function handles both
  cases (`src/lib/sync.ts`).
- **Manual "Refresh" button** in the header, runs synchronously because the
  watermark makes it short (`src/app/app/refresh/route.ts`).
- **Every sync run is logged** — calls made, fetched, new (`sync_runs` table).
- **Stored per bookmark:** tweet text verbatim, author identity, media JSON,
  public metrics, original post time, and `source_order` — the app's stand-in
  for "date saved," since X exposes order but no bookmark timestamp.
- **Sync is skipped entirely for accounts without an active membership** —
  X API calls cost real money per event (`src/app/api/auth/callback/route.ts`).

### Browse / view

- **One dashboard at `/app`**, a responsive card grid (`minmax(320px,1fr)`),
  100 bookmarks per page with a "Show more bookmarks" button up to 5,000.
- **Cards** show author avatar/name/handle, full text (never truncated or
  rewritten), a 2-column media grid, the original post date, and a "View on
  X →" link back to the source — X Display Requirements are honored
  deliberately (`src/components/BookmarkCard.tsx`).
- **Reading mode**: a cookie toggle that hides author avatars and collapses
  each post's images behind a per-post `<details>` "Load image" disclosure.
  No client JS. Its stated purpose in code is so the dashboard "doesn't look
  like X at a glance" (`src/lib/session.ts`, `src/app/app/reading-mode/route.ts`).
- **Dark mode** throughout, via Tailwind `dark:` classes — follows the OS,
  there is no in-app theme switch.
- **Mobile**: the header's actions collapse into a hamburger menu below
  `sm` (`src/components/AppHeader.tsx`).

### Find / filter / search

- **Semantic search** over your own bookmarks: the query is embedded at
  request time and ranked by cosine distance against stored vectors, capped
  at 30 results (`src/app/app/page.tsx`).
- **Tag chips** — multi-select, OR within tags; chips that would return zero
  are hidden (`src/components/TagFilterBar.tsx`).
- **"Untagged" chip** for triaging the backlog.
- **"Public" chip** — everything carrying any public tag.
- **@handle filter** with a datalist of every author you've bookmarked and
  their counts; also reachable by clicking any `@handle` on a card.
- **Sort**: "Recently saved" (source order, default) vs "Recently posted"
  (original tweet date), each invertible with "Show oldest first."
- **Everything composes with AND** and every filter is a plain GET param, so
  any view is a bookmarkable, shareable-to-yourself URL. Almost the entire
  filter UI is plain HTML forms and links with no client JavaScript.

### Organize (tags, folders, stars, notes)

- **Tags are the only organizing primitive.** No folders, no collections, no
  stars, no notes, no highlights, no ratings — a deliberate architectural
  decision stated in `PROJECT_BRIEF.md`: one mechanism doing two jobs
  (organizing and sharing) instead of two parallel systems.
- Tags are freeform, created inline by typing in the `+ tag` field on a card,
  and are unique per user case-insensitively (`src/lib/tags.ts`).
- Remove a tag by clicking its chip on the card.
- "Manage tags" is a collapsed `<details>` panel listing every tag with its
  count, a public/private toggle, and the share link.

### Resurface / "never forget" mechanics

**None ship in this repo.** No digests, no email, no reminders, no unread
state, no review queue, no notifications. `PROJECT_BRIEF.md` lists digest
emails under Phase 7 (deferred). The nearest things that exist are passive:
the "Show oldest first" toggle, semantic search, and a 12-week activity
sparkline on `/app/stats`.

### Export / backup

**None.** There is no CSV/JSON export, no download, no API, no account
deletion route. The data *is* durably copied out of X into this app's
Postgres (which is a real backup in the practical sense — a deleted tweet's
text survives in your library as a soft-deleted row), but there is no
user-facing way to take it anywhere else.

### Auth, accounts, privacy model

- Identity **is** your X account; there is no email/password and no separate
  profile. Signing in with X creates the account.
- **X access and refresh tokens are encrypted at rest** (AES-256-GCM via Web
  Crypto) in the `users` table, keyed by `SESSION_SECRET`. The session cookie
  carries only *which user* is signed in, so a stolen cookie can't be replayed
  against X's API (`src/lib/crypto.ts`, `src/lib/session.ts`).
- Refresh tokens are rotated on every use, as X requires, and the new one
  overwrites the old (`src/lib/db/users.ts`).
- **Private by default.** Nothing is public until you flip a specific tag
  public. The public routes read exclusively through `src/lib/public.ts`,
  where every query independently re-asserts `is_public = true` at the SQL
  level. `src/lib/public.test.ts` asserts that against drizzle's *generated
  SQL*, not the source text. A private tag and a nonexistent tag both 404
  identically, so the public route can't be used to probe which tags exist.
- Public pages are read-only: no logins, no comments, no reactions, no
  visitor tracking, no counts.
- **Read-only against X, always** — nothing in the codebase can post, like,
  follow, or DM.
- **Payments**: Whop subscription. `users.membership_active` is written in
  exactly one place — the signature-verified Whop webhook handler — and is
  never settable from a browser (`src/app/api/webhooks/whop/route.ts`).
  Signature verification uses Whop's own Standard Webhooks helper and is
  covered by tests against tampered bodies and wrong secrets.

## 5. What it does not do (yet)

Explicit non-goals and known gaps. This list is the honest half of the pitch.

1. **No resurfacing of any kind.** No digest, reminder, unread, review queue,
   or notification. The "never forget" half of the founder brief is not built.
2. **No export, no backup download, no public API, no account-deletion flow.**
3. **No keyword or exact-phrase search.** Search is purely semantic —
   `PROJECT_BRIEF.md`'s spec calls out "no hybrid keyword/full-text blending
   in this pass." Searching for a literal `@handle`, a URL, or an exact quote
   is not reliable. The `@handle` filter partly covers that case.
4. **Search silently excludes un-embedded bookmarks.** Rows whose embedding is
   still pending are filtered out of results rather than ranked badly. A
   fresh backfill is searchable only as embedding catches up (inline at sync,
   500/run, plus a daily cron sweep).
5. **Search returns at most 30 results**, with no pagination and no relevance
   score shown.
6. **The dashboard caps at 5,000 bookmarks**; past that the UI tells you to
   use search or a filter. "Show more" is a growing-limit query, not real
   pagination.
7. **No folders, collections, stars, notes, annotations, or highlights.**
   Tags only — a stated architectural decision, not an oversight.
8. **No per-bookmark sharing.** Sharing is tag-level only; the "Add to public
   page" button is sugar over a tag literally named `Public`.
9. **No full-text/date range/media-type filters**, no "has link," no
   thread unrolling, no quote-tweet or reply context — only the tweet text
   and media X returns.
10. **No browser extension, share sheet, or non-X ingest.** X bookmarks are
    the only source.
11. **No bulk operations** — no multi-select, no bulk tag, no bulk delete, no
    way to remove a bookmark from your library at all (it leaves only when X
    loses the source tweet).
12. **No teams, no multi-account, no collaboration.**
13. **No onboarding.** A new paid user lands on `/app` with an empty list and
    one line of copy telling them the first sync is running.
14. **No pricing displayed anywhere in the product** — the subscribe page
    says only "an active membership is required," then hands off to Whop.
15. **No media hosting.** Images are hot-linked from X's CDN URLs, refreshed
    daily by the revalidation job. Phase 0 observed those URLs look stable
    but flagged it as unconfirmed.
16. **Public pages have no SEO/meta/OG tags, no pagination, and no
    branding** — no title tag, no share preview card.
17. **Landing page is a headline, one sentence, and a button.** No pricing,
    screenshots, FAQ, or social proof.
18. **Revalidation is bounded to 500 bookmarks/day globally across all
    users** (Vercel Hobby cron: once a day). At scale, a bookmark's
    re-check interval grows linearly with total users.
19. **One grandfathered account** (`thejosephrossi`) is hardcoded into
    migration 0003 with membership permanently on.
20. **`README.md` is one line: `# bkmrks`.**

## 6. How it works (plain English)

**The journey.**

1. **Land.** `/` shows "bkmrks — See every tweet you've bookmarked on X, in
   one clean dashboard" and a single "Sign in with X" button.
2. **Sign in.** X's OAuth screen asks you to grant read access to your
   bookmarks, tweets, and profile — plus offline access so the app can keep
   syncing without re-prompting.
3. **Pay.** Without an active membership you land on `/subscribe`: "bkmrks is
   a paid dashboard… there's no free tier." Clicking through creates a Whop
   checkout tied to your user ID and redirects you to Whop. On return you see
   "Confirming your membership…" until Whop's webhook lands, usually seconds.
4. **First sync.** The backfill runs in the background, paging through your
   entire bookmark history. If the dashboard looks empty, the empty state
   says so and points at Refresh.
5. **Library.** `/app` — your bookmarks as cards, newest-saved first, with a
   search box, an @handle filter, tag chips, and a sort row on top.
6. **Find an old bookmark.** Type what it was *about* (semantic, not
   keyword). Or filter to the author. Or flip to oldest-first and go to the
   bottom of the pile. All three compose.
7. **Organize (optional).** Type a tag into the `+ tag` field on any card.
   Tag chips appear in the filter bar automatically.
8. **Publish (optional).** Either click "Add to public page" on a card — which
   find-or-creates a tag named `Public`, marks it public, and applies it — or
   open "Manage tags," flip any tag public, and copy its share link. The page
   is live at `/u/yourhandle/tagname` with no login required for visitors.
9. **Come back later.** Click Refresh to pull in what's new (fast: it stops at
   the first bookmark it already knows). Overnight, a cron job re-checks the
   stalest bookmarks against X and embeds anything still unsearchable.
   `/app/stats` shows totals and a 12-week sparkline, with a "Share to X"
   button that pre-fills a brag tweet.

**Architecture.** One Next.js 16 App Router application in TypeScript,
Tailwind v4, deployed on Vercel. Almost everything is a React Server
Component; the only client JavaScript in the whole app is the mobile header
menu and the "Copy share link" button — filters, search, sorting, tagging and
the public/private toggle are all plain HTML forms, links and Server Actions.
Data lives in one Postgres database (Supabase transaction pooler, `prepare:
false`; Neon documented as an alternative) accessed through Drizzle ORM, with
pgvector for embeddings and migrations run automatically on every Vercel
build. `src/proxy.ts` gates `/app/*` on a valid session cookie. Three external
services, each behind exactly one vendor module by convention: **X API**
(`src/lib/x.ts`, read-only, official `api.x.com`), **OpenAI**
(`src/lib/openai.ts`, `text-embedding-3-small` only), and **Whop**
(`src/lib/whop.ts`, checkout + webhook verification). Two Vercel crons run
daily: revalidation at 09:00 UTC, embedding backfill at 10:00 UTC. `/health`
is a standing diagnostic page showing env-var presence, the exact OAuth
redirect URI this deployment sends, and outbound reachability to X and Whop.

## 7. Product principles

Inferred from the code, and each one is actually followed:

1. **Never write to X.** One read-only vendor module; no post, like, follow,
   or DM path exists anywhere in the codebase.
2. **Private by default; public only by explicit, per-tag action.** Public
   routes can only read through a module where every query re-asserts
   `is_public = true`, and that's enforced by a test against generated SQL.
3. **Your library is a copy you hold, not a view onto X.** Bookmarks are
   persisted; a deleted tweet is soft-deleted, not erased.
4. **One mechanism, not two.** Tags are both the organizing primitive and the
   sharing unit. No parallel "collections" system was allowed to exist.
5. **Ship HTML, not a JavaScript app.** Filters, search, sort and tagging are
   forms and links. Client JS is the exception that must justify itself.
6. **Respect the source.** Tweet text is rendered verbatim, attribution is
   always shown, and every card links back to the original post.
7. **Bound every job that costs money.** Revalidation caps at 500 bookmarks
   per run, embedding at 500, search at 30 results, the list at 5,000 — and
   lapsed accounts are skipped entirely so they cost no API calls.
8. **Fail closed.** Cron routes 401 when the secret is unset, not just when
   it's wrong. Webhook signature failures are rejected. Unowned tags can't be
   toggled, because ownership is in the WHERE clause.

Two principles the brief names that the code does **not** support, and which
marketing must not claim: *local-first* (it is cloud-hosted, single region,
with no local mode and no export) and *don't require X Premium for basic
organization* (X Premium is irrelevant here — but bkmrks itself requires a
paid membership for **everything**, including basic organization).

## 8. Positioning

**Category.** An X companion / archive tool — closest shelf is "bookmark
manager," but it's narrower and sharper than that: a single-source personal
archive for one platform, with a publishing surface attached. It is not a
personal knowledge base (no notes, no linking, no writing).

**Alternative to.**

- *Native X bookmarks* — the direct competitor: chronological, unsearchable,
  ungroupable, unshareable, unexportable.
- *A Notion or Apple Notes dump of tweet links* — manual, lossy (links rot,
  text isn't captured), and never searched by meaning.
- *Generic read-later apps* — they save URLs; they don't see your existing
  bookmark history, and X links degrade to link previews there.
- *A "resources" thread pinned on your profile* — the public-tag page is the
  same job without spending a post or polluting your feed.

**Differentiator.** The mechanism, not the slogan: bkmrks uses your own X
OAuth token to copy your entire bookmark history into a database you control,
embeds every post as a vector, and ranks searches by meaning — so retrieval
works from what a post was *about*, not from remembering its wording or its
place in a scroll. The same tags you use to organize privately are the unit
you publish with: flipping one boolean turns a tag into a public page at a
clean URL, with a data-access layer built so a public route is structurally
incapable of reading a private one. Everything is server-rendered HTML, so
the library is fast on a thousands-item account and every filtered view is
just a URL.

## 9. Jobs to be done

1. When I remember I saved something about a topic but not who posted it or
   how they worded it, I want to search my bookmarks by meaning, so I can find
   it in one query instead of scrolling X's list.
2. When I want everything I've ever saved from one person, I want to filter my
   library to that @handle, so I can read their body of work in one place.
3. When I've saved hundreds of posts and lost track of what's in there, I want
   to tag and filter them, so my bookmarks become a set of small, browsable
   lists instead of one undifferentiated pile.
4. When someone asks me for my best links on a topic, I want to hand them one
   URL, so I don't have to re-collect them in a DM or spend a post on it.
5. When I want to share what I'm saving without it becoming part of my
   posting feed, I want a public page that's separate from my profile, so my
   curation and my brand stay separate.
6. When a post I bookmarked gets deleted, I want my copy of its text to
   survive, so a dead link doesn't erase what I saved.

## 10. Core user stories

Each maps to a real route, component, or action in the repo.

1. As a visitor, I can sign in with my X account, so that I don't create yet
   another password. *(`/login` → `/api/auth/callback`)*
2. As a signed-in non-member, I can start a Whop checkout, so that I can
   unlock the dashboard. *(`/subscribe` → `/subscribe/start`)*
3. As a member, I can see my entire X bookmark history as cards on one page,
   so that I can actually look at what I've saved. *(`/app`)*
4. As a member, I can search my bookmarks by what they were about, so that I
   can find a post without remembering its wording. *(`?q=` + `src/lib/openai.ts`)*
5. As a member, I can filter to a single author's posts by picking their
   handle or clicking it on a card, so that I can see everything I've saved
   from them. *(`?handle=` + `HandleFilterBar`)*
6. As a member, I can add a freeform tag to any bookmark straight from its
   card, so that organizing costs one keystroke-and-enter. *(`addTagAction`)*
7. As a member, I can filter by one or more tags, or by "Untagged," so that I
   can triage a backlog and work a topic at a time. *(`TagFilterBar`)*
8. As a member, I can flip my sort between most-recently-saved and
   most-recently-posted, and invert either, so that I can reach my oldest
   saves — the ones X buries hardest. *(`?sort=` / `?dir=`)*
9. As a member, I can turn on reading mode to hide avatars and collapse
   images, so that the page reads like text instead of like a feed.
   *(`/app/reading-mode`)*
10. As a member, I can mark any tag public and copy its share link, so that a
    curated list becomes a URL I can hand to anyone. *(`TagManager`,
    `CopyShareLinkButton`)*
11. As a member, I can add a bookmark to my public page in one click, so that
    sharing doesn't require setting up a tag first. *(`addToPublicAction`)*
12. As a member, I can see which of my bookmarks are publicly visible via the
    "Public" filter chip, so that I always know what my audience can see.
13. As a member, I can hit Refresh to pull in bookmarks I've saved since my
    last visit, so that the library stays current without waiting.
    *(`/app/refresh`)*
14. As a member, I can view my all-time totals and a 12-week activity
    sparkline and share them to X, so that I have something to post about.
    *(`/app/stats`)*
15. As any visitor with a link, I can open someone's public tag page with no
    account and no login, so that the link just works. *(`/u/:handle/:tag`)*

## 11. Information architecture

**Screens (authenticated).**

| Route | What it is |
|---|---|
| `/` | Landing. Headline, one line of copy, "Sign in with X." |
| `/login` → `/api/auth/callback` | OAuth 2.0 + PKCE handshake; triggers first sync. |
| `/subscribe` | The paywall. Whop handoff. |
| `/app` | **The product.** Search, handle filter, tag chips, Manage tags, sort row, card grid, "Show more." |
| `/app/stats` | Brag card: totals, 12-week sparkline, member-since, Share to X. |
| `/app/refresh`, `/app/reading-mode`, `/app/sign-out` | POST-only actions that redirect back to `/app`. |

**Screens (public, unauthenticated).**

| Route | What it is |
|---|---|
| `/u/:handle` | Public profile: an alphabetical list of that user's public tag names. Nothing else — no counts, no bio, no hint that private tags exist. |
| `/u/:handle/:tag` | Public tag page: handle, tag name, and the tagged bookmarks newest-saved first, each as a read-only card. |

**Infrastructure routes.** `/health` (diagnostics), `/api/webhooks/whop`
(membership), `/api/cron/revalidate` (daily 09:00 UTC),
`/api/cron/embed` (daily 10:00 UTC).

**Main nav.** There is no sidebar and no global nav. The `/app` header is:
avatar + display name + @handle on the left; Stats · Reading mode · Refresh ·
Sign out on the right (a hamburger on mobile). Filters live in the page body,
not in navigation.

**Objects.**

- **User** — one X account. `x_user_id`, `x_handle`, display name, avatar,
  encrypted access/refresh tokens + expiry, `whop_membership_id`,
  `membership_active`, `membership_updated_at`, `created_at`.
- **Bookmark** — one saved tweet, per user.
- **Tag** — `id`, `user_id`, `name` (freeform, unique per user
  case-insensitively), `is_public`, `created_at`. The only organizing
  primitive **and** the sharing unit.
- **BookmarkTag** — the many-to-many join. No metadata of its own.
- **SyncRun** — one row per login/refresh: started, finished, status,
  fetched, new, api_calls, error.
- **RevalidationRun** — one row per cron sweep: checked, deleted, updated,
  api_calls, error.
- There is **no** Folder, Collection, Digest, Note, Highlight, Star, or
  Reminder object.

**Fields on a Bookmark as actually stored** (`src/lib/db/schema.ts`):

`id` · `user_id` · `tweet_id` · `author_x_user_id` · `author_handle` ·
`author_display_name` · `author_avatar_url` · `text` · `media` (jsonb:
media_key, type, url, preview_image_url, width/height, duration_ms, variants)
· `metrics` (jsonb, X public metrics) · `tweet_created_at` (**original post
time, not date saved**) · `imported_at` · `source_order` (the app's proxy for
save recency, since X exposes no bookmark timestamp) · `last_verified_at` ·
`deleted_at` (soft delete when the source tweet disappears) · `embedding`
(1536-dim vector; `NULL` doubles as the pending-work queue).

## 12. Brand & voice notes for marketing/design

**Existing copy is thin but consistent — extract from it, don't overwrite
it.** Every user-facing string in the app today: "See every tweet you've
bookmarked on X, in one clean dashboard." · "Your bookmarks" · "Search your
bookmarks…" · "Filter by @handle…" · "Recently saved / Recently posted" ·
"Show oldest first" · "Manage tags" · "Make public / Make private" · "Add to
public page" · "Copy share link" · "Reading mode: on/off" · "bkmrks is a paid
dashboard… there's no free tier." · "No bookmarks match this filter." · "No
public tags yet." · "Nothing tagged here yet." · "I've bookmarked N things
worth keeping on bkmrks. 🔖"

The voice that produces: **plain, literal, unhyped, slightly terse. It
describes what a thing does and stops.** It never uses an exclamation mark
(except "Copied!"), never says "we," never apologizes, and never oversells —
it even tells you upfront that there's no free tier rather than burying it.
The product name is lowercase, vowel-dropped, and unbranded. Everything below
is **consistent with that existing voice**; where it goes beyond what's
written in the app it is marked **(proposed)**.

**Tagline (final, canonical): "No more endless & forgotten bookmarks."**
Set by the founder; it is not rewritten downstream. Both words describe the
*before* state ending — the endless chronological list, and what that list
does to what's in it. The governing rule, which every downstream asset
inherits: **"forgotten" names the graveyard we end, never a feature that
remembers for you.** The product has no reminder, digest, or resurfacing
mechanic (§5), so "no more forgotten bookmarks" must always mean *you can get
them back*, never *we bring them to you*. In a hero it is always paired with a
subhead carrying the mechanism — e.g. "Every post you've saved on X, in one
library you can search by what it was about — not what it said." See
`docs/OFFER.md` § The tagline for the full rule.

**Words we use.** endless · forgotten · bookmarks · saved · library · tag ·
public page · share link · search · filter · sync · refresh · dashboard ·
clean · your own. **(proposed):** graveyard · pile · findable · yours · the
bottom of the pile · one URL.

**Words we avoid.** we · revolutionary · AI-powered · platform · seamless ·
supercharge · effortlessly · game-changing · knowledge graph · second brain ·
10x. Avoid every word that implies the product acts on you — **remind,
reminder, resurface, digest, nudge, alert, unread, review queue, "never forget
a bookmark again"** — since none of it exists (§5); this is the one line the
tagline's "forgotten" cannot cross. Avoid **"own your data"** as an absolute
until export exists. Avoid "free."

**Promises we can make without lying.**

- "Search your bookmarks by what they were about, not what they said."
- "Every bookmark you've ever saved on X, in one page you can search, filter
  and tag."
- "Turn any tag into a public link. Everything else stays private."
- "Your saves are copied into your library — if the post goes away, your copy
  of it doesn't."
- "Read-only. bkmrks never posts, likes, follows or DMs from your account."
- "Paid, no free tier."
- **Cannot promise**: reminders/digests, export, non-X saving, a free plan,
  local-only storage, a browser extension, keyword/exact search, or any
  specific price.

**Visual / UX cues already in the product.** Neutral greys on white with a
full dark mode that follows the OS. Thin 1px borders, rounded-lg cards,
rounded-full pill chips and buttons, no shadows except the mobile menu, no
color accents at all — the only saturated colors in the entire app are the
red error state and the near-black "brag card" on `/app/stats`. Small type
(`text-sm` / `text-xs` dominate). A responsive auto-fill card grid at
320px minimum, max width `2xl` on mobile / `7xl` on desktop. Density is
moderate, not masonry and not a timeline: even, boxed cards with visible
edges. Numbered positions (`#1`, `#2`) on every card. Paginated with an
explicit "Show more bookmarks" button — **no infinite scroll anywhere**,
which is itself the anti-feed statement. Collapsed `<details>` for secondary
UI (Manage tags, reading-mode images). Design direction **(proposed)**:
lean into the deliberate plainness as the brand — this is the anti-feed, a
tool that looks like a filing cabinet, not like X.

## 13. Marketing building blocks

**Homepage headline + subhead — the canonical pairing (use this):**
> **No more endless & forgotten bookmarks.**
> Every post you've saved on X, in one library you can search by what it was
> about — not what it said.

The headline is the final tagline and does not get rewritten. Only the subhead
is variable — it exists to carry the mechanism so the headline is never read
as a promise of reminders. Two alternate subheads, same job:
> Search everything you've ever saved by what it was about — not what it said,
> who posted it, or where it landed in the scroll.

> Your entire X bookmark history, pulled out of the scroll into a library you
> can search, tag, and share one link from.

**Three feature blocks.**

1. **Search by meaning, not by keyword.** Every post you save is embedded as
   a vector, so "pricing advice for a small SaaS" finds the thread that never
   used those words. Search stacks with your tag and author filters.
2. **Tags, not a filing system.** Type a word on any card. That's the whole
   organizing model — no folders, no boards, no setup. Filter by tag, by
   author, by untagged, or flip the whole list oldest-first to dig out what X
   buried.
3. **Turn any tag into a public page.** One toggle publishes a tag at
   `bkmrks.xyz/u/yourhandle/resources` — a clean, read-only list you can hand
   to anyone. Nothing else on your account becomes visible, ever.

**Objection handling.**

- *"Is this safe? What can it do to my account?"* It requests read-only
  scopes and the code has no path to post, like, follow or DM — that's
  architectural, not a policy. Your X tokens are encrypted at rest and never
  stored in your browser cookie.
- *"Doesn't X already do this?"* X gives you one reverse-chronological list
  with no tags, no meaning-based search, no grouping and no sharing. X
  doesn't even record *when* you bookmarked something. bkmrks adds all of it
  on top of the same bookmarks.
- *"Is my library private?"* Everything is private until you deliberately
  make one tag public. The public pages are served by a separate data layer
  that re-checks the public flag on every query, with a test asserting it
  against the actual SQL. A private tag is indistinguishable from one that
  doesn't exist.
- *"Will my account get banned?"* It uses the official X API with your own
  OAuth token, reading only your own bookmarks, and follows X's display
  requirements — posts are rendered verbatim, attributed, and linked back to
  the original. **(Founder note: verify current X developer policy before
  publishing this line; see §14.)**
- *"Why does it cost money? Isn't it just a bookmark viewer?"* X's API meters
  per request — reading your bookmarks costs real money on every sync, and so
  does embedding them. There's no free tier because there's no free read.
- *"What happens if I cancel?"* **Unset in the repo** — a lapsed membership
  stops syncing, revalidation, and dashboard access, but nothing in the code
  deletes data or offers an export. Decide and document this before launch.

**Short launch tweet (proposed):**
> Your X bookmarks are a graveyard. Chronological, unsearchable, and 3,000
> deep.
>
> So I built bkmrks: every post you've ever saved, in one page you can search
> by meaning, tag, and filter by author. Flip any tag public and it becomes a
> link you can share.

**Founder story frame (1 paragraph, product-focused, proposed):**
> I bookmark constantly and revisit almost nothing. Not because the posts
> weren't worth keeping — because X gives you exactly one way to get back to
> them: scroll. No tags, no search that understands what a post was about, no
> way to hand someone your best links. X doesn't even record when you saved
> something, only what order it came back in. So bkmrks pulls your whole
> bookmark history into a library of your own, embeds every post so you can
> search it by meaning, and lets you tag things in one keystroke. Then the
> part I didn't expect to build: any tag can become a public page, so the
> list you kept for yourself can become the link you send someone — without
> spending a post on it.

## 14. Open questions / decisions for later

**Monetization.** Price, billing period, and trial are all **unset** — the
plan lives in Whop, not in the repo. The subscribe page shows no number at
all, which is a conversion problem before it's a pricing problem. Given the
metered X API and OpenAI costs per user, unit economics need a real number
(Phase 0 observed ~$0.02 per billable X event, and explicitly flagged that a
full-backfill cost per user was never measured). Decide too: what happens to
data and public pages on cancellation.

**The "never forget" gap.** The brief's core promise has no implementation.
Either build the smallest real resurfacing mechanic (a weekly digest, a
"rediscover" shuffle, or an unread flag) or drop the promise from all
marketing. Choosing this is the single highest-leverage product decision open.

**No export.** Nothing lets a user take their library out. That weakens both
the "you own it" story and the churn story, and it's cheap to build.

**Search is semantic-only.** No exact-phrase or URL search, and results cap
at 30. Worth deciding whether a keyword fallback ships before launch.

**Name and domain.** `bkmrks` is the name everywhere in the code (package,
cookies, UI). `bkmrks.xyz` appears in `DEPLOY.md` and a code comment as the
intended custom domain — **whether it's registered or live is unset.**

**Positioning of the public pages.** They're half the built product but
absent from the founder brief and from the landing page. Are they the wedge
(a shareable artifact drives distribution for free) or a side feature? Also:
public pages currently have no OG tags, no title, and no branding, so every
share renders as a bare link — that's a distribution bug if this is the
wedge.

**X ToS / API risk.** The app is read-only, official-API, display-compliant
and per-user-token, which is the safe posture. But `bookmark.read` pricing is
pay-per-use and can change, and the whole product has exactly one supplier.
Confirm current developer-policy and pricing terms before marketing anything
about safety or cost.

**Onboarding.** A new paid user's first screen is an empty list. There's no
progress indicator for a backfill that can take minutes, and no explanation
that search improves as embedding catches up.

**Surface.** Web-only today. Whether a Chrome extension, an iOS app, or a
share-sheet ever ships is **unset** (all listed as deferred in the brief).

**Scale limits that become product limits.** The 5,000-bookmark display cap,
the 30-result search cap, and a globally-bounded 500-bookmark/day
revalidation sweep all hold at personal scale and break at multi-user scale.

**Repo visibility.** Public vs private positioning is **unset**; note that
`DEPLOY.md` documents a hardcoded grandfathered account and the full infra
runbook, which is worth reviewing before anything goes public.

**Data residency.** One Postgres instance (Supabase default), region
**unset**. No stated retention, deletion, or GDPR/DSAR process anywhere in
the repo.

## 15. Source map

Evidence used, so a later agent can re-read the same truth.

**Product intent and history**
- `PROJECT_BRIEF.md` — the founder's original scope doc, Phases 0–8,
  non-negotiables, the "tags are the whole IA" decision, and the verified
  Phase 0 answers about X's API (rate limits, no bookmark timestamp, token
  rotation, pay-per-use pricing).
- `docs/superpowers/specs/2026-09-15-semantic-bookmark-search-design.md` —
  the semantic-search design: OpenAI over xAI, pgvector, pure-semantic
  ranking, no keyword hybrid.
- `DEPLOY.md` — Vercel/X/Whop/Supabase setup, the `bkmrks.xyz` domain
  reference, the grandfathered-account note, and operational incident notes.
- `README.md` — one line.

**Data model and persistence**
- `src/lib/db/schema.ts` — every table and field, with design rationale in
  comments.
- `drizzle/0000–0005*.sql`, `drizzle/meta/` — migration history;
  `0003` carries the grandfather clause.
- `src/lib/db/client.ts`, `src/lib/db/users.ts`, `scripts/migrate.mjs`.

**Ingest, freshness, search**
- `src/lib/x.ts` — the single read-only X vendor module.
- `src/lib/sync.ts` — backfill + watermark incremental sync + `source_order`.
- `src/lib/revalidate.ts` — the daily compliance/hygiene job.
- `src/lib/embed.ts`, `src/lib/openai.ts` — the embedding pipeline.
- `src/app/api/cron/revalidate/route.ts`, `src/app/api/cron/embed/route.ts`,
  `vercel.json`.

**The app surface**
- `src/app/page.tsx` — landing copy.
- `src/app/app/page.tsx` — the dashboard: filters, search, sort, paging,
  empty states, caps.
- `src/app/app/actions.ts`, `src/lib/tags.ts`, `src/lib/handles.ts`.
- `src/app/app/stats/page.tsx`, `src/lib/stats.ts`,
  `src/components/StatsCard.tsx`.
- `src/components/` — `BookmarkCard`, `AppHeader`, `SearchBar`,
  `TagFilterBar`, `HandleFilterBar`, `TagManager`, `CopyShareLinkButton`,
  `PublicBookmarkCard`.
- `src/app/app/refresh/route.ts`, `reading-mode/route.ts`, `sign-out/route.ts`.

**Public sharing**
- `src/lib/public.ts` — the only data path public routes may use.
- `src/app/u/[handle]/page.tsx`, `src/app/u/[handle]/[tag]/page.tsx`.
- `src/lib/public.test.ts` — asserts the `is_public` filter in generated SQL.

**Auth, payments, ops**
- `src/app/login/route.ts`, `src/app/api/auth/callback/route.ts`,
  `src/lib/session.ts`, `src/lib/crypto.ts`, `src/proxy.ts`.
- `src/lib/whop.ts`, `src/app/subscribe/page.tsx`,
  `src/app/subscribe/start/route.ts`, `src/app/api/webhooks/whop/route.ts`,
  `src/lib/whop.test.ts`.
- `src/app/health/route.ts`, `.env.example`, `package.json`.
- `phase0/` — throwaway spike scripts from before the app existed; not
  product code.
