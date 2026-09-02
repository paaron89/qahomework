/**
 * TaskBuilder — fluent construction of task request payloads.
 *
 * SOLID (Single Responsibility): the only job is building valid test data, so
 * steps and specs never hand-assemble object literals. Sensible defaults keep
 * scenarios short; `withX` methods override only what the scenario cares about.
 */
class TaskBuilder {
  constructor() {
    this._task = {
      userId: 1,
      title: 'Learn Playwright API testing',
      completed: false,
    };
  }

  /** @returns {TaskBuilder} */
  static aTask() {
    return new TaskBuilder();
  }

  /** @param {string} title */
  withTitle(title) {
    this._task.title = title;
    return this;
  }

  /** @param {boolean} completed */
  withCompleted(completed) {
    this._task.completed = completed;
    return this;
  }

  /** @param {number} userId */
  withUserId(userId) {
    this._task.userId = userId;
    return this;
  }

  /** @returns {{ userId: number, title: string, completed: boolean }} */
  build() {
    return { ...this._task };
  }
}

module.exports = { TaskBuilder };
