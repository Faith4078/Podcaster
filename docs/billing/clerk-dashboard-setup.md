# Clerk Billing — dashboard setup guide

What to create in the Clerk dashboard so the **already-implemented** billing code works.
Path: **Clerk Dashboard → Subscriptions / Billing**.

> ⚠️ **The slugs below are not cosmetic — they must match the code exactly.**
> The backend gate, webhook, and UI all key off these literal strings:
> - Pro plan slug → **`pro`** (`convex/http.ts` `PRO_PLAN_SLUG`, `has({ plan: 'pro' })`)
> - Pro feature slug → **`custom_thumbnail`** (`has({ feature: 'custom_thumbnail' })`, server enforcement in `convex/podcasts.ts`)
>
> If you name them differently in the dashboard, either rename here to match the code,
> or update those two constants in the code.

---

## Tier 1 — Free

> ⚠️ **Do NOT create a paid plan for Free.** Clerk Billing runs on Stripe, which can't
> charge $0, so the dashboard enforces a **$1 minimum** on any plan you create. A free
> tier is not a "$0 plan" — it's the **absence of a paid subscription**. Clerk treats any
> user without a paid plan as Free automatically, and the code already relies on this:
> it only checks `has({ plan: 'pro' })` and treats everyone else as Free (it never looks
> up a `free` slug). So **leave Free alone** — don't create it, don't price it. If Clerk
> shows a built-in default/free plan, leave it as-is. The `<PricingTable />` still shows a
> Free option next to Pro.

What "Free" effectively includes (no setup needed — this is just the un-upgraded state):
- ✅ **3 AI podcast generations** (lifetime — enforced server-side at 3 successful generations)
- ✅ AI-generated thumbnails
- ✅ Full library: play, discover, and intent search
- ❌ Custom thumbnail upload
- ❌ Pro creator badge

> Do **not** attach the `custom_thumbnail` feature to this tier. Its absence is what
> gates custom uploads for Free users.

---

## Tier 2 — Pro

The paid tier. An active subscription here flips the user's `plan` to `pro` (via webhook),
which removes the generation gate, unlocks custom thumbnails, and shows the Pro badge.

| Field | Value |
|---|---|
| **Name** | Pro |
| **Slug** | **`pro`** ← must be exactly this |
| **Price** | e.g. **$9 / month** (your choice — set monthly, optionally add an annual price) |
| **Description (shown on pricing table)** | Unlimited podcasts and custom artwork for serious creators. |

**Features to list on this tier:**
- ✅ **Unlimited AI podcast generations** (no quota)
- ✅ **Custom thumbnail upload** — attach the `custom_thumbnail` feature (see below)
- ✅ **Pro creator badge** on your profile and podcasts
- ✅ Everything in Free

### Required feature on the Pro plan

In **Clerk → Features**, create one feature and attach it to the **Pro** plan:

| Field | Value |
|---|---|
| **Name** | Custom thumbnail upload |
| **Slug** | **`custom_thumbnail`** ← must be exactly this |
| **Attached to** | Pro plan only |

This is what `has({ feature: 'custom_thumbnail' })` (UI) and the `requireProUser` check
(server) gate on. UI gating alone isn't security — the backend rejects Free uploads too.

---

## Two more things (so the whole flow works end-to-end)

These aren't tiers, but the billing feature is dead without them:

### 1. JWT template named `convex`
**Clerk → Configure → JWT Templates → New → Convex.** Required so the app can prove the
signed-in user's identity to the Convex backend (the generation gate calls
`ctx.auth.getUserIdentity()`). Without it, publishing fails with `UNAUTHENTICATED`.

### 2. Subscription webhook events → existing `/clerk-webhook` endpoint
The plan only reaches the database via the Clerk webhook. Make sure the billing
**subscription events are delivered** to the same `/clerk-webhook` endpoint that already
handles `user.created`/`user.updated`. The code currently listens for:

```
subscription.created      subscriptionItem.created
subscription.updated      subscriptionItem.updated
subscription.active        subscriptionItem.active
```

> ⚠️ **Verify the real event names** Clerk actually sends under
> **Webhooks → Message attempts** after a test subscription. If they differ, update the
> `SUBSCRIPTION_EVENT_TYPES` set in `convex/http.ts` (one place). Likewise confirm the
> active-Pro detection reads the `pro` plan slug from the real payload shape.

---

## Quick checklist

- [ ] Free — do NOT create a paid plan (it's the default no-subscription state)
- [ ] Pro plan — slug **`pro`**, priced ($1+ min), with the `custom_thumbnail` feature attached
- [ ] Feature **`custom_thumbnail`** created and attached to Pro only
- [ ] JWT template **`convex`** created
- [ ] Subscription webhook events delivered to `/clerk-webhook` (names verified)
