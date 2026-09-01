const { baseUrl } = require('../config/environment');

/**
 * BasePage — behaviour shared by every page object.
 *
 * SOLID:
 *  - Single Responsibility: generic navigation / URL helpers only, nothing
 *    page-specific.
 *  - Open/Closed: concrete pages extend this class; they never modify it.
 *  - Liskov: subclasses only widen behaviour, so a subclass works anywhere a
 *    BasePage is expected.
 *
 * @abstract
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (new.target === BasePage) {
      throw new Error('BasePage is abstract and cannot be instantiated directly');
    }
    /** @protected */
    this.page = page;
  }

  /**
   * Navigate to a route relative to the configured base URL.
   * @param {string} route e.g. "/auth/login"
   */
  async goto(route) {
    await this.page.goto(new URL(route, baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
    });
  }

  /** @returns {string} */
  currentUrl() {
    return this.page.url();
  }

  /** @returns {Promise<string>} */
  title() {
    return this.page.title();
  }
}

module.exports = { BasePage };
