# 08 — Recommendations: Similar podcasts + Fans Also Like

**Triage:** ready-for-agent

## What to build

Vector-similarity recommendation surfaces.

- **Similar podcasts** on the detail page and a **Fans Also Like** carousel, both computed from
  vector similarity to the current podcast's embedding.
- On pages with no current podcast, show a trending/varied set instead.

## Acceptance criteria

- [ ] A detail page shows "similar podcasts" ranked by embedding similarity to that podcast
- [ ] A "Fans Also Like" carousel renders adjacent shows by similarity
- [ ] Where there is no current podcast, a trending/varied fallback set is shown

## Blocked by

- 03 — Real Gemini generation + custom thumbnail upload
