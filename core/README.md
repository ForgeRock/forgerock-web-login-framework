# Core

Shared TypeScript modules consumed by both `packages/login-widget` and `apps/login-app`.

## Why Not a Workspace?

The `core/` directory is **not** a pnpm workspace package. Instead, it is imported directly via TypeScript path aliases. This avoids the overhead of a separate build step — core modules are compiled as part of whichever consumer imports them (the widget build or the SvelteKit app).

## Path Aliases

Defined in `core/tsconfig.json` and mirrored in each consumer's build configuration:

| Alias           | Resolves To         | Description                                          |
| --------------- | ------------------- | ---------------------------------------------------- |
| `$core`         | `core/`             | Root-level core modules (stores, config, interfaces) |
| `$core/*`       | `core/*`            | Any file within core                                 |
| `$components`   | `core/components/`  | Svelte UI components                                 |
| `$components/*` | `core/components/*` | Any component file                                   |
| `$journey`      | `core/journey/`     | Journey/authentication flow logic                    |
| `$journey/*`    | `core/journey/*`    | Any journey module                                   |
| `$locales`      | `core/locales/`     | Internationalization strings                         |
| `$locales/*`    | `core/locales/*`    | Any locale file                                      |

## Key Modules

```
core/
├── _utilities/          # Shared utility functions (i18n, etc.)
├── components/          # Svelte UI components shared across consumers
├── journey/             # Journey/authentication flow logic
│   ├── _utilities/      # Data analysis, metadata, step utilities
│   ├── config.store.ts  # Journey configuration store
│   └── ...
├── locales/             # i18n locale strings
├── oauth/               # OAuth/OIDC store and logic
├── server/              # Server interaction utilities
├── user/                # User info and token stores
├── component.store.ts   # Widget component lifecycle store
├── constants.ts         # Shared constants
├── interfaces.ts        # Shared TypeScript interfaces
├── links.store.ts       # Links configuration store
├── locale.store.ts      # Locale/content configuration store
├── sdk.config.ts        # SDK configuration store
├── style.store.ts       # Styling configuration store
└── tsconfig.json        # TypeScript config with path aliases
```

## Type Declarations

The `.d.ts` files alongside `.ts` files are generated type declarations. They provide type information to consumers without requiring a build step for the core module itself.

## Build Behavior

- **Widget build**: Core modules are bundled into the widget's `dist/` output. The widget's Vite config resolves the path aliases and includes core source during compilation.
- **Login-app**: SvelteKit resolves the aliases via its Vite config and compiles core modules as part of the app build.
- Core is **not** independently built or published.

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
