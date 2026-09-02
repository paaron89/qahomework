const { createBdd } = require('playwright-bdd');
const { test, expect } = require('./fixtures');
const { TaskBuilder } = require('../src/builders/TaskBuilder');
const { validateTask } = require('../src/support/TaskSchema');

/**
 * Step definitions for features/tasks.feature
 *
 * Each step does one thing: translate a Gherkin sentence into a TasksApi call
 * or an assertion on `world`. No HTTP, no locators, no payload assembly —
 * those live in HttpClient / TasksApi / TaskBuilder / TaskSchema.
 */
const { Given, When, Then } = createBdd(test);

// --- Given ------------------------------------------------------------------

Given('the Task API is reachable', async ({ tasksApi }) => {
  const res = await tasksApi.getTask(1);
  expect(res.status, 'health check on GET /tasks/1').toBe(200);
});

Given('a new task payload', ({ world }) => {
  world.request = TaskBuilder.aTask().build();
});

Given(
  'a task payload with title {string} and completed {string}',
  ({ world }, title, completed) => {
    world.request = TaskBuilder.aTask()
      .withTitle(title)
      .withCompleted(completed === 'true')
      .build();
  },
);

Given('an existing task id {int}', ({ world }, id) => {
  world.taskId = id;
});

Given('a non-existent task id {int}', ({ world }, id) => {
  world.taskId = id;
});

// --- When ------------------------------------------------------------------

When('I create the task', async ({ tasksApi, world }) => {
  world.response = await tasksApi.createTask(world.request);
});

When('I request the task by id', async ({ tasksApi, world }) => {
  world.response = await tasksApi.getTask(world.taskId);
});

When('I update the task', async ({ tasksApi, world }) => {
  world.response = await tasksApi.updateTask(world.taskId, world.request);
});

When('I delete the task', async ({ tasksApi, world }) => {
  world.response = await tasksApi.deleteTask(world.taskId);
});

// --- Then ------------------------------------------------------------------

Then('the response status is {int}', ({ world }, status) => {
  expect(world.response.status).toBe(status);
});

Then('the response is JSON', ({ world }) => {
  expect(world.response.headers['content-type'] || '').toContain('application/json');
});

Then('the response time is under {int} ms', ({ world }, limit) => {
  expect(world.response.durationMs).toBeLessThan(limit);
});

Then('the response body matches the task schema', ({ world }) => {
  expect(validateTask(world.response.body), 'schema violations').toEqual([]);
});

Then('the response body has a numeric id', ({ world }) => {
  expect(typeof world.response.body.id).toBe('number');
});

Then('the response body has id {int}', ({ world }, id) => {
  expect(world.response.body.id).toBe(id);
});

Then('the response body has title {string}', ({ world }, title) => {
  expect(world.response.body.title).toBe(title);
});

Then('the response body has completed {string}', ({ world }, completed) => {
  expect(world.response.body.completed).toBe(completed === 'true');
});

Then('the response body is empty', ({ world }) => {
  expect(world.response.body).toEqual({});
});
