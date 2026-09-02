const { createBdd } = require('playwright-bdd');
const { test, expect } = require('./fixtures');
const { invalidUser, validUser } = require('../../src/config/credentials');

/**
 * Step definitions for features/ui/login.feature
 *
 * Each step does one thing: translate a Gherkin sentence into a page-object
 * call or an assertion. All DOM knowledge lives in LoginPage / HomePage.
 */
const { Given, When, Then } = createBdd(test);

// --- Given ----------------------------------------------------------------

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

// --- When ---------------------------------------------------------------

When('I log in with invalid credentials', async ({ loginPage }) => {
  await loginPage.login(invalidUser);
});

When('I log in as the admin user', async ({ loginPage }) => {
  await loginPage.login(validUser);
});

// --- Then ---------------------------------------------------------------

Then('I see the error {string}', async ({ loginPage }, message) => {
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText(message);
});

Then('I remain on the login page', ({ loginPage }) => {
  expect(loginPage.currentUrl()).toContain('/auth/login');
});

Then('I land on the home page', async ({ homePage, page }) => {
  await homePage.waitUntilLoaded();
  await expect(page).toHaveURL(new RegExp(`${homePage.path}$`));
});

Then('the header avatar shows {string}', async ({ homePage }, initials) => {
  await expect(homePage.avatar).toBeVisible();
  await expect(homePage.avatar).toHaveText(initials);
});
