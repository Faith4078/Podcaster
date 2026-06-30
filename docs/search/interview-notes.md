# Hybrid Search — Interview Prep & Talking Points

Notes for discussing Podcastr's search in interviews / a build-in-public post.
Every claim here is grounded in the actual implementation (`convex/podcasts.ts`)
and vendor facts were verified live on 2026-06-29 (not from memory).

## What's actually built (verified against code)

- **Hybrid search** = two retrievers merged:
  - **Lexical half** — `searchPodcasts` query: Convex full-text `search_title` index over
    `title`, **BM25 scoring + prefix matching on the final term**, stop-word stripped,
    `.take(8)`, ready-only, optional `.eq('category', …)`.
  - **Semantic half** — `hybridSearch` action: embed query with Gemini `gemini-embedding-001`
    (**768-dim**, `RETRIEVAL_QUERY` task type) → `ctx.vectorSearch('podcasts','by_embedding',
    {limit:20, filter})` → cosine cutoff `_score >= 0.6` → hydrate via `getReadyByIds`.
  - **Fusion** — concatenate keyword-first, then semantic not already present, dedup by `_id`.
  - **Guardrails** — global token-bucket rate limit consumed up front; 400ms input debounce on
    the client; `getLatest` fallback when idle/error.

## Verified vendor facts (Convex & Algolia)

**Convex full-text (current):**
- BM25 relevance + proximity/exact-match ranking
- Prefix matching on the **last** term
- **NO typo tolerance** — fuzzy/typo matching was deprecated & removed after 2025-01-15
- ⚠️ Do NOT claim Convex handles typos. It doesn't anymore.

**Algolia tiers (2026):**

| Tier | Price | What you get |
|---|---|---|
| Build (free) | $0 | 10K searches/mo, keyword only |
| Grow | $0.50 / 1K searches | keyword search |
| Grow Plus | $1.75 / 1K searches | adds **AI Ranking + personalization** — *not* semantic/vector |
| Elevate | custom, annual (~$50K+/yr) | **NeuralSearch** = real keyword+vector hybrid |

⚠️ The $1.75 Grow Plus tier is **AI ranking, not AI retrieval**. The actual semantic hybrid
(NeuralSearch) is Elevate-only. Do NOT post "Algolia hybrid was $1.75/1K" — that conflates the two.

---

## "If they ask X, say Y"

### Q: Walk me through your search architecture.
It's hybrid — two retrievers merged. Lexical: Convex full-text over the title, BM25-ranked with
prefix matching on the last term. Semantic: embed the query with Gemini (`gemini-embedding-001`,
768-dim, `RETRIEVAL_QUERY`), vector-search stored embeddings, apply a cosine relevance cutoff. Then
merge and dedup. Exact keywords hit the lexical half; intent/meaning queries hit the semantic half.

### Q: How do you fuse the two result sets / scores? (sharpest probe — preempt it)
Today it's rank-concatenation — keyword first, then semantic not already present, deduped by ID.
Deliberately simple because at a few-hundred-doc catalog it's enough and I can reason about it. The
principled approach is **Reciprocal Rank Fusion**: score each doc Σ 1/(k + rank_i) across both lists
(k≈60), which merges rankings without needing the two scoring scales to be comparable. That's my
next step.

### Q: Why not normalize and add BM25 + cosine?
They're on non-comparable scales — BM25 is unbounded and corpus-dependent, cosine is ~0–1. Naive
weighted addition is brittle and needs per-query normalization. RRF sidesteps it by using ranks, not
raw scores — which is why it's the standard for fusing heterogeneous retrievers.

### Q: Why the 0.6 cosine cutoff?
Empirical. `vectorSearch` returns k-nearest neighbors but never filters — it always returns
something, even garbage. I measured real data: true topical matches ~0.70–0.74, off-topic ~0.41–0.50.
0.6 sits in the empty gap. It's hand-tuned, not learned — the honest weakness is it's calibrated to
the current corpus and I'd re-validate it as the catalog grows or the embedding model changes.

### Q: How would you measure whether search is good?
Build a labeled eval set (query → relevant IDs). Offline: **recall@k**, precision@k, **MRR/nDCG**
for rank quality. For the threshold, sweep it and pick the precision/recall knee rather than
eyeballing. Online: click-through and zero-result rate. I have unit tests for correctness
(merge/dedup/cutoff/category), not yet a relevance eval harness — that's the first gap I'd close if
search were the core product.

### Q: Why Convex instead of Algolia / Elasticsearch / a vector DB?
Scope. Convex gives full-text AND native vector search in the same backend the data lives in —
single source of truth, no external index, no sync pipeline, no second vendor. Algolia's actual
hybrid (NeuralSearch) is enterprise-only (Elevate, annual). Its pay-as-you-go tiers (Grow $0.50,
Grow Plus $1.75 per 1K searches) are keyword-centric — Grow Plus adds AI ranking/personalization,
not semantic retrieval. So matching what I built would've meant an enterprise deal. I'd reach for
Algolia/Vespa/Elasticsearch at large scale, or for typo tolerance, faceting, search-as-you-type, and
search analytics.

### Q: Failure modes of your current setup?
Three: (1) no typo tolerance — Convex removed fuzzy matching in early 2025, so misspellings only
survive via the semantic half; (2) naive fusion, so ranking degrades as result lists grow;
(3) static, corpus-calibrated threshold. None bite at current scale, but I know where they are.

### Q: Isn't embedding the query at search time slow/expensive?
One Gemini embedding call per query — I debounce input 400ms and rate-limit with a global token
bucket to bound cost/abuse. Document embeddings are computed once at generation time and stored, so
only the query is embedded live. If latency mattered more I'd cache query embeddings for repeats.

### Q: Why `RETRIEVAL_QUERY` task type and 768 dims?
Gemini lets you tag intent — documents embed as `RETRIEVAL_DOCUMENT`, queries as `RETRIEVAL_QUERY`,
aligning them for asymmetric search. 768-dim is a deliberate truncation: smaller index, faster
vector search, negligible cosine-quality loss at this scale.

### Q: How does this scale to millions of podcasts?
Lexical half scales fine (index lookup). The semantic half is the watch point: at millions of
vectors + high QPS I'd move to a dedicated vector store (Qdrant/Vespa/pgvector with ANN tuning), add
real fusion (RRF), and a re-ranking stage — embed-retrieve top ~100, then cross-encoder re-rank the
top k. The standard retrieve-then-rerank pipeline.

---

## Avoid saying
- ❌ "Convex has typo tolerance" — it doesn't (removed Jan 2025).
- ❌ "My fusion is production-grade" — it's concatenation; own it and pivot to RRF.
- ❌ "Algolia hybrid was $1.75/1K" — that's AI-ranking (Grow Plus), not semantic retrieval.

## The one sentence that signals seniority
"I picked the simplest thing that worked at my scale, I know exactly where it breaks, and I know the
named techniques I'd reach for next — RRF for fusion, a labeled eval set with recall@k/nDCG for
quality, and retrieve-then-rerank for scale."

---

## Sources (verified 2026-06-29)
- Convex full-text search: https://docs.convex.dev/search/text-search
- Convex 1.7 (fuzzy/prefix announcement): https://news.convex.dev/announcing-convex-1-7/
- Algolia NeuralSearch: https://www.algolia.com/products/features/neuralsearch
- Algolia pricing: https://www.algolia.com/pricing
- Algolia Grow billing: https://support.algolia.com/hc/en-us/articles/15745996583441-How-am-I-billed-on-the-Grow-plan
