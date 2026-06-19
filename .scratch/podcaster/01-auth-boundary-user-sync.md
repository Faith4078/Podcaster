# 01 — Auth boundary + Clerk→Convex user sync

**Triage:** ready-for-agent

## What to build

The authentication foundation: a public/gated boundary and a Convex `users` table kept in
sync with Clerk so authored content can reference a real user.

- An `_authenticated` layout that gates Create, My Profile, and Edit/Delete surfaces and
  redirects unauthenticated visitors to Clerk. Home, Discover, and detail/playback stay public.
- A `users` table in Convex synced from Clerk via **webhook** (upsert id, name, avatar on
  sign-up/update), with a **local-dev fallback** that upserts the current user on first
  authenticated load.
- The signed-in user's Clerk identity (name, avatar) reflected in the app header.

## Acceptance criteria

- [ ] Visiting a gated route while signed out redirects to Clerk sign-in
- [ ] Home / Discover / detail remain reachable while signed out
- [ ] Signing in upserts a Convex `users` row (id, name, avatar); webhook path and local-dev fallback both work
- [ ] Header reflects the signed-in user's name and avatar

## Blocked by

- 00 — Prefactor: stack corrections
