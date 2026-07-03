# Podcaster

Describe a topic, get a full podcast episode back — script, narrated audio, and
cover art generated end to end by AI and instantly discoverable through
hybrid (keyword + semantic) search.

## What it does

1. A user gives a topic, category, and voice.
2. A background pipeline generates a transcript, converts it to speech,
   creates a cover image, and embeds the content for search all via Google
   Gemini.
3. Convex's reactive queries push the UI from "generating" to "ready"
   automatically no polling, no manual sockets.
4. Podcasts become searchable by literal keyword match **and** by meaning
   (vector similarity on the transcript's embedding), fused into one ranked
   list.

## Stack

| Layer          | Choice                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Frontend       | [TanStack Start](https://tanstack.com/start) (React 19, SSR)            |
| Backend        | [Convex](https://convex.dev) — reactive database + serverless functions |
| AI             | Google Gemini — script generation, TTS, image generation, embeddings    |
| Auth & billing | [Clerk](https://clerk.com) — Free / Pro tiers, server-enforced quotas   |
| Styling        | Tailwind CSS                                                            |
| Deployment     | Vercel (SSR)                                                            |
| Tests          | Vitest + `convex-test` (in-memory Convex backend)                       |

## Getting started

```bash
npm install
npm run dev       # runs the Convex dev deployment + Vite dev server together
```

Requires a `.env.local` with:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_ISSUER_DOMAIN=...
CONVEX_DEPLOYMENT=dev:...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
GEMINI_API_KEY=...
```

`GEMINI_API_KEY` also needs to be set in the Convex deployment's own
environment (`npx convex env set GEMINI_API_KEY ...`), since generation and
search run server-side as Convex actions.

## Scripts

```bash
npm run dev          # Convex dev + Vite dev, concurrently
npm run build         # production build
npm run test          # run the Vitest suite
npm run check          # Biome lint + format
```

## Project structure

```
convex/
  schema.ts       # data model: users, podcasts, bookmarks, listens, rate limits
  podcasts.ts      # generation pipeline + search (keyword, semantic, hybrid)
  bookmarks.ts     # folders + saved podcasts, Free-tier caps
  rateLimit.ts     # token-bucket limiter for the public Gemini-backed endpoints
  http.ts          # Clerk billing webhook

src/
  routes/          # file-based routes (TanStack Router)
    _authenticated/ # routes that require sign-in (create, profile)
  components/       # UI components
  integrations/      # Clerk provider, TanStack Query setup

docs/                # design notes and PRD
```

## How search works

Search runs two independent passes and fuses the results:

- **Keyword** (`searchPodcasts`) — Convex full-text index over titles.
  Stop words and generic filler ("podcast", "about", "episode"...) are
  stripped from the query first so a search doesn't match on incidental
  shared words.
- **Semantic** (`semanticSearch`) — the query is embedded with Gemini and
  compared against each podcast's stored embedding via cosine similarity.
  Only matches within an adaptive margin of the top score survive, so a
  loosely-related result doesn't ride along with a strong one.
- **Hybrid** (`hybridSearch`) — both lists are merged with Reciprocal Rank
  Fusion: a result both methods agree on ranks above a result only one
  method found.

## Testing

```bash
npm run test
```

The suite runs against an in-memory Convex backend (`convex-test`) with the
Gemini HTTP calls stubbed, so it exercises real query/mutation/action logic
without network calls or a live deployment.
