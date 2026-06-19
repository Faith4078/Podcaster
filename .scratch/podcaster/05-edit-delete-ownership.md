# 05 — Edit (diff-based) + delete + ownership

**Triage:** ready-for-agent

## What to build

Let creators manage their own podcasts, re-generating only what actually changed.

- A pre-filled edit form. On save, diff the changed inputs and re-run only affected steps:
  - prompt changed → re-run script + audio (+ re-embed)
  - voice changed (same prompt) → re-render audio only
  - thumbnail prompt changed → re-generate image only
  - title/description/category changed → update fields
  - **re-embed** whenever title, description, or transcript changes
- Delete a podcast.
- Edit and delete apply only to the owning user; others cannot modify or delete.

## Acceptance criteria

- [ ] Editing only metadata leaves audio untouched but re-embeds
- [ ] Changing the prompt re-runs script + audio and re-embeds
- [ ] Changing a voice re-renders audio only
- [ ] Changing the thumbnail prompt re-generates the image only
- [ ] Delete removes the podcast
- [ ] convex-test: each change kind triggers exactly the expected re-generation; edit/delete succeed only for the owner

## Blocked by

- 03 — Real Gemini generation + custom thumbnail upload
