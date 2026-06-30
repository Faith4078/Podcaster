# PRD: Podcaster

**Status:** Ready for implementation
**Date:** 2026-06-19
**Source of truth for decisions:** `design-decisions.md` (this PRD elaborates it into stories,
implementation, and testing decisions)

---

## Problem Statement

People who want to publish a podcast need recording equipment, a co-host, editing skills, and
cover art — a high barrier just to get an idea heard. People who want to listen want a familiar,
Spotify-style way
to browse, search, and stream shows without friction.

As a creator, I have an idea for an episode but no studio, no second voice, and no designer. As a
listener, I want to discover and play shows the way I already do in a music app, and I don't want
to sign up just to look around.

## Solution

Podcaster is an AI-powered podcast platform. A creator types a **topic prompt**, picks **two
voices**, and the platform generates a **two-host dialogue script**, renders it as **multi-speaker
audio**, generates **cover art**, and publishes a playable episode whose script doubles as the
displayed transcript. Listeners get a Spotify-style experience: public browsing of Trending /
Latest / Popular feeds, semantic search with category filters, a podcast detail page with
playback and transcript, "similar podcasts" and "fans also like" recommendations, a creator
profile, a top-podcasters leaderboard, and a persistent global player that keeps playing across
navigation.

Generation runs as a **background job** so the creator is never blocked on a slow request: the
episode appears immediately in a `generating` state and fills itself in live as each step
completes.

## User Stories

### Discovery & browsing (public)

1. As a visitor, I want to browse the Home dashboard without signing in, so that I can evaluate
   the app instantly.
2. As a listener, I want a **Trending** feed of recently published, actively-played shows, so that
   I can see what's hot right now.
3. As a listener, I want a **Latest** feed ordered by publish time, so that I can find brand-new
   episodes.
4. As a listener, I want a **Popular** feed ordered by all-time listens, so that I can find
   established favorites.
5. As a listener, I want to open a podcast detail page, so that I can read its description and
   transcript before or while listening.
6. As a listener, I want to see "similar podcasts" on a detail page, so that I can find related
   content.
7. As a listener, I want a "Fans Also Like" carousel, so that I can discover adjacent shows.
8. As a listener, I want a "Top Podcasters" leaderboard ranked by number of published podcasts,
   so that I can find prolific creators.
9. As a listener, I want author name and avatar shown on every podcast card, so that I know who
   made each show.

### Search (Discover, public)

10. As a listener, I want to search by meaning (semantic search), so that I find relevant shows
    even when my words don't exactly match the title.
11. As a listener, I want to filter by category, so that I can narrow what I'm browsing.
12. As a listener, I want my category selection to also narrow my search results, so that I can
    search within a topic.
13. As a listener, I want to browse a category with no search query, so that I can explore a
    topic from scratch.
14. As a listener, I want a clear empty state when a search returns nothing, so that I'm not
    confused by a blank page.

### Playback (public)

15. As a listener, I want a persistent global player that keeps playing as I navigate, so that
    audio doesn't restart when I change pages.
16. As a listener, I want to play, pause, scrub, and adjust volume, so that I control playback.
17. As a listener, I want my play to count toward a podcast's listener count, so that popularity
    reflects real listening (counts on every play, including anonymous).
18. As a listener, I want to read a speaker-labeled transcript while listening, so that I can
    follow the two-host dialogue.

### Authentication

19. As a user, I want to sign up / sign in with Google, GitHub, or email, so that I can create
    and manage content.
20. As a visitor, I want creation and management surfaces to prompt me to sign in, so that it's
    clear what requires an account.
21. As a returning creator, I want my Clerk identity (name, avatar) reflected across the app, so
    that my authored content shows my profile.

### Creating a podcast (gated)

22. As a creator, I want to enter a title, category, and description, so that my episode has
    metadata.
23. As a creator, I want to type a topic prompt, so that the AI can generate the episode for me.
24. As a creator, I want to pick a voice for each of the two speakers, so that I control how the
    episode sounds.
