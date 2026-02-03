import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';

const outDir = 'build';

export default defineConfig({
  build: {
    copyPublicDir: false,
    outDir,
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
    },
    ssr: true,
  },
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // for example, lint .ts & .tsx
      },
    }),
    dts({
      outDir,
      exclude: [
        'node_modules/**',
        '**/stories/**',
        '**/*.stories.*',
        '**/vite.config.*',
        '**/**.test.ts',
        '**/**.css.ts',
        '**/vitest.config.*',
      ],
      insertTypesEntry: false,
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
});
