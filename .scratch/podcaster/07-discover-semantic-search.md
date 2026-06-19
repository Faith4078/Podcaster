# 07 — Discover: semantic search + category filter

**Triage:** ready-for-agent

## What to build

A public Discover page with meaning-based search and category filtering.

- Search runs in a **Convex action** (because `vectorSearch` is action-only): embed the query →
  vector search → optional category narrowing via the vector index `filterFields: [category]`.
- An empty query with a selected category → reactive category browse.
- A clear empty state when a search returns no matches.
- Note: because search runs in an action, results are not live-reactive (feeds remain reactive).

## Acceptance criteria

- [ ] A query returns embedding-ranked (meaning-based) results
- [ ] Selecting a category narrows the search results
- [ ] An empty query with a category shows a category browse
- [ ] No matches shows a clear empty state
- [ ] convex-test: ranked results, category narrowing, empty-query browse, and no-match empty result

## Blocked by

- 03 — Real Gemini generation + custom thumbnail upload
