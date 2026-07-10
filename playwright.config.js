// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for OpenCargo E2E tests.
 * Focused on PWA flows: manifest, service worker, offline, splash screen.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // SW tests need a single worker
  reporter: [["html", { outputFolder: "playwright-report" }]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enable PWA features
        permissions: ["notifications"],
        bypassCSP: true,
      },
    },
  ],

  // Server started manually before tests
  // webServer: {
  //   command: "node scripts/serve-frontend.mjs 5173",
  //   url: "http://localhost:5173",
  //   reuseExistingServer: true,
  //   timeout: 10000,
  // },
});
