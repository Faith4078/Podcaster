# Podcastr — Architecture Decisions & Search Design

A plain-English record of the two decisions most worth talking about in an
interview: **why Convex** as the backend, and **how hybrid search works** (and
why it once returned a plane-crash episode for a SaaS query). Every technical
claim here is verified against the linked docs at the bottom.

---

## 1. Why Convex (and why it beat the alternatives)

**One-liner:** Podcastr isn't a static content site — it's a *live* app.
Podcasts generate in the background, statuses flip `pending → generating →
ready`, listener counts tick up, bookmarks toggle. Convex is a **reactive**
backend, so the UI updates itself when data changes. That property drove the
decision.

**What "reactive" means here:** In Convex you write TypeScript functions, not
SQL, and *queries are reactive by default* — when underlying data changes,
Convex re-runs affected queries and pushes new results to subscribed clients
over a websocket, with consistency guarantees.

Concretely: on the podcast detail page, when the background pipeline flips
`status` to `ready`, the page swaps from the "generating…" spinner to the audio
player with **zero polling and no manual websocket code**.

**Why it beat the others (the "against all options" comparison):**

| Option | Why not, for *this* app |
|---|---|
| **Firebase / Firestore** | Great for simple sync, but you'd bolt on a separate vector DB for semantic search and hand-wire listeners. Best for lightweight MVPs. |
| **Supabase (Postgres)** | Excellent if you *want* SQL, but realtime is a layer you manage, and you'd add `pgvector` + full-text + sync glue. |
| **Convex** | Reactive sync, TypeScript end-to-end, **and full-text search + vector search built into the same backend** — no second vector vendor, no sync pipeline. |

**The decisive win:** Convex has both a **full-text search index** *and* a
**native vector index** in one database. That's the reason hybrid search was
feasible without a second system.

**On search vendors — why not Algolia:** Algolia's true keyword+vector
*retrieval* (NeuralSearch) is an enterprise ("Elevate") tier; its cheaper paid
tiers add AI *ranking*, not AI *retrieval*. Convex gave full-text **and** vector
search natively in the backend already in use — one source of truth, no second
vendor to sync.

**Honest limitation (say this out loud — it signals seniority):** Convex is the
right call at this scale (a few hundred podcasts, TS-only, reactive UI). At
massive scale, or if the app needed SQL joins / mature search tooling, Supabase
or a dedicated search vendor would compete harder.

---

## 2. How hybrid search works — and the plane-crash bug

### The setup
The search box runs **two** searches at once (`hybridSearch` in
`convex/podcasts.ts`):

- **Keyword search** — full-text over titles, BM25 ranking. Fast, literal, no AI.
- **Semantic search** — Gemini embeds the query sentence (`gemini-embedding-001`,
  768-d, `RETRIEVAL_QUERY`), then vector-searches by *meaning*, keeping results
  above a cosine cutoff (`_score >= 0.6`).

### The bug (in plain terms)
Query: *"podcast about the trajectory of SaaS apps"* returned SaaS episodes **and**
a plane-crash episode. Why?

1. Stop-words are stripped first: `"podcast about the trajectory of saas apps"`
   → `"trajectory saas apps"`.
2. **Key fact (verified):** Convex full-text search splits the query into terms
   and matches documents containing **any** of them (documents matching *more*
   terms rank higher via BM25, but a single-term match still comes back).
3. So `"trajectory saas apps"` matches any title containing **trajectory** OR
   **saas** OR **apps**. A plane-crash episode titled *"The Trajectory of Flight
   447"* contains "trajectory" → the keyword half returns it.
4. The semantic half *correctly* scored that episode low and excluded it — but it
   had already leaked in through the keyword half.

**In one sentence:** the plane-crash result isn't the AI misunderstanding you —
it's the literal keyword search matching the shared word "trajectory."

### The fix — Reciprocal Rank Fusion (RRF)

The old merge was **naive concatenation**: all keyword hits, then all semantic
hits, deduped. That let a lexical coincidence sit near the top.

RRF replaces the glue with a scoring rule. Each list contributes
`1 / (k + rank)` to every result it contains (with `k = 60`, the standard
smoothing constant), and a result's score is the **sum across both lists**:

```
score(d) = Σ_lists  1 / (k + rank_list(d))
```

- A podcast **both** methods rank highly collects points twice → rises to the top.
- A podcast only **one** method found (the plane-crash coincidence) collects points
  once → sinks to the bottom.

Same result set, smarter order. Now "SaaS trajectory" puts the real SaaS
podcasts first and drops the plane-crash episode to last.

**Implementation (`convex/podcasts.ts` → `hybridSearch`):**

```ts
const K = Number(process.env.RRF_K ?? 60)
const scoreById = new Map<string, number>()
const docById = new Map<string, HydratedPodcast>()
const accrue = (list: HydratedPodcast[]) => {
  list.forEach((doc, i) => {
    docById.set(doc._id, doc)
    scoreById.set(doc._id, (scoreById.get(doc._id) ?? 0) + 1 / (K + i + 1))
  })
}
accrue(keywordResults)
accrue(semanticResults)
return [...docById.values()].sort(
  (a, b) => (scoreById.get(b._id) ?? 0) - (scoreById.get(a._id) ?? 0),
)
```

Covered by a test that proves the consensus hit outranks the lexical
coincidence: *"RRF ranks a both-methods consensus hit above a keyword-only
lexical coincidence."*

### Further levers (good "what's next" talking points)
- **Weighted RRF** — weight semantic higher than keyword (e.g. 1.0 vs 0.7) since
  the box is meaning-first.
- **Cross-agreement filter** — only surface keyword hits that *also* clear a
  minimum semantic score, to drop pure lexical coincidences entirely.

---

## Sources
- [Convex — Full Text Search](https://docs.convex.dev/search/text-search)
- [Convex — Vector Search](https://docs.convex.dev/search/vector-search)
- [Convex vs Supabase](https://www.convex.dev/compare/supabase)
- [Convex vs Supabase vs Firebase (2026)](https://cadence.withremote.ai/blog/convex-vs-supabase-vs-firebase)
- [Reciprocal Rank Fusion explained](https://blog.serghei.pl/posts/reciprocal-rank-fusion-explained/)
- [OpenSearch — Introducing RRF for hybrid search](https://opensearch.org/blog/introducing-reciprocal-rank-fusion-hybrid-search/)
