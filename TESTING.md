# Testing

This document covers how to run the various test suites in the ForgeRock Web Login Framework.

## Table of Contents

- [Unit Tests](#unit-tests)
- [Storybook Tests](#storybook-tests)
- [E2E Tests](#e2e-tests)
- [Linting](#linting)
- [CI Pipeline](#ci-pipeline)

## Unit Tests

Unit tests use [Vitest](https://vitest.dev/) and live alongside the source code in `packages/login-widget`.

```shell
# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test -- --run
```

## Storybook Tests

[Storybook](https://storybook.js.org/) interaction tests verify component behavior in an isolated environment.

```shell
# Build Storybook
pnpm build:storybook

# Run Storybook interaction tests (requires Storybook to be running)
pnpm storybook         # Start Storybook on port 6006
pnpm test:storybook    # Run interaction tests against running Storybook
```

## E2E Tests

End-to-end tests use [Playwright](https://playwright.dev/) and live in the `e2e/` workspace. See [e2e/README.md](e2e/README.md) for detailed documentation.

### Prerequisites

Before running E2E tests, you must:

1. Build the widget: `pnpm build:widget`
2. Build the login-app: `pnpm build:app`
3. Install Playwright browsers: `pnpm exec playwright install chromium`

### Running E2E Tests

```shell
# Run all E2E tests
pnpm ci:e2e

# Run with debug mode (opens browser inspector)
pnpm --filter @forgerock/login-widget-e2e run ci:e2e:debug

# Run a specific test file
pnpm ci:e2e -- tests/widget/modal/widget-modal.login.test.js

# Run with visible browser
pnpm ci:e2e -- --headed
```

### Environment Variables

E2E tests require ForgeRock AM connection details. Set these in your environment or a `.env` file:

| Variable                      | Description            |
| ----------------------------- | ---------------------- |
| `VITE_FR_AM_URL`              | ForgeRock AM base URL  |
| `VITE_FR_AM_COOKIE_NAME`      | AM session cookie name |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 client ID    |
| `VITE_FR_REALM_PATH`          | AM realm path          |

## Linting

```shell
# Run Prettier + ESLint with auto-fix
pnpm check:lint

# Run Svelte type checking
pnpm check:svelte
```

## CI Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs the following jobs on every push:

| Job                           | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| **build**                     | Builds the widget release artifacts                                        |
| **test-lint-storybook-build** | Runs linting, unit tests, Storybook build, and Storybook interaction tests |
| **e2e**                       | Runs Playwright tests across macOS + Ubuntu with 4-shard parallelism       |
| **merge-e2e-report**          | Merges sharded E2E reports into a single HTML report                       |
| **chromatic**                 | Runs Chromatic visual regression tests                                     |

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
