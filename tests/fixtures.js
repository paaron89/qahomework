const base = require('@playwright/test');
const { LoginPage } = require('../src/pages/LoginPage');

/**
 * Test fixtures — the composition root where page objects are constructed and
 * injected into specs.
 *
 * SOLID (Dependency Inversion): specs declare the collaborator they need
 * (`loginPage`) and receive a ready instance. They never `new` a page object or
 * touch a locator, so page details can change without touching any spec.
 */
const test = base.test.extend({
  /** @type {import('@playwright/test').Fixtures} */
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

module.exports = { test, expect: base.expect };