25. As a creator, I want the AI to write a two-host dialogue from my prompt, so that I get a
    conversational episode without writing a script.
26. As a creator, I want the dialogue rendered as multi-speaker audio using my chosen voices, so
    that the two hosts sound distinct.
27. As a creator, I want the generated script stored as the episode transcript, so that listeners
    can read along without a separate transcription step.
28. As a creator, I want to either generate cover art from a prompt or upload my own image, so
    that I control the thumbnail.
29. As a creator, when I submit, I want to be taken to my new episode immediately in a
    "generating" state, so that I can watch it come together.
30. As a creator, I want to see which generation step is currently running, so that I understand
    progress.
31. As a creator, when generation fails, I want a clear failure state with a Retry action, so
    that I can recover without starting over.
32. As a creator, when I retry, I want generation to resume from the failed step rather than
    redo completed work, so that I don't pay for or wait on work already done.
33. As a creator, I want my published episode to appear on my profile, so that my catalog grows.

### Managing podcasts (gated)

34. As a creator, I want to edit my own podcast via a pre-filled form, so that I can fix or
    improve it.
35. As a creator, when I change only the description/title/category, I want the audio left
    untouched, so that a small edit doesn't re-render the whole episode.
36. As a creator, when I change the prompt, I want the script and audio re-generated, so that the
    episode reflects my new intent.
37. As a creator, when I change a voice, I want only the audio re-rendered, so that the same
    script gets a new voice efficiently.
38. As a creator, when I change the thumbnail prompt, I want only the image re-generated.
39. As a creator, I want my podcast re-embedded whenever its title, description, or transcript
    changes, so that search stays accurate.
40. As a creator, I want to delete my own podcast, so that I can remove content.
41. As a creator, I want edit/delete to apply only to my own podcasts, so that others can't
    modify my content.

### Profile

42. As a creator, I want a profile page showing my listener count and a grid of my podcasts, so
    that I can see my reach.
43. As a creator, I want an empty state on my profile before I publish anything, so that I know
    what to do next.

## Implementation Decisions

### Stack corrections (pre-feature)

- **Add Convex** to the existing project (manual install + provider wiring; not re-scaffolded).
- **Replace `@clerk/clerk-react` with `@clerk/tanstack-react-start`** for server-side `auth()` in
  loaders, server functions, and Convex integration. `AGENTS.md` must be updated accordingly.
- **Lock all `latest` TanStack dependencies** to exact resolved versions (RC stability).

### AI provider — Gemini only (`@google/genai`)

- Script generation: Gemini text model expands the creator's prompt into a **two-speaker
  dialogue** of fixed target length (~600–900 words ≈ 3–5 min), output as **speaker-labeled
  turns** using the two chosen speaker names. Length is fixed by the system prompt; there is no
  length control in the UI.
- Audio: `gemini-2.5-flash-preview-tts` multi-speaker mode, **capped at two voices**, using the
  creator's per-speaker voice selection.
- Thumbnail: **Imagen** for the AI path; custom upload for the manual path; standardized at
  1024×1024.
- Embeddings: `text-embedding-004` at **768 dimensions**; input is title + description +
  transcript, with the transcript truncated to fit the 2048-token cap.
- **No Whisper / no custom audio upload** — the transcript is always the generated script.

### Create flow — prompt-driven, background job

- Submit creates the podcast document immediately in `generating` status, then a **Convex action**
  orchestrates the pipeline (script → audio → thumbnail → upload → embed).
- The creator is redirected to the new podcast's detail page in `generating` state; **Convex
  reactivity** flips it to `ready` and fills in assets live (no polling).
