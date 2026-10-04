import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths so the build also works from a GitHub Pages sub-path.
  base: './',
  plugins: [svelte(), tailwindcss()],
  server: {
    // `npm run dev` proxies /api to a local `wrangler dev` (port 8787).
    proxy: { '/api': 'http://localhost:8787' },
  },
});
