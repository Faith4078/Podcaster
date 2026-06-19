# 06 — Home feeds + podcast cards + listener count

**Triage:** ready-for-agent

## What to build

The public Home dashboard with three reactive feeds, author-attributed cards, and play
counting.

- **Latest** — by creation time. **Popular** — by all-time listener count. **Trending** —
  podcasts created in the last 7 days ranked by listener count (recency proxy; no plays table).
- Every podcast card shows the author's name and avatar (reactive join to the `users` table).
- A play increments the podcast's `listenerCount`, counting every play including anonymous.

## Acceptance criteria

- [ ] Home renders without signing in
- [ ] Latest, Popular, and Trending each return the correct ordering; feeds update reactively
- [ ] Cards display author name + avatar
- [ ] Playing a podcast increments its listener count (including when signed out)
- [ ] convex-test: feed ranking for a seeded set, including the Trending 7-day window boundary

## Blocked by

- 03 — Real Gemini generation + custom thumbnail upload
