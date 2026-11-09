import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests for DhruvOS. They drive the production build (`out/`) in a real browser.
 *
 *   npm run build      # once, or after changing code
 *   npm run test:e2e   # starts the preview server on port 3210 if it isn't running
 *
 * Locally this uses the Microsoft Edge that ships with Windows (no browser download needed).
 * In CI it uses Playwright's Chromium (`npx playwright install chromium`).
 * Override with PW_CHANNEL=chrome (or PW_CHANNEL= for bundled Chromium).
 */
const CI = Boolean(process.env.CI);
const channel = process.env.PW_CHANNEL ?? (CI ? "" : "msedge");
const PORT = Number(process.env.PORT ?? 3210);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // The window animations are timing-sensitive; a few workers keeps a busy laptop honest.
  workers: CI ? 2 : 3,
  retries: CI ? 2 : 0,
  forbidOnly: CI,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1440, height: 900 },
    ...(channel ? { channel } : {}),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/preview.mjs",
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    env: { PORT: String(PORT) },
    timeout: 20_000,
  },
});
