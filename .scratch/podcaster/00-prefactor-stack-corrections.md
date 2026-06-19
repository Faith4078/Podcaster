# 00 — Prefactor: stack corrections

**Triage:** ready-for-agent

## What to build

Pre-feature stack corrections so the rest of the work has a foundation. No user-facing
feature — this is prefactoring and must land before any other slice.

- Add **Convex** to the existing project: manual install of `convex` + the TanStack Start /
  React Query bindings, `npx convex dev` to initialise, and wire the Convex provider into
  `__root.tsx` (alongside the existing Query/Clerk providers).
- Replace **`@clerk/clerk-react` with `@clerk/tanstack-react-start`** so `auth()` is available
  server-side in route loaders, server functions, and Convex integration.
- **Lock every `latest` TanStack dependency** in `package.json` to its exact resolved version
  (TanStack Start is RC; `latest` risks silent breaking upgrades).
- Update `AGENTS.md` to reflect the new Clerk package and the added Convex integration.

## Acceptance criteria

- [ ] App boots with Convex wired; a trivial Convex query renders in a route
- [ ] Clerk is `@clerk/tanstack-react-start`; server-side `auth()` works in a loader/server function
- [ ] No `latest` version specifiers remain in `package.json`
- [ ] `AGENTS.md` lists `@clerk/tanstack-react-start` and the Convex integration

## Blocked by

None - can start immediately.
