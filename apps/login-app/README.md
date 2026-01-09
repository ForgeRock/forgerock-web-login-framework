# Login App

A [SvelteKit](https://kit.svelte.dev/) application used for development, documentation, and E2E test hosting.

## Purpose

This app serves multiple roles:

- **Development**: Provides a live environment for developing and testing the `@forgerock/login-widget` package
- **Documentation**: Hosts rendered documentation pages via [mdsvex](https://mdsvex.pngwn.io/)
- **E2E Test Host**: The Playwright E2E tests run against this app's built output

The app consumes the widget via a `workspace:*` dependency, meaning it always uses the local version from `packages/login-widget`.

## Running the App

### From the Repository Root (Recommended)

```shell
# Builds the widget first, then starts the dev server
pnpm dev
```

### Directly

```shell
# Build the widget first
pnpm build:widget

# Then start the dev server
pnpm --filter @forgerock/login-app run dev
```

The app runs at `http://localhost:5173` by default (Vite's default port).

## Building

```shell
# Build both the widget and app
pnpm build:app

# Or build just the app (widget must already be built)
pnpm --filter @forgerock/login-app run build

# Preview the production build
pnpm --filter @forgerock/login-app run preview
```

## Environment Variables

The app requires environment variables to connect to a ForgeRock AM instance. Set these in a `.env` file at the repository root or export them in your shell.

| Variable                      | Required | Description                                                            |
| ----------------------------- | -------- | ---------------------------------------------------------------------- |
| `VITE_FR_AM_URL`              | Yes      | ForgeRock AM base URL (e.g., `https://openam-sdks.forgeblocks.com/am`) |
| `VITE_FR_AM_COOKIE_NAME`      | Yes      | AM session cookie name                                                 |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | No       | OAuth 2.0 public client ID                                             |
| `VITE_FR_REALM_PATH`          | No       | AM realm path                                                          |

## Type Checking

```shell
pnpm check:svelte
```

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
