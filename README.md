# qahomework

This is a QA homework.

Hope we will meet each other.

Automated test suite built with **[Playwright](https://playwright.dev/)** and
**[playwright-bdd](https://vitalets.github.io/playwright-bdd/)** (Gherkin feature
files), organised with a SOLID, layered structure.

- **Task 1 — Manual testing** (test cases + bug report): [`docs/task1-manual-testing.md`](docs/task1-manual-testing.md)
- **Task 2 — UI login tests** against `https://angular-authentication.netlify.app`
- **Task 3 — API tests** against `https://jsonplaceholder.typicode.com` (`/todos` as the task resource)

---

## Setup

```bash
npm install                 # install dependencies
npx playwright install      # download the browser binaries (first time only)
```

Requires Node.js 18+ (developed on Node 24).

---

## Where things live

```
features/
  ui/login.feature          Task 2 – login scenarios (Gherkin)
  api/tasks.feature          Task 3 – task API scenarios (Gherkin)
steps/
  ui/   login.steps.js       Task 2 – step definitions + fixtures
  api/  tasks.steps.js       Task 3 – step definitions + fixtures
src/
  pages/                     Page Objects (BasePage, LoginPage, HomePage)   – used by UI tests
  api/                       HttpClient (transport) + TasksApi (endpoints)  – used by API tests
  builders/TaskBuilder.js    Fluent test-data builder                       – API tests
  support/                   TaskSchema (response contract), ApiWorld (per-scenario state)
  config/                    environment.js (UI URL), apiEnvironment.js (API URL), credentials.js
playwright.config.js         Two BDD projects: UI (3 browsers) + API (no browser)
.features-gen/               Auto-generated specs (git-ignored) – produced by `bddgen`
```

> The `.feature` files are compiled into runnable Playwright specs by `bddgen`,
> which every `npm` script below runs automatically before the tests.

---

## npm scripts

All scripts are defined in **`package.json` → `"scripts"`**.

| Script | What it runs |
| --- | --- |
| `npm test` | Everything – UI login (×3 browsers) + API |
| `npm run test:login` | **Task 2** – UI login tests on Chromium, Firefox and WebKit |
| `npm run test:login:headed` | Task 2 with a visible browser window |
| `npm run test:api` | **Task 3** – API tests (single run, no browser) |
| `npm run test:headed` | All tests with a visible browser |
| `npm run test:ui` | Opens Playwright's interactive UI mode (watch / debug) |
| `npm run report` | Opens the HTML report from the last run |

---

## Task 1 — Manual testing

Not automated. Test cases (Gherkin format) and the bug report live in
[`docs/task1-manual-testing.md`](docs/task1-manual-testing.md), with bug
screenshots under [`docs/evidence/`](docs/evidence/).

---

## Task 2 — UI login tests

**Scenarios:** [`features/ui/login.feature`](features/ui/login.feature)

- Invalid credentials → error `"Ooops! Invalid username or password."`
- Valid credentials → redirected to `/home`, header avatar shows the user initials

**Run:**

```bash
npm run test:login            # headless, all 3 browsers
npm run test:login:headed     # watch it in a real browser
```

**Implementation:** step definitions in [`steps/ui/login.steps.js`](steps/ui/login.steps.js)
delegate to the Page Objects in [`src/pages/`](src/pages/). Credentials come from
[`src/config/credentials.js`](src/config/credentials.js) (override via env vars
`APP_USERNAME` / `APP_PASSWORD` / `APP_ADMIN_USERNAME` / `APP_ADMIN_PASSWORD`).

---

## Task 3 — API tests

**Scenarios:** [`features/api/tasks.feature`](features/api/tasks.feature)

| Endpoint | Expected status | Checks |
| --- | --- | --- |
| `POST /tasks` | `201` | JSON body, numeric `id`, response time |
| `GET /tasks/{id}` | `200` | body matches `{ userId, id, title, completed }` |
| `GET /tasks/{unknown}` | `404` | empty body |
| `PUT /tasks/{id}` | `200` | body reflects the update, `id` unchanged |
| `DELETE /tasks/{id}` | `200` | empty body |

> `jsonplaceholder` has no `/tasks` resource – `/todos` is its task collection,
> mapped in [`src/config/apiEnvironment.js`](src/config/apiEnvironment.js). It is a
> mock API: writes are not persisted, so each test asserts the response contract
> rather than doing create-then-fetch round trips.

**Run:**

```bash
npm run test:api
```

Override the base URL with the `API_BASE_URL` env var.

**Implementation:** step definitions in [`steps/api/tasks.steps.js`](steps/api/tasks.steps.js)
call [`src/api/TasksApi.js`](src/api/TasksApi.js) (endpoint knowledge), which uses
[`src/api/HttpClient.js`](src/api/HttpClient.js) (transport). Payloads are built
with [`src/builders/TaskBuilder.js`](src/builders/TaskBuilder.js) and responses
validated by [`src/support/TaskSchema.js`](src/support/TaskSchema.js).

---

## HTML report

Playwright writes an HTML report to **`playwright-report/`** after every run.

```bash
npm run report                       # open the last report
# or
npx playwright show-report           # same thing
npx playwright show-report --port 9324  # if port 9323 is busy
```

The report server runs until you press `Ctrl+C` in its terminal.

Traces are captured on first retry and viewable from inside the report, or with
`npx playwright show-trace <trace.zip>`.
