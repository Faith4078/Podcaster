# Podcaster — Design Decisions

**Status:** Resolved via grilling session, 2026-06-19
**Supersedes:** conflicting guidance in `client-brief.md` and `AGENTS.md` where noted below.

This document is the source of truth for architecture and scope decisions. The original
`client-brief.md` assumed an OpenAI stack and a verbatim-script create flow; both have been
superseded (see AI stack and Create flow below).

---

## Pre-flight fixes (before any feature code)

- **Add Convex manually** — install `convex` + the TanStack Start / React Query bindings,
  run `npx convex dev` to init, wire the Convex provider into `__root.tsx`. (Not scaffolded
  from the official template; added to the existing project.)
- **Swap Clerk package** — `@clerk/clerk-react` → `@clerk/tanstack-react-start`. The current
  package is browser-only and cannot do server-side `auth()` in route loaders / server
  functions / Convex. Update `AGENTS.md`, which still lists `@clerk/clerk-react`.
- **Lock TanStack versions** — replace every `latest` in `package.json` with the exact
  resolved version (TanStack Start is RC; `latest` risks silent breaking upgrades).

---

## AI stack — all Gemini, one SDK (`@google/genai`)

| Concern     | Choice                                                                            |
|-------------|-----------------------------------------------------------------------------------|
| Script      | Gemini text model expands the creator's prompt into a **2-speaker dialogue**       |
| Audio       | `gemini-2.5-flash-preview-tts`, multi-speaker (**2-voice cap**), creator-chosen voices |
| Thumbnail   | **Imagen** (AI path) or custom upload — 1024×1024                                  |
| Embeddings  | `text-embedding-004`, **768-dim**                                                  |
| Whisper     | **Cut** — no custom audio upload path                                              |

- **Script length** is fixed by the system prompt (~600–900 words ≈ 3–5 min), output as
  speaker-labeled turns using the two chosen speaker names. No length selector in the UI.
- **Embedding input** = title + description + transcript; transcript truncated to fit the
  2048-token cap of `text-embedding-004`.
- **Transcript = the LLM-generated script** (the brief's "transcript = input script" no
  longer applies, because the create flow is prompt-driven, not verbatim).

---

## Create flow (prompt-driven, background job)

- **Form fields:** title, category, description, AI prompt, **voice picker (2 speakers)**,
  thumbnail toggle (AI-prompt field ↔ upload dropzone, max 1080×1080).
  - The voice picker is a **deliberate addition beyond the Figma**, which shows no voice UI.
- **Submit** creates the podcast row immediately in `generating` status, then a **Convex
  action** orchestrates the pipeline (script → audio → thumbnail → upload → embed).
- After submit, the creator is **redirected to the new podcast's detail page** in its
  `generating` state; Convex reactivity fills in audio/thumbnail live as steps complete.
- **Status lifecycle (granular):**
  `generating_script → generating_audio → generating_thumbnail → ready | failed`
  - Drives a step-by-step progress UI.
- **Failure handling:** keep partial results (store the script as soon as it's generated) so
  **Retry resumes from the failed step**. On hard failure, leave the row in `failed` with the
  error text and a Retry action.
- **Custom thumbnail upload** bypasses the action entirely (direct upload to Convex storage).

### Edit flow — diff-based re-generation

Only re-run the steps whose inputs changed:

- Prompt changed → re-run script + audio (+ re-embed).
- Voice changed (same prompt) → re-render audio only.
- Thumbnail prompt changed → re-generate image only.
- Title / description / category changed → update fields + **re-embed** (always, when any of
  title/description/transcript changes).

---

## Data model & backend

- **Storage:** Convex file storage for audio + images. Fall back to Cloudflare R2 + Worker
  only if audio range-streaming misbehaves.
- **`podcasts` document:** title, description, category, transcript/turns, audio storage ID,
  thumbnail storage ID, voice mapping, author (→ Convex user), listenerCount, embedding,
  status (+ error text).
- **Vector index:** 768-dim, `filterFields: [category]`.
- **`users` table:** synced from Clerk via **webhook** (upsert id, name, avatar on
  sign-up/update). Local-dev fallback: upsert current user on first authenticated load.
  Podcasts reference the Convex user so author displays / leaderboard are reactive joins.
- **Listener count:** increment on **every play**.
- **Categories (fixed enum, 8):**
  `Technology · Business · Comedy · Education · News · Health · Arts · Sports`.

---

## Consumption side

- **Home feeds:**
  - **Latest** — by creation time.
  - **Popular** — by all-time listener count.
  - **Trending** — podcasts created in the last 7 days, ranked by listener count (cheap proxy;
    no plays table in MVP).
- **Discover search:** semantic vector search via a **Convex action** when there's a query;
  selected category **narrows** the semantic results via the vector index `filterFields`;
  reactive category browse when the query is empty. Empty state when no matches.
  - Note: `vectorSearch` only runs in actions, so search results are **not live-reactive**
    (feeds still are).
- **Recommendations:** "Similar podcasts" (detail) and "Fans Also Like" (sidebar) both use
  **vector similarity**. On pages with no current podcast (e.g. Create), show a trending/varied set.
- **Top Podcasters leaderboard:** ranked by **podcast count** (per the Figma's "N Podcasts").
- **Persistent player:** audio element mounted **once in `__root.tsx`** (never unmounts);
  player state in a **Zustand** store with selective subscriptions; **single-track
  replacement, no queue**.

---

## Auth boundary

- **Public:** Home, Discover, podcast detail + playback (listener count still increments).
- **Gated** behind an `_authenticated` layout (redirects to Clerk): **Create, My Profile,
  Edit/Delete**.
- Rationale: a portfolio reviewer can explore the deployed app instantly without an account.

---

## Demo readiness

- **Hybrid seed:** ~5–6 fully-generated "hero" podcasts (real audio + thumbnail + embedding)
  that you'd actually play in a walkthrough, plus ~15 metadata + **real embedding** entries so
  semantic search, filters, and recommendations have enough varied volume to look real.
- Prepare semantic-search demo queries that show off meaning-based matching vs keyword.

---

## Deployment & secrets

- **Deployment:** Vercel (app) + Convex cloud. The background-job model means no Vercel
  timeout risk for AI generation.
- **`GEMINI_API_KEY` lives in Convex's environment variables** (dashboard), since the Convex
  action makes the Gemini/Imagen calls — not just `.env.local`.
- **`VITE_CLERK_PUBLISHABLE_KEY`** stays client-side; Clerk secret + webhook signing secret in
  the appropriate server/Convex env.

---

## Build order

1. **AI generation loop end-to-end first** (prompt → script → audio → thumbnail → playable
   podcast) before any feed/UI polish — per the brief's primary risk (a half-finished demo).
2. Then feeds, Discover/search, recommendations, profile, leaderboard.
3. Seed catalog and prepare demo queries last.

---

## Deferred / post-MVP

- Multi-speaker beyond 2 voices; solo (1-voice) mode toggle.
- Real plays table for momentum-based Trending.
- Collaborative-filtering "Fans Also Like."
- Custom audio upload + Whisper transcription.
- Comments, ratings, follow/subscribe, push notifications, analytics dashboard, native apps.
