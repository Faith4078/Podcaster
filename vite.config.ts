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
    nitro({ preset: 'vercel' }),
    viteReact(),
  ],
  ssr: {
    // Rolldown drops @clerk/react/internal imports when bundling Clerk for SSR.
    external: ['@clerk/tanstack-react-start', '@clerk/react', '@clerk/shared'],
  },
});

export default config;
