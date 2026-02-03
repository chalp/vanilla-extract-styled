import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // Ensure .css.ts files are transformed by Vite's plugin pipeline
    transformMode: {
      web: [/\.css\.ts$/],
    },
    // Inline these packages so they are transformed together with the tests
    deps: {
      inline: ['@vanilla-extract/recipes', '@vanilla-extract/css'],
    },
  },
});
