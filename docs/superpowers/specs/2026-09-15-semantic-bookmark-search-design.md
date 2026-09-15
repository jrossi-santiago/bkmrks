# Semantic bookmark search — design

## Background

`PROJECT_BRIEF.md` scopes the initial build to Phases 0–6 and explicitly
defers AI-powered semantic search as "Phase 7 — real, wanted, and explicitly
not part of this build." Phases 0–6 are done and in daily use; this spec
covers building Phase 7's semantic search now, as its own scoped addition on
top of the existing tag/filter system — not a rewrite of it.

## Goal

Let a signed-in user search their own bookmarks by meaning, not just exact
keyword match — e.g. searching "product pricing advice" should surface a
bookmarked tweet about SaaS pricing strategy even if it never uses those
exact words. Search composes with the existing tag/untagged/public filters
rather than replacing them.

## Decisions

- **Embedding provider: OpenAI**, model `text-embedding-3-small`. (xAI/Grok
  was considered first but ruled out — it has no public endpoint that
  returns raw vectors for external storage, only a fully managed "Collections
  API" retrieval service, which is a different architecture than the one
  chosen here.)
- **Storage: pgvector** on the existing Supabase/Postgres database, via
  Drizzle's `vector` column type. Not brute-force JS cosine math, and not a
  third-party managed vector store — everything stays in the one database
  this app already uses.
- **Ranking: pure semantic** (cosine similarity via pgvector). No hybrid
  keyword/full-text blending in this pass.
- **UI: a search box on `/app`**, composing with the existing tag filter bar
  via GET params, not a separate page.

## Data model

Add one column to `bookmarks` (`src/lib/db/schema.ts`):

```ts
embedding: vector("embedding", { dimensions: 1536 }),
```

`NULL` means "not yet embedded" — this doubles as the pending-work queue for
the embedding pipeline below; no separate status column.

No HNSW/ivfflat index initially. Every query is already scoped to one
`user_id`, and pgvector's exact cosine search is fast enough at a few
thousand rows. Adding an approximate index later (`index(...).using("hnsw",
table.embedding.op("vector_cosine_ops"))`) is a one-line, index-only
follow-up if a user's bookmark count ever makes it necessary — not needed to
ship this.

**Migration note:** drizzle-kit will generate the `ALTER TABLE ... ADD COLUMN
embedding vector(1536)` from the schema change, but it does not manage
Postgres extensions. The migration must also run `CREATE EXTENSION IF NOT
EXISTS vector;` before that `ALTER TABLE` — added by hand to the generated
SQL file (or as a preceding `drizzle-kit generate --custom` migration).

## Embedding generation pipeline

**New vendor module `src/lib/openai.ts`** (same shape as `src/lib/x.ts` and
`src/lib/whop.ts` — one file per external dependency):

```ts
export async function embedTexts(texts: string[]): Promise<number[][]>
```

Calls `POST https://api.openai.com/v1/embeddings` with
`model: "text-embedding-3-small"` and the batch of input strings. Tweet text
is always far under the model's per-input token limit, so no truncation
handling is needed. Reads `OPENAI_API_KEY` from the environment, same
`credentials()`-style guard pattern as `x.ts`.

**New `src/lib/embed.ts`:**

```ts
export async function embedPendingBookmarks(opts: {
  userId?: string;
  limit: number;
}): Promise<{ embedded: number }>
```

