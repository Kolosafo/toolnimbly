import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Full cross-browser coverage runs on main/nightly (spec §10.1). Pull requests
 * run the Chromium project only unless E2E_ALL_BROWSERS is set.
 */
const runAllBrowsers = process.env.E2E_ALL_BROWSERS === 'true' || process.env.CI !== 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI === 'true',
  retries: process.env.CI === 'true' ? 2 : 0,
  workers: process.env.CI === 'true' ? 2 : undefined,
  reporter: process.env.CI === 'true' ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(runAllBrowsers
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
