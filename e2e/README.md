# E2E Tests

[Playwright](https://playwright.dev/) end-to-end test suite for the ForgeRock Login Widget.

## Prerequisites

Before running E2E tests:

1. **Build the widget**: `pnpm build:widget` (from repo root)
2. **Build the login-app**: `pnpm build:app` (from repo root)
3. **Install Playwright browsers**: `pnpm exec playwright install chromium`

On Linux, you also need system dependencies:

```shell
pnpm exec playwright install-deps chromium
```

## Running Tests

```shell
# Run all E2E tests (from repo root)
pnpm ci:e2e

# Run with debug mode (opens Playwright inspector)
pnpm --filter @forgerock/login-widget-e2e run ci:e2e:debug
```

### Filtering Tests

```shell
# Run a specific test file
pnpm ci:e2e -- tests/widget/modal/widget-modal.login.test.js

# Run tests matching a pattern
pnpm ci:e2e -- --grep "login"

# Run with visible browser
pnpm ci:e2e -- --headed
```

## Test Structure

```
e2e/
├── tests/
│   ├── utilities/          # Shared test utilities
│   │   └── async-events.js
│   └── widget/
│       ├── inline/         # Inline form factor tests
│       │   ├── widget-inline.test.js
│       │   ├── widget-inline.a11y.test.js
│       │   ├── widget-inline.register.test.js
│       │   ├── widget-inline.webauthn-login.test.js
│       │   └── ... (locale tests, stage attributes, etc.)
│       └── modal/          # Modal form factor tests
│           ├── widget-modal.login.test.js
│           ├── widget-modal.login.a11y.test.js
│           ├── widget-modal.register.test.js
│           ├── widget-modal.qr-code.test.js
│           ├── widget-modal.ping-protect.test.ts
│           └── ... (social login, email suspend, etc.)
├── playwright.config.ts    # Playwright configuration
├── merge.config.ts         # Config for merging sharded reports
└── package.json
```

## CI Configuration

In CI, tests run with **4-shard parallelism** across both macOS and Ubuntu:

- **Matrix**: `os: [macos-latest, ubuntu-latest]` x `shard: [1, 2, 3, 4]`
- **Browser**: Chromium only
- **Retries**: 2 retries in CI, 0 locally
- **Timeout**: 120 seconds per test
- **Reporter**: Blob reports in CI (merged into HTML), dot reporter locally

### Running with Shards Locally

```shell
# Simulate CI shard 1 of 4
pnpm ci:e2e -- --shard=1/4
```

## Environment Variables

Tests connect to a ForgeRock AM instance. The Playwright config provides defaults, but CI uses secrets:

| Variable                      | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `VITE_FR_AM_URL`              | ForgeRock AM base URL                                   |
| `VITE_FR_AM_COOKIE_NAME`      | AM session cookie name                                  |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 client ID                                     |
| `VITE_FR_REALM_PATH`          | AM realm path                                           |
| `PLAYWRIGHT_TEST_BASE_URL`    | Override the app URL (default: `http://localhost:3000`) |

## Debugging

```shell
# Open Playwright inspector for step-by-step debugging
PWDEBUG=1 pnpm ci:e2e -- tests/widget/modal/widget-modal.login.test.js

# Run headed with slow motion
pnpm ci:e2e -- --headed

# View trace files from failed tests
pnpm exec playwright show-trace e2e/test-results/*/trace.zip
```

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
