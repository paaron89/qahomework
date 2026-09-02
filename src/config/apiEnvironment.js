/**
 * API environment configuration — single source of truth for the API under
 * test. Kept separate from `environment.js` (the UI app) so the two suites
 * never share a base URL.
 *
 * SOLID (Single Responsibility): only resolves API environment values.
 */
const API_BASE_URL =
  process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com';

module.exports = {
  apiBaseUrl: API_BASE_URL,
  resources: {
    // jsonplaceholder has no /tasks resource; /todos is its task-management
    // collection ({ userId, id, title, completed }).
    tasks: '/todos',
  },
};
