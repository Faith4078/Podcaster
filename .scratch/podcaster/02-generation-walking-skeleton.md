# 02 — Walking skeleton: create → generate → playable (fake AI client)

**Triage:** ready-for-agent

## What to build

The end-to-end spine of the product, with the AI provider stubbed. A creator fills the create
form, submits, and watches a podcast assemble itself live and play — using a **fake AI client**
that returns canned values. Real Gemini comes in slice 03.

- Create form: title, category (fixed 8-value enum), description, topic prompt, a **2-speaker
  voice picker**, and a thumbnail toggle (AI-prompt field ↔ upload dropzone).
- Submit creates a `podcasts` document immediately in `generating` status, then a **Convex
  action** orchestrates the pipeline (script → audio → thumbnail → upload → embed). The
  Gemini/Imagen client is **injected at a single boundary** (not imported inside the action) so
  tests and this slice can substitute a fake returning canned script/audio/image/embedding.
- Granular status state machine, persisting partial results as each step completes:

  ```
  generating_script ──ok──▶ generating_audio ──ok──▶ generating_thumbnail ──ok──▶ ready
        │                         │                          │
       fail                      fail                       fail
        ▼                         ▼                          ▼
      failed (records failed step + error)
  ```

- After submit, redirect to the new podcast's detail page in its `generating` state; **Convex
  reactivity** flips it to `ready` and fills in assets live (no polling). A step-by-step
  progress UI shows the current step.
- Persistent global player: the audio element is mounted once at the root layout and never
  unmounts; player state lives in a **Zustand** store with selective subscriptions;
  single-track replacement, no queue. Play/pause, scrub, volume.
- Detail page shows the speaker-labeled transcript.

## Acceptance criteria

- [ ] Submitting the create form creates a `generating` podcast and redirects to its detail page
- [ ] With the fake client, the doc advances through the status machine to `ready`, filling assets live via reactivity
- [ ] Audio plays in the persistent player and keeps playing across navigation
- [ ] Speaker-labeled transcript renders on the detail page
- [ ] `convex-test`: a successful run lands in `ready` with audio, thumbnail, transcript, and embedding populated
- [ ] Player store unit test (seam 2): load track, play/pause, progress, replace track

## Blocked by

- 01 — Auth boundary + Clerk→Convex user sync
