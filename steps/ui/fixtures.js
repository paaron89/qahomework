const { test: base } = require('playwright-bdd');
const { expect } = require('@playwright/test');
const { LoginPage } = require('../../src/pages/LoginPage');
const { HomePage } = require('../../src/pages/HomePage');

/**
 * UI BDD fixtures — the composition root for the browser scenarios.
 *
 * This is a SEPARATE fixture set from steps/api/fixtures.js: it is bound only to
 * the UI BDD config (features/ui + steps/ui) via playwright.config.js, so the
 * two never mix even though the file name matches. Different directory,
 * different `defineBddConfig`, different `createBdd(test)` instance.
 *
 * SOLID (Dependency Inversion): step definitions declare the page objects they
 * need (`loginPage`, `homePage`) and receive ready instances; they never `new`
 * a page or touch a locator.
 */
const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

module.exports = { test, expect };
