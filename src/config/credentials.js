/**
 * Test data — single source of truth for login credentials.
 *
 * SOLID (Single Responsibility): only supplies credential data. Values come
 * from env vars where present; the committed defaults are the ones from the
 * test brief and are safe to store (they are deliberately invalid).
 *
 * SECURITY: NEVER push prod creds anywhere! The committed defaults must stay
 * non-sensitive demo values only. If you can, pull such test data from a
 * secret manager (env injected by CI / Vault / AWS Secrets Manager / etc.)
 * rather than hard-coding it here.
 */
module.exports = {
  /** Credentials that must NOT authenticate. */
  invalidUser: {
    username: process.env.APP_USERNAME || 'testron',
    password: process.env.APP_PASSWORD || 'test123',
  },

  /** Credentials that must authenticate successfully. */
  validUser: {
    username: process.env.APP_ADMIN_USERNAME || 'admin',
    password: process.env.APP_ADMIN_PASSWORD || 'demo',
    /** initials shown in the header avatar after login */
    avatarInitials: 'AD',
  },
};
