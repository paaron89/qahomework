# Bonus Task — Docker

## What Docker is

Docker packages an application together with **everything it needs to run** —
the OS layer, system libraries, language runtime, tools and configuration — into
one portable unit called a **container**. You write the build steps in a
`Dockerfile`, build an **image** from it, and start one or more **containers**
from that image. Images are shared through a **registry** (Docker Hub, GitHub
Container Registry, ...).

| Term | Meaning |
| --- | --- |
| **Image** | Read-only template built from a `Dockerfile` (OS + dependencies + code). |
| **Container** | A running, isolated instance of an image. |
| **Dockerfile** | Step-by-step recipe for building an image. |
| **Registry** | Remote storage for images (`docker pull` / `docker push`). |
| **docker compose** | Starts several containers together from one YAML file. |

A container is **not** a virtual machine: it does not boot its own operating
system, it shares the host kernel and only isolates the process, filesystem and
network. So containers are small (tens–hundreds of MB), start in a second or
two, and are cheap to destroy and recreate.

## Why it is useful for a QA engineer

- **Kills "it works on my machine".** Every engineer and the CI server run the
  same image — same OS, same Node version, same browser builds — so results are
  reproducible.
- **Pinned browser / dependency versions.** The official Playwright image ships
  Chromium, Firefox and WebKit at a known version with all the required Linux
  libraries pre-installed. No long `apt install` list, no version drift.
- **Clean, disposable state.** Each run starts from a fresh container, so
  leftover files, caches or config from a previous run cannot leak into the next.
- **Isolated, parallel runs.** Many containers can run side by side — different
  suites, browser versions or environments — without interfering.
- **The whole stack in one command.** When the app under test is self-hosted,
  `docker compose` can bring up the app, a mock API and a seeded database next
  to the test runner, then tear it all down.
- **CI / local parity.** The pipeline runs the same image you run locally, so a
  CI failure can be reproduced on your laptop with one `docker run`.
- **Fast onboarding.** A new team member needs Docker and `git`, not a
  hand-tuned local toolchain.

---

## Applying it to *this* repository

> Not implemented in the repo — this is a written walkthrough. The parts marked
> **(applies here)** describe exactly what this project would need; the part
> marked **(illustrative)** would only apply if the app under test were
> self-hosted.

This repo runs a Playwright + `playwright-bdd` suite via `npm test`
(`bddgen && playwright test`) — 11 tests: `npm run test:login` (UI, 3 browsers)
and `npm run test:api` (REST). Both targets are **public hosted services**
(`angular-authentication.netlify.app` and `jsonplaceholder.typicode.com`), so a
container only needs the browsers, the npm dependencies and outbound network —
there is nothing local to spin up.

### `Dockerfile` — **(applies here)**

```dockerfile
# Playwright's own image: Node + Chromium/Firefox/WebKit + all Linux deps.
# The tag must match "@playwright/test" in package.json (1.62.1).
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app

# Copy manifests first so this layer is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# bddgen compiles the .feature files, then the whole suite runs.
CMD ["npm", "test"]
```

### `.dockerignore` — **(applies here)**

```
node_modules
.features-gen
playwright-report
test-results
.git
```

### Build and run — **(applies here)**

```bash
docker build -t qahomework-tests .

# full suite (UI + API) in a throwaway container
docker run --rm qahomework-tests

# just the API BDD suite
docker run --rm qahomework-tests npm run test:api

# just the UI login suite
docker run --rm qahomework-tests npm run test:login

# keep the HTML report on the host
docker run --rm -v "$PWD/playwright-report:/app/playwright-report" qahomework-tests
```

`--rm` removes the container on exit; the `-v` bind mount copies the generated
`playwright-report/` back so you can open it locally.

### Same image in CI (GitHub Actions) — **(applies here)**

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.62.1-jammy
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

Because CI uses the identical Playwright image, a green run locally is a strong
signal the pipeline will be green too.

### If the app under test were self-hosted — **(illustrative, not this repo)**

The API suite already supports an `API_BASE_URL` override
(`src/config/apiEnvironment.js`). If, instead of `jsonplaceholder`, the tests
ran against a local service, `docker compose` would start it next to the runner:

```yaml
services:
  mock-api:
    image: mockoon/cli:latest
    command: ["--data", "/data/api.json", "--port", "3000"]
    volumes:
      - ./mocks:/data

  tests:
    build: .
    depends_on:
      - mock-api
    environment:
      API_BASE_URL: http://mock-api:3000   # send the API suite to the mock
    command: ["npm", "run", "test:api"]
```

```bash
docker compose up --build --abort-on-container-exit
docker compose down
```

Compose puts both services on one network, so the test container reaches the
mock simply as `http://mock-api:3000`. Two commands create the environment and
two tear it down.
