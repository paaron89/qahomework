/**
 * Test data — single source of truth for login credentials.
 *
 * SOLID (Single Responsibility): only supplies credential data. Values come
 * from env vars where present; the committed defaults are the ones from the
 * test brief and are safe to store (they are deliberately invalid).
 */
module.exports = {
  /** Credentials that must NOT authenticate. */
  invalidUser: {
    username: process.env.APP_USERNAME || 'testron',
    password: process.env.APP_PASSWORD || 'test123',
  },
};