- **Granular status state machine** (encodes the failure/retry decisions precisely):

  ```
  generating_script ──ok──▶ generating_audio ──ok──▶ generating_thumbnail ──ok──▶ ready
        │                         │                          │
       fail                      fail                       fail
        ▼                         ▼                          ▼
      failed (records failed step + error; Retry resumes from that step)
  ```

  Partial results are persisted as each step completes (e.g. the script is stored before audio
  starts), so **Retry resumes from the failed step** rather than re-running completed steps.

- Custom thumbnail upload bypasses the action entirely (direct upload to Convex storage).

### Edit flow — diff-based re-generation

Compare changed inputs and re-run only affected steps:

- prompt changed → re-run script + audio (+ re-embed)
- voice changed (same prompt) → re-render audio only
- thumbnail prompt changed → re-generate image only
- title/description/category changed → update fields; **re-embed** whenever title, description, or
  transcript changes

### Data model (Convex)

- **`podcasts`**: title, description, category, transcript (speaker-labeled turns), audio storage
  id, thumbnail storage id, per-speaker voice mapping, author reference (Convex user),
  listenerCount, embedding, status, failedStep/error.
- **Vector index** on the embedding: **768-dim**, with `filterFields: [category]` so semantic
  search can be narrowed by category in a single query.
- **`users`**: synced from Clerk via **webhook** (upsert id, name, avatar on sign-up/update);
  local-dev fallback upserts the current user on first authenticated load. Podcasts reference the
  Convex user so author displays and the leaderboard are reactive joins.
- **Categories** are a fixed enum (also the TS union type):
  `Technology · Business · Comedy · Education · News · Health · Arts · Sports`.
- **Listener count** increments on every play (including anonymous).
- **File storage**: Convex file storage for audio + images; fall back to Cloudflare R2 + Worker
  only if audio range-streaming misbehaves.

### Feeds, search, recommendations

- **Latest** = by creation time; **Popular** = by all-time listener count; **Trending** =
  podcasts created in the last 7 days ranked by listener count (cheap proxy — no plays table).
- **Search** runs in a **Convex action** (because `vectorSearch` is action-only): embed the query
  → vector search → optional category narrowing via `filterFields`. Empty query → reactive
  category browse. Search results are therefore not live-reactive (feeds remain reactive).
- **Similar podcasts** and **Fans Also Like** = vector similarity to the current podcast's
  embedding; on pages with no current podcast, show a trending/varied set.
- **Top Podcasters** = ranked by number of published podcasts.

### Frontend

- **Auth boundary**: Home, Discover, detail/playback are public; an `_authenticated` layout gates
  Create, My Profile, and Edit/Delete (redirects to Clerk).
- **Persistent player**: the audio element is mounted once at the root layout and never unmounts;
  player state lives in a **Zustand** store with selective subscriptions; **single-track
  replacement, no queue**.

### Secrets / deployment

- `GEMINI_API_KEY` lives in **Convex's environment** (the action makes the calls), not just
  `.env.local`.
- `VITE_CLERK_PUBLISHABLE_KEY` is client-side; Clerk secret + webhook signing secret in the
  server/Convex environment.
- Deployment: Vercel (app) + Convex cloud; the background-job model removes serverless-timeout
  risk for generation.

## Testing Decisions

**What makes a good test here:** assert _external behavior_ observable at a module boundary —
status outcomes, which steps ran, ranking/order of results, access control — never internal call
sequencing or private shape. Tests must not call real Gemini/Imagen endpoints.

### Seam 1 (primary): the Convex function layer, via `convex-test`

The risk-dense logic is in the backend, so testing concentrates there. The enabling architectural
decision: **the Gemini/Imagen client is injected into the generation action at a single boundary**
(not imported directly inside it), so tests substitute a fake returning canned
script/audio/image/embedding values. Behaviors to cover:

- Generation pipeline: a successful run lands in `ready` with audio, thumbnail, transcript, and
  embedding populated.
- Failure: an injected failure at a given step leaves the podcast in `failed` recording that step;
  earlier partial results remain persisted.
