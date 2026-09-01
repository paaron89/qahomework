const { test, expect } = require('./fixtures');
const { invalidUser } = require('../src/config/credentials');

/**
 * E2E — login with invalid credentials.
 *
 *   Given the Angular Authentication web app
 *   When I log in with username "testron" / password "test123"
 *   Then "Ooops! Invalid username or password." renders on the page
 *
 * The spec only orchestrates: it drives the injected LoginPage and asserts on
 * the outcome. All page knowledge lives in the page object.
 */
test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('rejects invalid credentials with an error message', async ({ loginPage }) => {
    await loginPage.login(invalidUser);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(
      'Ooops! Invalid username or password.',
    );
    // still on the login route — no session established
    expect(loginPage.currentUrl()).toContain('/auth/login');
  });
});
