/**
 * TaskSchema — validates the shape of a task resource in an API response.
 *
 * SOLID (Single Responsibility): response-contract validation lives here, not
 * scattered through step definitions. Returns a list of problems (empty = valid)
 * so the caller owns how to assert.
 */

/**
 * @param {unknown} body
 * @returns {string[]} human-readable violations; empty array means valid
 */
function validateTask(body) {
  const errors = [];

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return ['response body is not a JSON object'];
  }

  /** @type {Record<string, string>} */
  const expected = {
    id: 'number',
    title: 'string',
    completed: 'boolean',
    userId: 'number',
  };

  for (const [field, type] of Object.entries(expected)) {
    if (!(field in body)) {
      errors.push(`missing field "${field}"`);
    } else if (typeof body[field] !== type) {
      errors.push(`field "${field}" should be ${type}, got ${typeof body[field]}`);
    }
  }

  return errors;
}

module.exports = { validateTask };
