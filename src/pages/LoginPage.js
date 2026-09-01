const { BasePage } = require('./BasePage');
const { routes } = require('../config/environment');

/**
 * LoginPage — page object for /auth/login of the Angular Authentication app.
 *
 * The form is Angular Material; label locators are stable against the generated
 * markup, with `formcontrolname` fallbacks. Every selector lives here so a DOM
 * change is a one-line edit.
 *
 * SOLID:
 *  - Single Responsibility: models the login screen only, and exposes intent
 *    (`login`, `errorMessage`) instead of raw Playwright calls, so specs read
 *    as scenarios.
 *  - Open/Closed: extends BasePage without changing it.
 *  - Dependency Inversion: receives the Playwright `page` by injection; the
 *    spec depends on this page object, not on locators.
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // --- locators (single source of truth) ---
    this.usernameField = page
      .getByLabel('Username')
      .or(page.locator('input[formcontrolname="username"]'))
      .first();
    this.passwordField = page
      .getByLabel('Password')
      .or(page.locator('input[formcontrolname="password"]'))
      .first();
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page
      .locator('.alert--error')
      .or(page.getByText('Ooops! Invalid username or password.'))
      .first();
  }

  async open() {
    await this.goto(routes.login);
    await this.usernameField.waitFor({ state: 'visible' });
  }

  /**
   * @param {{ username: string, password: string }} credentials
   */
  async fillCredentials({ username, password }) {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }

  /**
   * Full login flow.
   * @param {{ username: string, password: string }} credentials
   */
  async login(credentials) {
    await this.fillCredentials(credentials);
    await this.submit();
  }
}

module.exports = { LoginPage };
