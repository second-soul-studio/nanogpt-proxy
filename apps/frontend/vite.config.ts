import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {},
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${path.join(process.cwd(), 'src/_mantine').replace(/\\/g, '/')}" as mantine;`,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'postcss.config.cjs',
        'src/main.tsx',
        '**/tests/**',
        '__mocks__/**',
        '**/*config*.ts',
        '**/**/*.css',
        '**/**/*.scss',
        '**/**/*.json',
      ],
    },
  },
});
