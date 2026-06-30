# Billing #2 — Frontend: billing route, Create wall, Pro badge & feature gating

**Depends on:** Billing #1 (backend gate, plan on `users` doc, `QUOTA_EXCEEDED` error)
**Seam:** UI — verified manually/in demo (no component tests, per PRD Out of Scope)

## Summary

Build the user-facing half of the Free/Pro showcase: a canonical `/billing` route with Clerk's
`<PricingTable />`, an inline upgrade wall on Create, the Pro creator badge, and the client-side
gate for custom thumbnail upload. The backend (Billing #1) remains authoritative; the UI reflects
and reacts. See `podcastr-prd.md` → "Billing & Subscriptions".

## Tasks

### `/billing` route (`src/routes/`)
- [ ] New route rendering Clerk `<PricingTable />` (Free + Pro).
- [ ] Include the manage-subscription / cancel link (Clerk portal).
- [ ] Add a **sidebar** entry (`PodcastrSidebar.tsx`) so it's discoverable before hitting the wall.
      Add to `NO_SIDEBAR_ROUTES` only if it should be chrome-less (it shouldn't — keep the shell).

### Create wall (`src/routes/_authenticated/create-podcast.tsx`)
- [ ] Show remaining free generations ("N of 3 free podcasts used") for Free users.
      Read the count reactively from the `users` doc (already synced).
- [ ] At the limit, replace the submit button with an **"Upgrade to Pro"** CTA →
      deep-link to `/billing`. Copy: "You've used all 3 free generations."
- [ ] Defensive: if `generatePodcast` throws `QUOTA_EXCEEDED` (race), surface the same upgrade CTA
      instead of a raw error.
- [ ] Pro users: no counter, no wall.

### Pro badge
- [ ] Show a "Pro" badge via `has({ plan: 'pro' })` on the profile (`my-profile.tsx`) and on
      podcast cards' author display. Must disappear automatically on downgrade (live check).

### Custom thumbnail upload gating
- [ ] In the Create/Edit thumbnail UI, gate the custom-upload option behind
      `has({ feature: 'custom_thumbnail' })` (or `<Protect>`). Free users see AI-thumbnail only.
- [ ] Free users attempting upload get an upgrade nudge → `/billing`.
      (Backend already rejects this in Billing #1 — UI is UX, not security.)

## Demo script (acceptance via manual verification)
- [ ] As a fresh Free user: create 3 podcasts successfully; the 4th shows the upgrade wall.
- [ ] Click Upgrade → Clerk checkout → become Pro → return → Create works, no counter, badge shows.
- [ ] Custom thumbnail upload is available as Pro, blocked as Free.
- [ ] Cancel Pro → badge gone, existing custom thumbnails intact, generation gate re-applies.

## Out of scope
- Backend gate/counter/webhook (Billing #1).
- Component/route automated tests (per PRD).