Selects bookmarks where `embedding IS NULL AND deletedAt IS NULL` (and,
when running the global/cron path, joined to `users` with
`membershipActive = true` — same reasoning as `revalidate.ts`: no point
spending calls keeping a lapsed account's data fresh), optionally scoped to
one `userId`, capped at `limit` rows, batched through `embedTexts`, writes
the returned vectors back onto each row.

**Two callers, no new call sites needed at the entry points:**

1. **`runSync`** (`src/lib/sync.ts`) calls `embedPendingBookmarks({ userId })`
   as its last step, after the existing sync loop finishes and before the
   `sync_runs` row is marked `"ok"`. Both of `runSync`'s existing callers —
   the login callback's `after()` background continuation, and the Refresh
   button's synchronous `await` — get backlog-catch-up and freshly-synced-
   bookmark embedding for free. Neither of those two files needs to change.
2. **New cron `/api/cron/embed`**, same shape as the existing
   `/api/cron/revalidate`: `CRON_SECRET` bearer-auth check, calls
   `embedPendingBookmarks({ limit: N })` with no `userId` (global scan across
   all members' pending rows, oldest-first or just unordered — order doesn't
   matter the way `revalidate`'s `lastVerifiedAt` ordering does, since
   there's no per-row "staleness" concept here, just done-or-not-done).
   Registered in `vercel.json` alongside the existing revalidate cron. This
   is what actually backfills the *existing* backlog — every bookmark synced
   before this feature ships — without depending on a user hitting Refresh.

**One-line touch to `src/lib/revalidate.ts`:** when a tweet's `text` changes
on re-verification (the existing `changed` branch), also set
`embedding: null` in that `update(...).set(...)` call, so an edited tweet's
stale vector doesn't silently drift out of sync with its new text — it just
re-enters the same pending queue the rest of the pipeline already drains.

**Cost:** OpenAI's `text-embedding-3-small` is $0.02 per 1M tokens. A tweet
is roughly 20–60 tokens. Even a 10,000-bookmark backfill for one user is a
fraction of a cent — negligible next to the metered X API cost this app
already tracks (`PROJECT_BRIEF.md` Phase 0 answers).

## Search

`/app` gains a `q` GET search param, composing with the existing
`tags`/`untagged`/`public` params via the same `conditions` array
`src/app/app/page.tsx` already builds (AND semantics — search narrows
whatever tag filter is also active, it doesn't replace it).

When `q` is present:

1. Embed the query: `const [queryEmbedding] = await embedTexts([q]);`
2. Compute `const similarity = sql<number>\`1 - (${cosineDistance(bookmarks.embedding, queryEmbedding)})\`;` (Drizzle's built-in `cosineDistance` helper).
3. Push a condition excluding rows with no embedding yet (so an
   un-embedded bookmark is just invisible to search rather than erroring or
   sorting arbitrarily).
4. Order by `desc(similarity)` instead of the default `desc(bookmarks.sourceOrder)`, capped at a result limit (~30).

No hard similarity-score cutoff in this pass — rank and cap, don't invent a
threshold number with no real usage data to justify it. If low-relevance
results turn out to be a real problem once this is in use, a cutoff is a
small follow-up, tuned against actual query/result pairs instead of a guess.

**New `src/components/SearchBar.tsx`:** a plain `<form method="GET"
action="/app">` with one text input named `q`, matching the rest of the
app's no-client-JS, plain-GET-link filtering convention (same spirit as
`TagFilterBar`'s `<a href="/app?tags=...">` chips). Rendered next to
`TagFilterBar` on `/app`. A "Clear search" link appears when `q` is set,
matching the existing "Clear filters" link's pattern.

## Explicitly out of scope for this pass

- Hybrid keyword + semantic ranking (full-text/tsvector blending).
- Surfacing the raw similarity score in the UI.
- Any cross-user search or discovery feature.
- A dedicated `embedding_runs` log table. Unlike `sync_runs`/
  `revalidation_runs`, there's no rate-limited third-party quota to audit
  here — `embedding IS NULL` is a complete, directly-queryable picture of
  outstanding work, and OpenAI's embeddings call has no meaningful failure
  modes worth a persisted run history at this scale.
- An HNSW/ivfflat index (see Data model above).

## Files touched

- `src/lib/db/schema.ts` — add `embedding` column.
- `drizzle/000X_*.sql` (generated) — hand-add `CREATE EXTENSION IF NOT EXISTS vector;`.
- `src/lib/openai.ts` — new vendor module.
- `src/lib/embed.ts` — new, `embedPendingBookmarks`.
- `src/lib/sync.ts` — call `embedPendingBookmarks` as `runSync`'s last step.
- `src/lib/revalidate.ts` — clear `embedding` when tweet text changes.
- `src/app/api/cron/embed/route.ts` — new cron route.
- `vercel.json` — register the new cron.
- `src/app/app/page.tsx` — `q` param handling, embed query, condition + conditional ordering.
- `src/components/SearchBar.tsx` — new.
- `.env.example` — add `OPENAI_API_KEY`.
- `DEPLOY.md` — note enabling the `vector` extension and setting `OPENAI_API_KEY`.

## Testing

Follow the existing `tsx --test src/**/*.test.ts` convention
(`public.test.ts`, `whop.test.ts`). No new integration/DB-backed test
infrastructure — add unit-level coverage for anything with real branching
logic worth pinning down (e.g. the "text changed → embedding cleared" branch
in `revalidate.ts`); the pgvector query itself is a thin, direct use of
Drizzle's documented `cosineDistance` helper and doesn't need its own test
harness beyond manual verification against a real database.
