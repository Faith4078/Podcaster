import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// On Windows, a lowercase drive letter in process.cwd() (e.g. `c:\...` from some
// shells) makes Vitest resolve test-file URLs with mismatched casing, so the
// vitest runtime gets instantiated twice inside the edge-runtime VM and every
// suite fails with "Vitest failed to find the runner" / 0 tests collected.
// Pin the project root to this file's directory with a normalized drive letter.
const projectRoot = fileURLToPath(new URL('.', import.meta.url)).replace(
  /^[a-z]:/,
  (drive) => drive.toUpperCase(),
)
if (process.platform === 'win32' && /^[a-z]:/.test(process.cwd())) {
  process.chdir(process.cwd()[0].toUpperCase() + process.cwd().slice(1))
}

// Convex backend tests (convex-test) run in the edge-runtime environment, which
// mirrors the Convex function runtime. Frontend/jsdom tests, if added later, can
// be split out with a separate project + environment.
export default defineConfig({
  root: projectRoot,
  test: {
    environment: 'edge-runtime',
    server: { deps: { inline: ['convex-test'] } },
    include: ['convex/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    // edge-runtime cold start + module transform can push the first vector-search
    // test past the 5s default.
    testTimeout: 20000,
  },
})
