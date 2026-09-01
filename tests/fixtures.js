const base = require('@playwright/test');
const { LoginPage } = require('../src/pages/LoginPage');
const { HomePage } = require('../src/pages/HomePage');

/**
 * Test fixtures — the composition root where page objects are constructed and
 * injected into specs.
 *
 * SOLID (Dependency Inversion): specs declare the collaborators they need
 * (`loginPage`, `homePage`) and receive ready instances. They never `new` a
 * page object or touch a locator, so page details can change without touching
 * any spec.
 */
const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

module.exports = { test, expect: base.expect };
