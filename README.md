[![npm version](https://img.shields.io/npm/v/@forgerock/login-widget?color=%23f46200&style=flat-square)](https://www.npmjs.com/package/@forgerock/login-widget)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<p align="center">
  <a href="https://github.com/ForgeRock">
    <img src="https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg" alt="ForgeRock Logo">
  </a>
  <h2 align="center">ForgeRock Web Login Framework</h2>
  <p align="center">
    <a href="https://www.npmjs.com/package/@forgerock/login-widget">npm</a>
    ·
    <a href="#support">Support</a>
    ·
    <a href="#documentation">Docs</a>
  </p>
  <hr/>
</p>

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Documentation](#documentation)
- [Support](#support)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

## Overview

The ForgeRock Login Widget is an all-inclusive UI component for adding authentication, user registration, and other self-service flows to your web applications.

It works with React, Vue, Angular, Svelte, and vanilla JavaScript — any modern client-side JavaScript framework. It does not currently support server-side rendering (SSR) or Node.js.

The widget uses [Journey Client](https://developer.pingidentity.com/orchsdks/journey/usage/javascript/index.html) for journey execution, and [OIDC Client](https://developer.pingidentity.com/orchsdks/oidc/usage/javascript-centralized-login.html) for OAuth/OIDC tokens and user info. It adds a UI rendering layer with state management. This rendering layer is built with [Svelte](https://svelte.dev/) and [Tailwind](https://tailwindcss.com/), but both are compiled away — the resulting widget is framework-agnostic with no runtime dependencies.

## Quick Start

Install the widget:

```shell
npm install @forgerock/login-widget
```

Import the CSS and widget, configure, and instantiate:

```js
import '@forgerock/login-widget/widget.css';
import Widget, { configure, journey } from '@forgerock/login-widget';

// configure() is async — await it before calling journey().start() or any other API
await configure({
  // REQUIRED — the well-known URL, shared by the journey and OIDC clients
  serverConfig: {
    wellknown:
      'https://your-tenant.forgeblocks.com/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration',
  },
  // REQUIRED if you use OAuth/OIDC tokens, user info, or logout
  oidcClient: {
    clientId: 'WebOAuthClient',
    redirectUri: `${window.location.origin}/callback`,
    scope: 'openid profile email', // OPTIONAL — defaults to 'openid'
  },
});

new Widget({ target: document.getElementById('widget-root') });

journey().start();
```

For the full API reference — including modal/inline form factors, component lifecycle, user management, styling, and content configuration — see the **[Widget API Documentation](packages/login-widget/README.md)**.

## Architecture

This repository is a [pnpm](https://pnpm.io/) monorepo with the following structure:

```
forgerock-web-login-framework/
├── packages/login-widget/   # @forgerock/login-widget — published to npm
├── apps/login-app/          # SvelteKit demo & documentation app
├── core/                    # Shared stores, components, and utilities
└── e2e/                     # Playwright end-to-end tests
```

| Directory                                         | Description                                                                                                                    | README                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| [`packages/login-widget`](packages/login-widget/) | The published npm package. Contains the widget source, Storybook stories, and Vitest unit tests.                               | [Widget README](packages/login-widget/README.md) |
| [`apps/login-app`](apps/login-app/)               | A SvelteKit application used for development, documentation, and E2E test hosting.                                             | [App README](apps/login-app/README.md)           |
| [`core`](core/)                                   | Shared TypeScript modules (stores, journey logic, OAuth, i18n) consumed via path aliases. Not a workspace — imported directly. | [Core README](core/README.md)                    |
| [`e2e`](e2e/)                                     | Playwright E2E test suite run across macOS and Ubuntu in CI with 4-shard parallelism.                                          | [E2E README](e2e/README.md)                      |

## Development

**Prerequisites**: Node.js >= 20, pnpm >= 10

```shell
# Clone and install
git clone https://github.com/forgerock/forgerock-web-login-framework.git
cd forgerock-web-login-framework
pnpm install

# Run the development app
pnpm dev

# Build the widget
pnpm build:widget

# Run unit tests
pnpm test

# Run linting and formatting
pnpm check:lint
```

For detailed contributor instructions, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.
For test documentation, see **[TESTING.md](TESTING.md)**.

## Documentation

Documentation for the Login Widget is provided at [ForgeRock Login Widget](https://docs.pingidentity.com/sdks/latest/login-widget/index.html), and includes topics such as:

- Instantiate the inline form factor
- Theme the widget
- API Reference
- Suspend journeys with "magic links"
- Log in with social authentication
- Log in with OATH one-time passwords

## Support

If you encounter any issues, be sure to check our **[Troubleshooting](https://support.pingidentity.com/s/article/How-do-I-troubleshoot-the-ForgeRock-SDK-for-JavaScript)** pages.

Support tickets can be raised whenever you need our assistance; here are some examples of when it is appropriate to open a ticket (but not limited to):

- Suspected bugs or problems with ForgeRock software.
- Requests for assistance — please look at the **[Documentation](https://docs.pingidentity.com/sdks/latest/login-widget/index.html)** and **[Knowledge Base](https://support.pingidentity.com/s/knowledge-base?category=Forgerock_SDK)** first.

You can raise a ticket using **[Ping Identity Support](https://support.pingidentity.com/s/)**, our customer support portal that provides one-stop access to ForgeRock services.

## Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)** for development setup, workflow, and conventions.

## Disclaimer

> **This code is provided by ForgeRock on an "as is" basis, without warranty of any kind, to the fullest extent permitted by law.
> ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy,
> timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express,
> or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose,
> and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use,
> implementation or configuration of this code, including but not limited to use for any commercial purpose.
> Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein
> ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
