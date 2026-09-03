# Bonus Task — CI

## Integrating the tests into a CI pipeline

**Continuous Integration** means every push and every pull request is
automatically built and tested on a neutral server, so problems are caught
before code reaches the main branch instead of after.

### Tools and processes

| Concern | How it is handled |
| --- | --- |
| **Trigger** | Run on `pull_request` targeting `main`, and on `push` to `main` (post-merge safety net). |
| **Isolated environment** | Run inside the official Playwright Docker image so Node + all three browsers + system libs are fixed and match `@playwright/test`. |
| **Dependency install** | `npm ci` (uses `package-lock.json`, reproducible); cache `~/.npm` between runs. |
| **Deterministic runs** | `forbidOnly` in CI (fails if a `test.only` was left in), `retries: 2` in CI to absorb network blips, fixed browser versions. The repo's `playwright.config.js` already switches these on via `process.env.CI`. |
| **Speed** | Split into parallel jobs: a fast API job (no browser) and a UI job with a browser matrix (`ui-chromium` / `ui-firefox` / `ui-webkit`) running concurrently. |
| **Reporting** | Playwright's `github` reporter annotates failing lines directly on the PR; the HTML report + traces are uploaded as build artifacts. |
| **Merge gate** | Branch protection on `main` marks the CI jobs as **required status checks** — a PR cannot be merged until they pass. |
| **Secrets** | None needed today (both targets are public). If real credentials were introduced they would live in GitHub Secrets and be injected as env vars (`APP_ADMIN_USERNAME`, ...), never committed — see the note in `src/config/credentials.js`. |
| **Noise control** | `concurrency` cancels superseded runs when a PR is updated; `fail-fast: false` so one browser failing still reports the others. |
| **Notifications** | Slack / email notification on a failed run of `main`. |

### Example CI tool

**GitHub Actions** — used here. Other CI systems that do the same job: GitLab CI
(`.gitlab-ci.yml`), Jenkins (declarative `Jenkinsfile`), CircleCI. The concepts
(triggers, jobs, steps, caching, artifacts, required checks) map across all of
them.

---

## GitHub Actions

GitHub Actions is a CI/CD platform built into GitHub: you define
**workflows** (YAML files in `.github/workflows/`) made of **jobs**, each job a
sequence of **steps** run on a GitHub-hosted runner. It triggers on repository
events (`push`, `pull_request`, `schedule`, manual `workflow_dispatch`), reports
each job as a status check on the commit/PR, and can gate merges. That is a CI
pipeline.

---

## Plan for these UI + API tests

### Repository facts the pipeline relies on

- `npm test` → `bddgen && playwright test` (11 tests total).
- `npm run test:api` → `api` project, no browser, hits `jsonplaceholder.typicode.com`.
- `npm run test:login` → `ui-chromium` / `ui-firefox` / `ui-webkit`, hits `angular-authentication.netlify.app`.
- `.feature` files must be compiled first with `bddgen` (every `npm` script already does this).
- HTML report is written to `playwright-report/`; failure artifacts to `test-results/`.
- Both test targets are **public hosted services**, so the runner only needs outbound network — nothing to deploy.
- `playwright.config.js` is already CI-aware (`forbidOnly`, `retries`, `workers` keyed off `process.env.CI`).

### Pipeline shape

```
pull_request → ┌── job: api   (Playwright image, no browser)         ~1 min
   / push       └── job: ui    (matrix: chromium | firefox | webkit) ~2–4 min
                          │
                          └── both required to pass → PR mergeable
                          └── on failure: HTML report + traces uploaded as artifacts
```

### One recommended config change

Make the reporter CI-aware so failures annotate the PR:

```js
// playwright.config.js
reporter: process.env.CI
  ? [['github'], ['html', { open: 'never' }]]
  : 'html',
```

### `.github/workflows/tests.yml`

```yaml
name: tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: tests-${{ github.ref }}
  cancel-in-progress: true

jobs:
  api:
    name: API tests
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.62.1-jammy
    steps:
      - uses: actions/checkout@v4
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run test:api
      - name: Upload report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: report-api
          path: playwright-report/
          retention-days: 7

  ui:
    name: UI tests (${{ matrix.project }})
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.62.1-jammy
    strategy:
      fail-fast: false
      matrix:
        project: [ui-chromium, ui-firefox, ui-webkit]
    steps:
      - uses: actions/checkout@v4
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npx bddgen && npx playwright test --project=${{ matrix.project }}
      - name: Upload report and traces
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: report-${{ matrix.project }}
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

### What happens on a pull request

1. Developer pushes a branch and opens a PR against `main`.
2. GitHub Actions starts the `api` job and three `ui` jobs in parallel, each in
   the pinned Playwright container.
3. Each job checks out the code, restores the npm cache, runs `npm ci`, compiles
   the feature files, and runs its slice of the suite.
4. Failures show as inline annotations on the PR (github reporter); the full HTML
   report and any traces/screenshots are attached as downloadable artifacts.
5. All four jobs are **required status checks**, so the "Merge" button stays
   disabled until they are green.
6. After merge, the same workflow runs once more on `main`; a failure there
   triggers a Slack/email alert.

### Later enhancements

- **Sharding** the UI matrix further (`--shard=1/3`) and merging blob reports
  with `npx playwright merge-reports` for a single combined HTML report.
- **Scheduled run** (`on: schedule`) once a day to catch breakage in the
  external hosted targets even when no one is committing.
- **Publish the HTML report** to GitHub Pages or as a PR comment link.
- **`workflow_dispatch`** input to run a single project or a `--grep` tag on demand.
