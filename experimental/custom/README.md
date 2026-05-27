# Custom Components (`/experimental/custom`)

> 🧪 **Experimental feature.** Custom components are an early-access feature — the API may change between releases as we refine it.

This directory is the entry point for your custom journey components. Files here are **never overwritten by upstream framework updates** — this is where your customizations live.

## Directory structure

```
experimental/custom/
├── stages/
│   └── <your-stage-name>/
│       ├── <component>.svelte       # required
│       ├── <utility>.ts             # optional
│       ├── <utility>.test.ts        # optional
│       ├── <component>.stories.js   # optional (Storybook)
│       └── <component>.story.svelte # optional (Storybook)
└── callbacks/
    └── <your-callback-name>/
        └── (same structure as above)
```

## Component format

Every `.svelte` file must begin with an HTML comment block that declares its type and name:

```svelte
<!--
@component
Type: stage
Name: DefaultLogin
-->

<script>
  export let componentStyle;
  export let form;
  export let formEl;
  export let journey;
  export let metadata;
  export let step;
</script>

<main>
  <!-- your custom layout here -->
</main>

<!-- <style> is optional; scoped to this component and takes final precedence -->
```

The `@component` comment is required. The framework's Vite plugin reads it to register your component during dev and build. **A missing or malformed header will fail the build.**

## Types

| Type       | What it replaces                         | Scope                     |
| ---------- | ---------------------------------------- | ------------------------- |
| `stage`    | The entire form layout for a named stage | One stage only            |
| `callback` | A specific callback type renderer        | Every occurrence globally |

## Component props

### Stage component props

| Prop             | Type                                                           | Description                        |
| ---------------- | -------------------------------------------------------------- | ---------------------------------- |
| `componentStyle` | `'app' \| 'inline' \| 'modal'`                                 | Current widget form factor         |
| `form`           | `StageFormObject`                                              | Form data and field helpers        |
| `formEl`         | `HTMLFormElement \| null`                                      | Reference to the form DOM element  |
| `journey`        | `StageJourneyObject`                                           | Journey-level metadata and actions |
| `metadata`       | `Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>` | Step and callback metadata         |
| `step`           | `JourneyStep`                                                  | The raw Journey Client step object |

### Callback component props

| Prop                 | Type                        | Description                              |
| -------------------- | --------------------------- | ---------------------------------------- |
| `callback`           | `BaseCallback`              | The specific callback instance           |
| `callbackMetadata`   | `Maybe<CallbackMetadata>`   | Metadata for this callback               |
| `style`              | `StyleSchema`               | Style directives from the widget         |
| `selfSubmitFunction` | `Maybe<SelfSubmitFunction>` | Call to submit the form programmatically |
| `stepMetadata`       | `Maybe<StepMetadata>`       | Metadata for the current step            |

## Rules

- **Override**: set `Name` to an existing stage/callback name (e.g. `DefaultLogin`, `NameCallback`) — your component will be used instead of the core one.
- **Extend**: set `Name` to a brand-new identifier to handle a custom AM stage or custom callback node not built into the framework.
- HTML is **not required** — logic-only components (e.g. telemetry, protect callbacks) are valid.
- Component-level `<style>` is scoped and always wins over theme styles.
- You **cannot** create new server-side callback types from this directory — new callback `Name` values only work when paired with a matching custom AM node.

## Module imports available

Inside your custom component, import everything you need from the **`$login-framework`** alias — a centralized set of exports from the login framework for custom components:

```ts
import {
  // UI components
  Stacked,
  Button,
  Alert,
  Form,
  T,
  CallbackMapper,
  // Utilities
  interpolate,
  textToKey,
  convertStringToKey,
  captureLinks,
  styleStore,
  // Types
  type CallbackMetadata,
  type SelfSubmitFunction,
  type StepMetadata,
  type StageFormObject,
  type StageJourneyObject,
  type Maybe,
  type StyleObject,
} from '$login-framework';
```

`$login-framework` re-exports a curated subset of the login framework — you never need to reach into internal aliases like `$core`, `$components`, or `$journey` directly. The full list of available exports is documented in [`experimental/custom/login-framework.ts`](./login-framework.ts).

Journey Client types (callback classes, `JourneyStep`, etc.) are imported directly from `@forgerock/journey-client/types`:

```ts
import type { NameCallback, JourneyStep } from '@forgerock/journey-client/types';
```

## Hot module reloading note

The framework's Vite plugin watches `experimental/custom/{stages,callbacks}/` during `pnpm dev` and regenerates `custom-registry.ts` automatically when you add, remove, or rename a component file. Editing an existing registered component reloads normally via Vite HMR.

If you generate a component while only Storybook is running (Storybook uses its own Vite config and doesn't load this plugin), trigger a regeneration with:

```sh
pnpm build:widget   # or restart pnpm dev
```
