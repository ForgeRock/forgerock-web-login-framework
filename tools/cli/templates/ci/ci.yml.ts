export function generateCiWorkflow(): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm check:lint
        name: Lint

      - run: pnpm test -- --run
        name: Unit Tests

      - run: pnpm build:app
        name: Build

      - run: pnpm --filter @forgerock/login-widget-e2e exec playwright install chromium
        name: Install Playwright

      - run: pnpm ci:e2e
        name: E2E Tests
`;
}
