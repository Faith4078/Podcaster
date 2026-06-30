# Search #1 — Activate the embeddings: semantic search + vector "similar podcasts"

**Status:** the write-side already exists (every podcast has a stored 768-dim embedding +
`by_embedding` vector index). This issue builds the **read-side** so those embeddings are finally
used. Brings the code back in line with `podcastr-prd.md` §§ Search / Recommendations, which
specced semantic search but were implemented as full-text + popularity proxies.

## Background (current state, verified in code)

- Embeddings are generated in `runPipeline` step 2 and stored, but **nothing reads them**
  (no `ctx.vectorSearch` anywhere).
- Discover search uses full-text `searchPodcasts` (`withSearchIndex('search_title')`), not vectors.
- "Similar podcasts" (`podcast.$id.tsx:83`) uses `getPopular`, not vector similarity.
- `embedTextForSearch()` already exists but embeds with `taskType: RETRIEVAL_DOCUMENT`.

## Key technical constraints

- `ctx.vectorSearch` is **action-only** (can't run in a reactive query). Both consumers below are
  therefore **actions**, and their results are **not live-reactive** (acceptable — PRD anticipates
  this for search).
- `vectorSearch` returns `{ _id, _score }` only; the action must then `runQuery` to load the full
  docs by id (with author + media URLs, like `withAuthorAndMedia`).
- The `by_embedding` index has `filterFields: ['category']`, so category narrowing happens inside
  the vector query.
- **Query-vs-document embedding task type:** query text should be embedded with
  `taskType: RETRIEVAL_QUERY` (documents use `RETRIEVAL_DOCUMENT`). Add a query-embedding variant
  or parameterize `embedTextForSearch` — using the wrong task type degrades match quality.

## Deliverable A — `semanticSearch` action

- [ ] New public action `semanticSearch({ query: string, category?: string })`:
  1. embed `query` via Gemini with `RETRIEVAL_QUERY` task type,
  2. `ctx.vectorSearch('by_embedding', { vector, limit: 20, filter: category ? q => q.eq('category', category) : undefined })`,
  3. `runQuery` to load the matched docs (status `ready` only) + author + media URLs, preserving
     vector score order,
  4. return them.
- [ ] **Rewire `discover.tsx`** from `useQuery(searchPodcasts)` to `useAction(semanticSearch)`:
  call on debounced submit (not per keystroke), store results in component state, keep the empty
  state. Decide: replace full-text entirely, or keep `searchPodcasts` as a cheap fallback.
- [ ] Empty query → keep the reactive `getLatest` browse (unchanged).

## Deliverable B — vector "similar podcasts"

- [ ] New public action `getSimilar({ podcastId })`:
  1. load the podcast's stored `embedding` (no new Gemini call needed — reuse the stored vector),
  2. `ctx.vectorSearch('by_embedding', { vector: embedding, limit: 5 })`,
  3. **exclude the podcast itself** from results; load full docs; return top 4.
- [ ] Replace `getPopular` usage at `podcast.$id.tsx:83` with `getSimilar`. Fallback to `getPopular`
      if the podcast has no embedding yet (e.g. still generating).
- [ ] Note: B makes **no** Gemini call (reuses the stored vector) — so it needs no rate limiting.

## Rate limiting — only on Deliverable A

`semanticSearch` is the one **public, anonymous, Gemini-calling** endpoint (embeds every query),
unlike generation (auth + billing gated) and `getSimilar` (no Gemini call).

- [ ] Add `@convex-dev/rate-limiter` and protect `semanticSearch` to cap query-embedding calls.
- [ ] **Keying:** anonymous callers have no userId, so use a **global** token-bucket as the
      backstop that protects the Gemini key regardless of caller (e.g. N embeds/minute), plus an
      optional tighter per-user limit when `getUserIdentity()` is present.
- [ ] On limit hit, return a friendly "search is busy, try again in a moment" — distinct from the
      no-results empty state.

## Tests (`convex-test`)
- [ ] `semanticSearch` returns embedding-ranked results for a seeded set; a category narrows them;
      no-match yields empty. (Inject a fake embedder, per the PRD's Seam-1 boundary — no real
      Gemini.)
- [ ] `getSimilar` returns vector-nearest podcasts and **excludes the source podcast**.
- [ ] Rate-limiter: calls past the limit are rejected.

## Acceptance
- Discover returns meaning-based matches (prepare PRD's demo queries where semantic beats keyword).
- Detail-page "similar" reflects content similarity, not popularity.
- Every existing podcast's stored embedding is now actually queried — no backfill needed.

## Out of scope
- Re-embedding strategy changes (already handled on edit).
- Collaborative-filtering "Fans Also Like" (stays vector-similarity per PRD).
