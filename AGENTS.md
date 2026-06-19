<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

---

# podcaster — Project Context

## Scaffold command

```sh
npx @tanstack/cli@latest create podcaster --agent --add-ons clerk
```

Run in a scratch directory (`_podcaster_scratch/podcaster`) and merged into the main
`podcaster/` directory. The resulting structure is unchanged from the CLI output.

## Follow-up Intent commands

```sh
npx @tanstack/intent@latest install   # generated this AGENTS.md
npx @tanstack/intent@latest list      # 31 skills across 9 packages (see output below)
```

Intent skills available locally (as of scaffold):
- `@tanstack/react-start` — SSR, server functions, server components, Next.js migration
- `@tanstack/router-core` — routing, auth/guards, data loading, search params, SSR, type safety
- `@tanstack/devtools` / `@tanstack/devtools-event-client` / `@tanstack/devtools-vite` — devtools setup and plugins
- `@tanstack/start-client-core` — middleware, server functions, server routes, deployment, execution model
- `@tanstack/start-server-core` / `@tanstack/virtual-file-routes` — server runtime, programmatic routes

## Stack

| Layer        | Choice                                     |
|--------------|--------------------------------------------|
| Framework    | React 19                                   |
| Full-stack   | TanStack Start (`@tanstack/react-start`)   |
| Routing      | TanStack Router (file-based, `src/routes`) |
| Data fetching| TanStack Query (`@tanstack/react-query`)   |
| Auth         | Clerk (`@clerk/tanstack-react-start`)      |
| Styles       | Tailwind CSS v4                            |
| Linter/fmt   | Biome (`biome.json`, replaces ESLint/Prettier) |
| Build        | Vite 8 + `@tanstack/react-start/plugin/vite` |
| Type check   | TypeScript 6                               |
| Tests        | Vitest + Testing Library                   |

## Integrations

### Clerk (Authentication)
- Package: `@clerk/tanstack-react-start` (swapped from `@clerk/clerk-react`, which is
  browser-only — this package enables server-side `auth()` in loaders, server functions, and
  Convex integration).
- Provider: `src/integrations/clerk/provider.tsx` wraps the app in `<ClerkProvider>`
- Header user widget: `src/integrations/clerk/header-user.tsx`
- Demo route: `src/routes/demo/clerk.tsx`
- **Conditional rendering:** this package has no `<SignedIn>`/`<SignedOut>`. Use
  `<Show when="signed-in">` / `<Show when="signed-out">` instead.
- Required env var: `VITE_CLERK_PUBLISHABLE_KEY` (see `.env.local.example`)
- **Never** hardcode Clerk keys. Always read from `import.meta.env`.

### TanStack Query
- Provider + QueryClient: `src/integrations/query/provider.tsx`
- Mounted inside `<QueryProvider>` in `src/routes/__root.tsx`
- ReactQueryDevtools included (dev only, bottom-right)
- Demo route: `src/routes/demo/query.tsx`

### CodeRabbit (Code Review)
- Config: `.coderabbit.yaml` — path filters, path-specific review instructions, auto-review on `main` and `feat/**` branches
- **No runtime SDK** — CodeRabbit is a GitHub App integration only.
- Setup steps:
  1. Push this repo to GitHub.
  2. Install the CodeRabbit GitHub App: https://github.com/apps/coderabbit-ai
  3. Grant it access to this repository.
  4. Open a pull request — CodeRabbit will comment automatically based on `.coderabbit.yaml`.

## Environment variables

| Variable                    | Required | Where to get it                          |
|-----------------------------|----------|------------------------------------------|
| `VITE_CLERK_PUBLISHABLE_KEY`| Yes      | Clerk Dashboard → API Keys               |

Copy `.env.local.example` to `.env.local` and fill in real values. `.env.local` is gitignored.

## Scripts

```sh
npm run dev            # Vite dev server on :3000
npm run build          # Production build
npm run preview        # Preview production build
npm run generate-routes# tsr generate (file-based route tree)
npm run test           # Vitest
npm run format         # Biome format (write)
npm run lint           # Biome lint (write)
npm run check          # Biome check (format + lint, write)
```

## File structure

```
src/
  integrations/
    clerk/            # Clerk provider and header widget
    query/            # TanStack Query provider and QueryClient
  routes/
    __root.tsx        # Root document shell (providers, devtools)
    index.tsx         # Home page
    about.tsx         # About page
    demo/
      clerk.tsx       # Clerk auth demo
      query.tsx       # TanStack Query demo (episodes list)
  components/
    Header.tsx
    Footer.tsx
    ThemeToggle.tsx
  router.tsx          # createRouter factory
  styles.css          # Tailwind + CSS custom properties
AGENTS.md             # This file — project context for AI agents
biome.json            # Biome linter/formatter config
.coderabbit.yaml      # CodeRabbit review config
.env.local.example    # Env var template
```

## Key architectural decisions

- **Providers order in `__root.tsx`**: `QueryProvider` wraps `ClerkProvider` so query hooks
  are available inside auth-aware components if needed.
- **`src/routeTree.gen.ts` is auto-generated** — never edit by hand; run `npm run generate-routes`.
- **Biome replaces ESLint/Prettier** — no `.eslintrc` or `.prettierrc` should be added.
- **TanStack Intent skills first** — before adding new routes, loaders, or server functions,
  load the relevant skill (`router-core/data-loading`, `start-core/server-functions`, etc.).

## Known gotchas

- Clerk requires `VITE_CLERK_PUBLISHABLE_KEY` to be set or the app throws on boot.
- `src/routeTree.gen.ts` will be missing until first `npm run generate-routes` or `npm run dev`.
- Biome version pinned to `^2.5.0`; check schema URL in `biome.json` matches when upgrading.
- TanStack Start Vite plugin must be ordered after `devtools()` and before `viteReact()` in `vite.config.ts`.

## Next steps

1. Copy `.env.local.example` → `.env.local` and add your Clerk key.
2. Run `npm run dev` to start the dev server.
3. Push to GitHub and install the CodeRabbit GitHub App to enable PR reviews.
4. Add `_authenticated` layout route (`src/routes/_authenticated.tsx`) for protected pages.
5. Wire TanStack Query `queryOptions` into route loaders for SSR-friendly prefetching.
