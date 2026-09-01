const { test, expect } = require('./fixtures');
const { invalidUser, validUser } = require('../src/config/credentials');

/**
 * E2E — login scenarios for the Angular Authentication web app.
 *
 * Each spec only orchestrates: it drives the injected page objects and asserts
 * on outcomes. All page knowledge lives in the page objects.
 */
test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  /**
   *   Given the Angular Authentication web app
   *   When I log in with username "testron" / password "test123"
   *   Then "Ooops! Invalid username or password." renders on the page
   */
  test('rejects invalid credentials with an error message', async ({ loginPage }) => {
    await loginPage.login(invalidUser);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(
      'Ooops! Invalid username or password.',
    );
    // still on the login route — no session established
    expect(loginPage.currentUrl()).toContain('/auth/login');
  });

  /**
   *   Given the Angular Authentication web app
   *   When I authenticate with username "admin" / password "demo"
   *   Then login succeeds
   *   And the header avatar shows the initials "AD"
   */
  test('accepts valid credentials and shows the user avatar', async ({
    loginPage,
    homePage,
    page,
  }) => {
    await loginPage.login(validUser);

    await homePage.waitUntilLoaded();
    await expect(page).toHaveURL(new RegExp(`${homePage.path}$`));
    await expect(homePage.avatar).toBeVisible();
    await expect(homePage.avatar).toHaveText(validUser.avatarInitials);
  });
});