- Retry resumes from the failed step and does not re-run completed steps.
- Diff-based edit: each kind of input change triggers exactly the expected re-generation
  (prompt → script+audio+embed; voice → audio; thumbnail prompt → image; metadata → fields+embed).
- Feed ranking: Trending/Popular/Latest return the expected ordering for a seeded set, including
  the Trending 7-day window boundary.
- Search: a query returns embedding-ranked results; a category narrows them; empty query yields
  category browse; no-match yields an empty result.
- Access control: edit/delete succeed only for the owning user.

### Seam 2 (optional, small): the Zustand player store

Pure state logic tested directly (no DOM): load track, play/pause toggling, progress updates,
replacing the current track. Fast and deterministic.

### Prior art

The repo currently has **no tests** (Vitest + Testing Library are configured). These are the first
tests; `convex-test` is the standard harness for Convex backends and should be established as the
project's pattern for backend behavior. Component/route tests are intentionally not added (see Out
of Scope); the player store is the one piece of frontend logic worth a unit test.

## Out of Scope

- Multi-speaker beyond two voices; a solo (single-voice) mode.
- A real plays/events table for momentum-based Trending (MVP uses the recency proxy).
- Collaborative-filtering "Fans Also Like" (MVP reuses vector similarity).
- Custom audio upload + Whisper transcription.
- Comments and ratings; follow/subscribe; push notifications; creator analytics dashboard; native
  mobile apps.
- Component- and route-level UI tests (forms, route shells, the `<audio>` element) — verified
  manually/in demo rather than with brittle tests.

## Further Notes

- **Build order:** implement the AI generation loop end-to-end first (prompt → script → audio →
  thumbnail → playable episode) before feeds/UI polish — the brief's primary risk is a
  half-finished demo.
- **Demo readiness (hybrid seed):** fully generate ~5–6 "hero" podcasts with real audio you'd
  actually play, plus ~15 metadata + real-embedding entries so semantic search, filters, and
  recommendations have enough varied volume to look real. Prepare semantic-search demo queries
  that show meaning-based matching beating keyword matching.
- This PRD supersedes the OpenAI-stack and verbatim-script assumptions in `client-brief.md`.

---

## Billing & Subscriptions (Pro plan)

> Added 2026-06-24. Not in the original brief (which scoped costs to ~zero). This is a
> **portfolio showcase** of a subscription-billing integration, structured as a cost-control
> gate on the genuinely-expensive operation (AI generation). Goal: a clean, demoable upgrade
> lifecycle a reviewer can follow in under a minute — not real revenue infrastructure.

### Product shape

- **Two tiers: Free and Pro.** Pricing table is designed to scale to more tiers but only two
  are built.
- **Free** = up to **3 successful generations (lifetime)**, AI-generated thumbnail only, no badge.
- **Pro** = unlimited generations, **custom thumbnail upload**, and a **"Pro" creator badge**.
- The paywall gates **podcast generation** (the Gemini script → embedding → audio → thumbnail
  pipeline), the one operation with real per-use cost.

### Provider — Clerk Billing

- Use **Clerk Billing** (native plans/features in the Clerk dashboard, Stripe as processor).
  Reuses the existing Clerk identity stack; primitives are `<PricingTable />`, `has({ plan })`,
  and `<Protect>`.
- Plans/features are configured **in the Clerk dashboard** (prerequisite, not code): a `pro`
  plan and a `custom_thumbnail` feature.

### How the Convex backend learns the plan (the one real gotcha — settled)

The generation gate runs inside a **Convex action**, which sees identity via
`ctx.auth.getUserIdentity()`. **Clerk Billing's plan claims (`pla`/`fea`) are session-tied and
cannot be emitted into a custom JWT template** — and Convex *requires* a custom template named
`convex`. Verified against current Clerk + Convex docs (2026). Therefore the plan **cannot** ride
directly into `getUserIdentity()`.

