import { defineConfig } from 'vitest/config';

// Standalone config (does not load the crx Vite plugin) — logic-only unit tests
// run in a plain Node environment, no browser or Chrome APIs needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
