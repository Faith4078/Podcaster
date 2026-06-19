# 04 — Failure + retry

**Triage:** ready-for-agent

## What to build

Make the generation pipeline recoverable. When a step fails, the podcast lands in a `failed`
state that records which step failed and the error, keeps any partial results already
persisted, and offers a Retry that resumes from the failed step rather than redoing completed
work.

- On hard failure at any step, leave the doc in `failed` with the failed step + error text.
- Partial results persist (e.g. the script is stored before audio starts), so retry does not
  re-run completed steps.
- Failure-state UI on the detail page with a clear message and a Retry action.

## Acceptance criteria

- [ ] An injected failure at a given step leaves the podcast in `failed` recording that step and error
- [ ] Earlier partial results remain persisted after a failure
- [ ] Retry resumes from the failed step and does not re-run completed steps (verified via convex-test)
- [ ] Detail page shows the failure state and a working Retry action

## Blocked by

- 02 — Walking skeleton: create → generate → playable
