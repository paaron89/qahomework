/**
 * ApiWorld — per-scenario state carrier for BDD steps.
 *
 * BDD steps are separate functions, so the request built in a `Given`, the id
 * chosen, and the response returned by a `When` need somewhere to live until
 * the `Then` asserts on them. This object is that place — one instance per
 * scenario, provided by a fixture.
 *
 * SOLID (Single Responsibility): holds scenario state, nothing more. No HTTP,
 * no assertions.
 */
class ApiWorld {
  constructor() {
    /** @type {object|null} payload most recently prepared */
    this.request = null;
    /** @type {{ status: number, ok: boolean, headers: Record<string,string>, body: any, durationMs: number }|null} */
    this.response = null;
    /** @type {number|string|null} task id under test */
    this.taskId = null;
  }
}

module.exports = { ApiWorld };
