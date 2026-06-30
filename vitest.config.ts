import { defineConfig } from 'vitest/config'

// Convex backend tests (convex-test) run in the edge-runtime environment, which
// mirrors the Convex function runtime. Frontend/jsdom tests, if added later, can
// be split out with a separate project + environment.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    server: { deps: { inline: ['convex-test'] } },
    include: ['convex/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    // edge-runtime cold start + module transform can push the first vector-search
    // test past the 5s default.
    testTimeout: 20000,
  },
})
