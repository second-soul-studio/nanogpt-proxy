import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        'src/main.jsx',
        '**/tests/**',
        '__mocks__/**',
        '**/*config*.js',
        '**/**/*.css',
      ],
    },
  },
});
