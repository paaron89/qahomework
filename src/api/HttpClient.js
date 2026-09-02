/**
 * HttpClient — thin transport layer over Playwright's APIRequestContext.
 *
 * SOLID:
 *  - Single Responsibility: sends HTTP requests and normalises responses.
 *    It knows nothing about tasks, schemas, or assertions.
 *  - Dependency Inversion: resource clients (TasksApi, ...) depend on this
 *    class, not on Playwright directly. A fake HttpClient can be substituted
 *    in a unit test.
 *  - Open/Closed: new verbs/behaviour extend the class; callers are unaffected.
 */
class HttpClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseUrl
   */
  constructor(request, baseUrl) {
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
   * @param {string} path
   * @param {{ data?: unknown, params?: Record<string, string|number|boolean>, headers?: Record<string,string> }} [options]
   * @returns {Promise<{ status: number, ok: boolean, headers: Record<string,string>, body: any, durationMs: number }>}
   */
  async send(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const started = Date.now();
    const response = await this.request.fetch(url, {
      method,
      data: options.data,
      params: options.params,
      headers: options.headers,
    });
    const durationMs = Date.now() - started;

    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      durationMs,
    };
  }

  get(path, options) {
    return this.send('GET', path, options);
  }

  post(path, options) {
    return this.send('POST', path, options);
  }

  put(path, options) {
    return this.send('PUT', path, options);
  }

  patch(path, options) {
    return this.send('PATCH', path, options);
  }

  delete(path, options) {
    return this.send('DELETE', path, options);
  }
}

module.exports = { HttpClient };