**Decision: mirror the plan onto the Convex `users` doc via the existing Clerk webhook**
(`convex/http.ts` already handles `user.created`/`updated`). Extend it to handle Clerk Billing
subscription events and write `plan` onto the user doc. The gate then reads `plan` +
`generationCount` from **one place** (the DB), fully inside Convex. Optionally layer client-side
`has({ plan })` for instant UI reflection, but the **DB check is authoritative**.

### Data model

- **`users`**: add `plan: v.optional(v.union(v.literal('free'), v.literal('pro')))`
  (absent ⇒ free) and `generationCount: v.optional(v.number())` (absent ⇒ 0).
- **`podcasts`**: add `countedTowardQuota: v.optional(v.boolean())` — marks that this podcast has
  already consumed a generation slot, so the counter is idempotent (see below).

### Enforcement — backend-authoritative, frontend reflects

- **Gate (check-at-start):** at the top of the public `generatePodcast` action, resolve the user
  from `ctx.auth.getUserIdentity()` (**not** a client-supplied `authorId`), and if
  `plan !== 'pro'` and `generationCount >= 3`, throw a typed error. The UI mirrors this (shows
  "N of 3 used" and swaps the submit button for an Upgrade CTA at the limit) but never relies on
  the frontend for the gate.
- **Count (count-at-success, idempotent per podcast):** `runPipeline` reaches `ready` in exactly
  one place and is shared by three callers — `generatePodcast` (fresh), `retryGeneration`
  (retry), and `editAndRegenerate` (edit). At the `ready` step, increment the author's
  `generationCount` **only if `countedTowardQuota` is not already set**, then set it. This single
  rule yields the correct behavior for all three paths:
  - fresh success → counts once
  - failure → never reaches `ready` → costs nothing; a later **retry** that succeeds counts once
  - **edit/regenerate** of an already-ready podcast → already counted → never double-charged
- **Known accepted limitation:** because the gate reads `generationCount` (successful only) and
  the increment lands on success, a user could *start* more than 3 generations concurrently before
  any finishes. Acceptable for a single-user demo; not worth closing for a showcase.

### Pro-only features

- **Custom thumbnail upload:** gated by the `custom_thumbnail` Clerk feature. Free users get the
  AI thumbnail path only; the upload mutation **also** enforces the plan server-side (read from the
  `users` doc), not just the UI.
- **"Pro" badge:** pure UI via `has({ plan: 'pro' })` on the profile and podcast cards. Disappears
  automatically on downgrade.

### Downgrade / cancel — "grandfather what's made, gate what's new"

- Existing content is **never touched** (podcasts keep custom thumbnails forever).
- The badge disappears immediately (live plan check).
- The generation gate simply re-applies; a former Pro user is almost always already ≥3 successful
  generations, so they can't make new free ones — the correct "you're out of free generations"
  outcome. **No reset, no special-case code.**

### Upgrade surfaces

- A canonical **`/billing` route** (in the sidebar) rendering Clerk's `<PricingTable />`, also
  hosting the manage-subscription / cancel link.
- An **inline wall on Create**: at the limit, the submit control becomes an "Upgrade to Pro" CTA
  with "You've used all 3 free generations," deep-linking to `/billing`. Clerk's hosted checkout
  handles the payment overlay.

### Testing (extends Seam 1 — `convex-test`)

Because the plan is mirrored onto the `users` doc, tests need **no Clerk/Stripe mocking** — set
`plan` and `generationCount` on the seeded user and assert backend behavior:

- Free user at `generationCount = 3` is rejected by `generatePodcast`; under 3 succeeds.
- `generationCount` increments **only** when a podcast first reaches `ready`.
- A failed generation does **not** increment.
- A retry of a previously-failed podcast counts **once**; an edit/regenerate of an already-ready
  podcast does **not** increment.
- A Pro user is never gated.
- The custom-thumbnail upload mutation rejects a Free user.

UI surfaces (pricing table, wall, badge) are verified manually/in demo, consistent with the
existing Out of Scope stance on component/route tests.
