# 03 — Real Gemini generation + custom thumbnail upload

**Triage:** ready-for-agent

## What to build

Swap the fake AI client from slice 02 for the real `@google/genai` implementation behind the
same injected boundary, so the pipeline produces genuinely generated podcasts.

- **Script:** Gemini text model expands the prompt into a 2-speaker dialogue of fixed target
  length (~600–900 words ≈ 3–5 min), output as speaker-labeled turns using the two chosen
  speaker names. Length is fixed by the system prompt (no UI control).
- **Audio:** `gemini-2.5-flash-preview-tts` multi-speaker mode, capped at two voices, using the
  creator's per-speaker voice selection.
- **Thumbnail:** Imagen for the AI path, standardized at 1024×1024.
- **Embedding:** `text-embedding-004` at 768 dimensions; input is title + description +
  transcript, transcript truncated to fit the 2048-token cap.
- **Transcript = the generated script** (no separate transcription step).
- **Custom thumbnail upload** bypasses the action entirely (direct upload to Convex storage).
- `GEMINI_API_KEY` lives in Convex's environment variables (the action makes the calls).

## Acceptance criteria

- [ ] A real submission produces a playable episode: generated 2-speaker script, multi-speaker audio in the chosen voices, Imagen thumbnail, 768-dim embedding
- [ ] Transcript stored equals the generated script
- [ ] Custom-upload path stores the image directly to Convex storage without invoking the AI action
- [ ] `GEMINI_API_KEY` is read from Convex env, not just `.env.local`
- [ ] Existing convex-test suite still passes against the injected fake (no real endpoints in tests)

## Blocked by

- 02 — Walking skeleton: create → generate → playable
