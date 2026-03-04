# Contributing to the ForgeRock Web Login Framework

Thank you for your interest in contributing! This guide walks you through the development environment setup, workflow, and conventions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Workspace Structure](#workspace-structure)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Commit Conventions](#commit-conventions)
- [Pull Requests](#pull-requests)

## Prerequisites

| Tool                           | Version | Notes                                                                            |
| ------------------------------ | ------- | -------------------------------------------------------------------------------- |
| [Node.js](https://nodejs.org/) | >= 20.x | We recommend using [Volta](https://volta.sh/) (pinned to 22.x in `package.json`) |
| [pnpm](https://pnpm.io/)       | >= 10.x | Install via `corepack enable && corepack prepare`                                |

## Getting Started

```shell
# Clone the repository
git clone https://github.com/forgerock/forgerock-web-login-framework.git
cd forgerock-web-login-framework

# Install dependencies
pnpm install
```

## Workspace Structure

This is a pnpm monorepo with the following workspaces:

| Workspace               | Package Name                  | Description                                                                |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `packages/login-widget` | `@forgerock/login-widget`     | The published npm package — widget source, Storybook stories, Vitest tests |
| `apps/login-app`        | `@forgerock/login-app`        | SvelteKit development & documentation app                                  |
| `e2e`                   | `@forgerock/login-widget-e2e` | Playwright end-to-end test suite                                           |

The `core/` directory is **not** a workspace. It contains shared TypeScript modules (stores, journey logic, OAuth, i18n) consumed by both the widget and the app via path aliases (`$core`, `$journey`, `$components`, `$locales`). See [core/README.md](core/README.md) for details.

## Development Workflow

### Common Commands

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Build the widget, then start the SvelteKit dev app |
| `pnpm build:widget`   | Build the widget package                           |
| `pnpm build:app`      | Build the widget and the SvelteKit app             |
| `pnpm build:release`  | Full release build (widget + types)                |
| `pnpm storybook`      | Launch Storybook on port 6006                      |
| `pnpm test`           | Run Vitest unit tests                              |
| `pnpm test:storybook` | Run Storybook interaction tests                    |
| `pnpm ci:e2e`         | Run Playwright E2E tests                           |
| `pnpm check:lint`     | Run Prettier + ESLint with auto-fix                |
| `pnpm check:svelte`   | Run svelte-check on the login-app                  |

### Environment Variables

The login-app requires environment variables for connecting to a ForgeRock AM instance. Create a `.env` file in the repository root or set them in your shell:

| Variable                      | Description                                                            |
| ----------------------------- | ---------------------------------------------------------------------- |
| `VITE_FR_AM_URL`              | ForgeRock AM base URL (e.g., `https://openam-sdks.forgeblocks.com/am`) |
| `VITE_FR_AM_COOKIE_NAME`      | AM session cookie name                                                 |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 client ID                                                    |
| `VITE_FR_REALM_PATH`          | AM realm path                                                          |

## Making Changes

This project uses [Changesets](https://github.com/changesets/changesets) for release management. Every PR that changes published package behavior should include a changeset.

### Creating a Changeset

```shell
# Interactive prompt to describe your change
pnpm changeset
```

This creates a markdown file in `.changeset/` describing the change type (patch, minor, or major) and a summary. Commit this file with your PR.

### When You Don't Need a Changeset

- Documentation-only changes
- Changes to the dev app (`apps/login-app`)
- Changes to E2E tests
- CI/tooling configuration changes

## Code Style

- **Formatter**: [Prettier](https://prettier.io/) (config in `.prettierrc`)
- **Linter**: [ESLint](https://eslint.org/) with Svelte and Storybook plugins
- **Pre-commit**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged) runs Prettier and ESLint on staged files

Run manually:

```shell
pnpm check:lint
```

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced via [Commitizen](https://commitizen.github.io/cz-cli/).

```shell
# Use the interactive commit prompt
pnpm commit
```

Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

## Pull Requests

1. Create a feature branch from the target branch
2. Make your changes and include a changeset if applicable
3. Ensure `pnpm check:lint` and `pnpm test` pass locally
4. Push your branch and open a pull request
5. CI will run: build, lint, unit tests, Storybook tests, Chromatic visual tests, and E2E tests

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
