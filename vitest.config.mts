import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Native tsconfig `paths` resolution, so `@/…` imports work in tests.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/support/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx', 'lib/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    environmentMatchGlobs: [
      ['tests/component/**', 'jsdom'],
      ['tests/unit/**/*.dom.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['lib/**/*.test.ts', 'lib/config/**'],
    },
    /**
     * Date-only arithmetic must be independent of the machine's timezone
     * (spec §10.2). Pinning to a non-UTC, DST-observing zone here means a test
     * that accidentally relies on UTC parsing fails in CI rather than passing
     * by luck on a UTC build agent.
     */
    env: {
      TZ: 'America/New_York',
    },
  },
});
