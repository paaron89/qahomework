const { resources } = require('../config/apiEnvironment');

/**
 * TasksApi — knows the /tasks (jsonplaceholder /todos) endpoints and nothing
 * else.
 *
 * SOLID:
 *  - Single Responsibility: one class per resource. It maps intent
 *    (create/get/update/delete a task) to a path + verb.
 *  - Interface Segregation: exposes exactly four methods; steps see no HTTP
 *    detail.
 *  - Dependency Inversion: depends on the injected HttpClient abstraction.
 *  - Open/Closed: a new resource (UsersApi, CommentsApi) is a new class, this
 *    one is untouched.
 */
class TasksApi {
  /**
   * @param {import('./HttpClient').HttpClient} httpClient
   */
  constructor(httpClient) {
    this.http = httpClient;
    this.basePath = resources.tasks;
  }

  /**
   * POST /tasks
   * @param {{ title: string, completed: boolean, userId: number }} task
   */
  createTask(task) {
    return this.http.post(this.basePath, { data: task });
  }

  /**
   * GET /tasks/{id}
   * @param {number|string} id
   */
  getTask(id) {
    return this.http.get(`${this.basePath}/${id}`);
  }

  /**
   * PUT /tasks/{id}
   * @param {number|string} id
   * @param {{ title: string, completed: boolean, userId: number }} task
   */
  updateTask(id, task) {
    return this.http.put(`${this.basePath}/${id}`, { data: task });
  }

  /**
   * DELETE /tasks/{id}
   * @param {number|string} id
   */
  deleteTask(id) {
    return this.http.delete(`${this.basePath}/${id}`);
  }
}

module.exports = { TasksApi };
