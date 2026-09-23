import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The library build: ES modules per entry, one stylesheet, dependencies external.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        motion: 'src/motion/index.ts',
        scenery: 'src/scenery/index.ts',
        styles: 'src/styles.css',
      },
      formats: ['es'],
    },
    cssCodeSplit: true,
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\//, /^zustand($|\/)/],
    },
  },
});
