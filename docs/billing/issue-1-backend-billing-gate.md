# Billing #1 — Backend: plan sync, generation gate, and quota counter

**Depends on:** Clerk dashboard config (prerequisite, below)
**Blocks:** Billing #2 (frontend surfaces)
**Seam:** Convex function layer (testable via `convex-test`)

## Summary

Add the server-authoritative half of the Free/Pro billing showcase: mirror the Clerk Billing
plan onto the Convex `users` doc, gate AI generation for Free users at **3 lifetime successful
generations**, and enforce the Pro-only custom-thumbnail upload. No revenue infra — this is a
portfolio showcase structured as a cost gate. See `podcastr-prd.md` → "Billing & Subscriptions".

## Prerequisite — Clerk dashboard (manual, not code)

- [ ] Enable Clerk Billing.
- [ ] Create a **`pro`** plan.
- [ ] Create a **`custom_thumbnail`** feature attached to `pro`.

## Why the plan lives on the Convex `users` doc

The gate runs in a Convex **action**, which only sees `ctx.auth.getUserIdentity()`. Clerk Billing
plan claims (`pla`/`fea`) are **session-tied and cannot be put in a custom JWT template**, and
Convex requires the custom `convex` template — verified against current Clerk/Convex docs. So the
plan can't reach `getUserIdentity()` directly. We mirror it onto the DB via the existing webhook.

## Tasks

### Schema (`convex/schema.ts`)
- [ ] `users`: add `plan: v.optional(v.union(v.literal('free'), v.literal('pro')))` (absent ⇒ free).
- [ ] `users`: add `generationCount: v.optional(v.number())` (absent ⇒ 0).
- [ ] `podcasts`: add `countedTowardQuota: v.optional(v.boolean())` (idempotent counter marker).

### Webhook (`convex/http.ts`)
- [ ] Handle Clerk Billing subscription events and write `plan` onto the matching `users` doc
      (`'pro'` while an active Pro subscription exists, else `'free'`).
      ⚠️ Confirm exact event names in the Clerk dashboard (e.g. `subscription.updated` /
      `subscriptionItem.*`) — don't assume.
- [ ] Keep the existing `user.created`/`updated` handling intact.

### Gate — check-at-start (`convex/podcasts.ts`, `generatePodcast` action)
- [ ] At the top of `generatePodcast`, resolve the user from `ctx.auth.getUserIdentity()` →
      `users` doc by `clerkId` (**not** a client-supplied `authorId`).
- [ ] If `plan !== 'pro'` && `(generationCount ?? 0) >= 3`, throw a typed error
      (e.g. `ConvexError({ code: 'QUOTA_EXCEEDED' })`) so the UI can branch on it.
- [ ] Do **not** gate `retryGeneration` or `editAndRegenerate` (retries/edits are free).

### Counter — count-at-success, idempotent (`runPipeline`, the `ready` step)
- [ ] At the single point where status flips to `ready` (currently `podcasts.ts:542`):
      load the podcast; if `!countedTowardQuota`, increment the author's `generationCount` and
      set `countedTowardQuota = true` (one mutation).
- [ ] This is shared by `generatePodcast` / `retryGeneration` / `editAndRegenerate` and must
      behave: fresh success counts once; failure costs nothing; retry-after-failure counts once;
      edit/regenerate of an already-ready podcast never re-counts.

### Pro feature enforcement — custom thumbnail upload
- [ ] The custom-thumbnail upload mutation must reject a Free user (read `plan` from the `users`
      doc server-side). UI gating alone is insufficient.

## Tests (`convex-test`) — required
- [ ] Free user at `generationCount = 3` → `generatePodcast` rejected; under 3 → succeeds.
- [ ] `generationCount` increments **only** on first `ready`.
- [ ] Failed generation → no increment.
- [ ] Retry of a previously-failed podcast → counts exactly once.
- [ ] Edit/regenerate of an already-ready podcast → no increment.
- [ ] Pro user → never gated.
- [ ] Custom-thumbnail upload mutation rejects a Free user.

## Out of scope (this issue)
- Pricing table, billing route, Create wall, Pro badge → Billing #2.
- Monthly resets, multiple paid tiers, refunds/dunning.

## Acceptance
- A Free seeded user is blocked at the 4th generation by the **backend**; a Pro user is not.
- Counter is idempotent across fresh/retry/edit paths.
- All `convex-test` cases above pass with no Clerk/Stripe mocking.

## Known accepted limitation
Concurrent starts before any generation finishes can exceed 3 (gate reads success-only count).
Acceptable for a single-user demo.
