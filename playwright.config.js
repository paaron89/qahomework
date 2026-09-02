// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');

/**
 * Two independent BDD suites, each with its own features, steps and generated
 * output directory. Keeping them separate means the UI fixtures
 * (steps/ui/fixtures.js) and API fixtures (steps/api/fixtures.js) never have to
 * be merged — each `defineBddConfig` owns its own `createBdd(test)` instance.
 */
const uiBddDir = defineBddConfig({
  features: 'features/ui/**/*.feature',
  steps: 'steps/ui/**/*.js',
  outputDir: '.features-gen/ui',
});

const apiBddDir = defineBddConfig({
  features: 'features/api/**/*.feature',
  steps: 'steps/api/**/*.js',
  outputDir: '.features-gen/api',
});

/**
 * Playwright configuration.
 * See https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    // --- UI BDD suite (features/ui) across browsers ---
    {
      name: 'ui-chromium',
      testDir: uiBddDir,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui-firefox',
      testDir: uiBddDir,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'ui-webkit',
      testDir: uiBddDir,
      use: { ...devices['Desktop Safari'] },
    },

    // --- Plain Playwright specs in ./tests (example.spec.js) ---
    {
      name: 'chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'] },
    },

    // --- API BDD suite (features/api) — no browser ---
    {
      name: 'api',
      testDir: apiBddDir,
      use: {
        baseURL: process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
