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

The app runs at `https://localhost:8443` by default.

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

| Variable              | Required | Description                                                                                                               |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `FR_AM_URL`           | Yes      | ForgeRock AM base URL (e.g., `https://openam-sdks.forgeblocks.com/am`)                                                    |
| `FR_AM_COOKIE_NAME`   | Yes      | AM session cookie name                                                                                                    |
| `FR_REALM_PATH`       | Yes      | AM realm path                                                                                                             |
| `FR_AM_WELLKNOWN_URL` | Yes      | ForgeRock AM Wellknown URL (e.g., `https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration`) |

## Type Checking

```shell
pnpm check:svelte
```

---

&copy; Copyright 2022-2026 Ping Identity Corporation. All Rights Reserved.
