# Custom Component Bundle Contract

> 🧪 **Experimental feature.** Runtime Custom Component bundles are an
> early-access feature — this contract may change between releases.

This document defines how a **Custom Component bundle** is built, exported,
delivered, and loaded by the Login App and Login Widget at runtime — without
rebuilding or redeploying either one when a component is published.

## The bundle

A bundle is an **ES module** whose default-free named exports declare custom
components for the runtime registries:

```js
// bundle.js
export const stages = {
  DefaultLogin: {
    component: MyLoginStage, // Svelte component (constructor or Svelte 5 Component)
    acceptedProps: ['componentStyle', 'form', 'formEl', 'journey', 'metadata', 'step'],
  },
};

export const callbacks = {
  NameCallback: {
    component: MyNameInput,
    acceptedProps: ['callback', 'callbackMetadata', 'style', 'selfSubmitFunction', 'stepMetadata'],
  },
};

// Page wrappers — singular entries, not registries. The page renders exactly
// one header and one footer; a bundle supplies its own or omits the key
// (the static wrapper file is the fallback). Accepted prop: `journeyName`.
export const header = {
  component: MyHeader,
  acceptedProps: ['journeyName'],
};

export const footer = {
  component: MyFooter,
  acceptedProps: ['journeyName'],
};
```

### Export rules

| Rule          | Detail                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Shape         | `stages`, `callbacks`, `header`, and `footer` are all optional; at least one must be present            |
| Entry         | `{ component, acceptedProps }` — `acceptedProps` is **required**; the mapper forwards only listed props |
| Keys          | Registry keys are AM stage names (`DefaultLogin`) or callback type names (`NameCallback`)               |
| Wrappers      | `header` and `footer` are singular entries, not records — one per bundle                                |
| Reserved keys | `__proto__` and `constructor` are rejected and fail the load                                            |
| Component     | Must be a function (Svelte component). A non-function fails the load                                    |

The same `CustomRegistryEntry` shape is used by the compile-time registry
(`custom-registry.ts`), so a component can move between build-time and
runtime delivery without source changes. Stage and callback prop contracts are
documented in [`README.md`](./README.md) (Component props).

### The Svelte version constraint

The bundle must execute against **the same Svelte runtime instance as the
host** (widget or app). A Svelte runtime is the library code plus the state it
holds once loaded: the signal graph, the scheduler, which components are
mounted and which DOM nodes belong to them. That state is per-copy — two
copies in one page cannot see each other's bookkeeping, and a component built
against copy B crashes when the host's copy A tries to mount it. **A
`bundle.js` that contains an inlined copy of the Svelte runtime is therefore
never valid for us, regardless of where or how it was built.** Compiler and
runtime Svelte versions must also match — output from a newer compiler can
fail on an older runtime.

#### ⚠️ How the bundle MUST be built: `external` in the bundle's own build config

Where the change is necessary: **the bundle's build config — the publish
pipeline's Vite config that produces `bundle.js` (IAM-12133 / Component API
`publish`), not the host app and not our loader code.**

By default, Vite/Rollup _copies every imported library into the output_ — so a
bundle built with defaults physically contains Svelte inside `bundle.js` (an
inlined second runtime; the page then runs two Svelte runtimes and breaks at
mount). The build must be told to leave framework imports as **bare
specifiers** in the output instead of copying them:

```js
// bundle build config (publish pipeline) — the one required line:
export default defineConfig({
  // ...lib entry, plugins...
  build: {
    rollupOptions: {
      external: [/^svelte/, /^@forgerock/],
    },
  },
});
```

`external` means: "when you see an import of `svelte/*` or `@forgerock/*`, do
NOT copy it — leave the `import ... from 'svelte'` statement in `bundle.js`."
The output then contains only the component code plus bare imports, and the
**host-owned import map** (declared by the host page before any module loads;
one map per page in Firefox, none after a module has executed) resolves those
bare specifiers to the host's single already-loaded copy. The shared-package
work (IAM-12133) puts the framework and Svelte at the stable URLs the map
points to. The script-tag (IIFE) widget build is **not supported** for runtime
bundles in v1 — an IIFE inlines everything, so no bare imports survive for
the map to redirect.

## Delivery

|                   | Same-build (local host build)                                         | Cross-build (production target)                                                         |
| ----------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Built by          | The host app's own Vite config                                        | Publish pipeline (Component API `publish`)                                              |
| Framework imports | Shared with the host (same Rollup invocation)                         | `external: [/^svelte/, /^@forgerock/]` → bare specifiers + import map                   |
| Deployed as       | Static file served by the app                                         | `{commitSha}.bundle.js` beside component records (see the IAM-12142 traceability spike) |
| Consumed via      | `PUBLIC_COMPONENT_BUNDLE_URL` (app) / `customComponents.url` (widget) | Same option, URL points at the served artifact                                          |

Naming: the publish pipeline writes `bundle.js` today; the traceability
decision (IAM-12142) is `{commitSha}.bundle.js` so a deployment can be traced
to the commit that produced it.

## Loading

- **Login Widget** — `configure({ customComponents: { url } })`. The bundle is
  fetched and registered during `configure()`, before any journey starts. A
  failed load is **non-fatal**: it is logged to `console.error` and the
  journey proceeds on core (and compile-time custom) components.
- **Login App** — `PUBLIC_COMPONENT_BUNDLE_URL` env var. Each page loads the
  bundle once before starting a journey (login, register). Same non-fatal
  behavior; a load failure never blocks login.

## Precedence

Components are resolved in this order — first hit wins:

1. **Runtime bundle** entries (`runtimeRegistryStore`)
2. **Compile-time custom** components (`custom-registry.ts`, from
   `experimental/custom/{stages,callbacks}/`)
3. **Built-in** core stages/callbacks
4. **`externalStages`** (host-provided detect-function stages) and the
   `Generic` fallback

Rationale: an admin-published bundle is the most recent deliberate deployment
of a component; local dev files are older by definition.

Page wrappers follow the same rule per slot: a bundle-supplied `header` or
`footer` replaces the static wrapper file for the page; with no bundle entry
(or an empty registry), the static wrapper renders as before.

## API

| Function                       | Location                                                         | Purpose                                                                                              |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `loadCustomBundle(url, deps?)` | `core/journey/_utilities/registry/load-custom-bundle.effects.ts` | Fetch, validate, register. Throws on load/shape failure. `deps.importModule` is injectable for tests |
| `setRuntimeRegistries(bundle)` | `core/journey/_utilities/registry/runtime-registry.store.ts`     | Populate the runtime registries from validated contents                                              |
| `resetRuntimeRegistries()`     | same                                                             | Empty the runtime registries                                                                         |
