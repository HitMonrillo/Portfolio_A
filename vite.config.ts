import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// The portfolio itself is plain static HTML and passes through untouched.
// Only doom/ has a TypeScript entry point that needs bundling.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        doom: resolve(__dirname, 'doom/index.html'),
      },
    },
  },
});
