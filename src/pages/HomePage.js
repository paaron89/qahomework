const { BasePage } = require('./BasePage');
const { routes } = require('../config/environment');

/**
 * HomePage — page object for /home, the landing page after a successful login.
 *
 * Kept separate from LoginPage so each page object has one reason to change
 * (Single Responsibility) and LoginPage stays ignorant of what happens once
 * authentication succeeds.
 *
 * SOLID:
 *  - Single Responsibility: models the authenticated home screen only.
 *  - Open/Closed: extends BasePage without modifying it.
 *  - Liskov: usable anywhere a BasePage is expected.
 */
class HomePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // --- locators (single source of truth) ---
    this.avatar = page.locator('aa-avatar');
    this.securedFeatureLink = page.getByRole('link', { name: /secured feature/i });
  }

  /** @returns {string} the route this page lives on */
  get path() {
    return routes.home;
  }

  /** Wait until the authenticated home page has rendered. */
  async waitUntilLoaded() {
    await this.avatar.waitFor({ state: 'visible' });
  }

  /** @returns {Promise<string>} trimmed initials shown in the header avatar */
  async avatarInitials() {
    return (await this.avatar.innerText()).trim();
  }
}

module.exports = { HomePage };
