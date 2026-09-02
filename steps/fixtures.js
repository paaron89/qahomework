const { test: base } = require('playwright-bdd');
const { expect } = require('@playwright/test');
const { HttpClient } = require('../src/api/HttpClient');
const { TasksApi } = require('../src/api/TasksApi');
const { ApiWorld } = require('../src/support/ApiWorld');
const { apiBaseUrl } = require('../src/config/apiEnvironment');

/**
 * BDD test fixtures — the composition root for the API suite.
 *
 * SOLID (Dependency Inversion): step definitions declare the collaborators they
 * need (`tasksApi`, `world`) and receive ready instances. They never construct
 * an HttpClient or know the base URL. Swapping the transport or the resource
 * client is a change here only.
 */
const test = base.extend({
  /** @type {HttpClient} */
  httpClient: async ({ request }, use) => {
    await use(new HttpClient(request, apiBaseUrl));
  },

  /** @type {TasksApi} */
  tasksApi: async ({ httpClient }, use) => {
    await use(new TasksApi(httpClient));
  },

  /** fresh per scenario */
  world: async ({}, use) => {
    await use(new ApiWorld());
  },
});

module.exports = { test, expect };
