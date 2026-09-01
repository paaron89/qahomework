/**
 * Environment configuration — single source of truth for URLs.
 *
 * SOLID (Single Responsibility): this module only resolves environment values.
 * Overridable via env vars so the same suite can target other deployments.
 */
const BASE_URL =
  process.env.APP_BASE_URL || 'https://angular-authentication.netlify.app';

module.exports = {
  baseUrl: BASE_URL,
  routes: {
    login: '/auth/login',
  },
};
