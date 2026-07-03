import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // preset 'vercel' → build emits the Vercel Build Output at .vercel/output.
    // devServer.runner 'self' runs the nitro SSR environment in-process instead
    // of the vercel/node-worker child process. The child-process runners talk to
    // Vite over a named-pipe socket that dies on restart on Windows, producing
    // `Vite environment "nitro" is unavailable` (503). The in-process runner has
    // no socket, so dev is stable across restarts. Build is unaffected.
    nitro({ preset: 'vercel', devServer: { runner: 'self' } }),
    viteReact(),
  ],
  ssr: {
    // Rolldown drops @clerk/react/internal imports when bundling Clerk for SSR.
    external: ['@clerk/tanstack-react-start', '@clerk/react', '@clerk/shared'],
  },
});

export default config;
