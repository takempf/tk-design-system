import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const src = fileURLToPath(new URL('./src', import.meta.url));

// The playground consumes the library exactly as an app would, by package name.
export default defineConfig({
  // Relative asset URLs, so the build works from any subpath (GitHub Pages
  // serves project sites under /<repo>/). Routing is by hash, so this is safe.
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^tk-design-system$/, replacement: `${src}/index.ts` },
      { find: /^tk-design-system\/(.+)$/, replacement: `${src}/$1` },
    ],
  },
  server: { port: 5180 },
  build: { outDir: 'dist-playground', chunkSizeWarningLimit: 1500 },
});
