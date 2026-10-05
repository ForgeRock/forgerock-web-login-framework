# Demo Components

> 🧪 **Experimental feature.** These demos are part of an early-access feature that is actively evolving.

This directory contains fully commented reference implementations of custom stage, callback, header, and footer components. Use them as templates when building your own.

## How to use

1. Pick the template that matches what you want to build:

   - `stages/custom-login/` — stage override (replaces an entire form layout)
   - `callbacks/custom-name/` — callback override (replaces a single input renderer)
   - `headers/custom-header/` — page-level header (branding, nav links; no props)
   - `footers/custom-footer/` — page-level footer (legal, links, markup; no props)

2. Copy the directory into the correct scanned location:

   ```sh
   # Stage override
   cp -r experimental/custom/demo/stages/custom-login \
         experimental/custom/stages/my-login

   # Callback override
   cp -r experimental/custom/demo/callbacks/custom-name \
         experimental/custom/callbacks/my-name

   # Page header
   cp -r experimental/custom/demo/headers/custom-header \
         experimental/custom/headers/my-header

   # Page footer
   cp -r experimental/custom/demo/footers/custom-footer \
         experimental/custom/footers/my-footer
   ```

3. Update the `@component` header in the `.svelte` file:

   - Change `Name:` to a unique component name (stages and callbacks may instead name the stage/callback they override).
   - Keep `Type:` unchanged (`stage`, `callback`, `header`, or `footer`).
   - For headers and footers only: add `Enabled: true` to bundle the component with the login app. It renders above (header) or below (footer) the journey. At most one header and one footer may declare it — a second enabled component of the same type fails the build. Without the line the component stays dormant on disk.

4. The framework's Vite plugin regenerates `custom-registry.ts` automatically — if `pnpm dev` is running, the new component is picked up within milliseconds. Otherwise:

   ```sh
   pnpm build:widget   # or start pnpm dev
   ```

## Directory layout

```
demo/
├── stages/
│   └── custom-login/
│       ├── custom-login.svelte        # heavily commented stage component
│       ├── custom-login.mock.ts       # mock AM step for Storybook / tests
│       ├── custom-login.story.svelte  # Storybook wrapper with store initialization
│       └── custom-login.stories.js   # CSF 3 stories (Base, WithError, Loading)
├── callbacks/
│   └── custom-name/
│       ├── custom-name.svelte         # heavily commented callback component
│       ├── custom-name.mock.ts        # mock AM response for Storybook / tests
│       ├── custom-name.story.svelte   # Storybook wrapper with metadata stubs
│       └── custom-name.stories.js    # CSF 3 stories (Base, Interaction)
├── headers/
│   └── custom-header/
│       ├── custom-header.svelte       # heavily commented header component (no props)
│       ├── custom-header.story.svelte # Storybook wrapper
│       └── custom-header.stories.js   # CSF 3 stories
└── footers/
    └── custom-footer/
        ├── custom-footer.svelte       # heavily commented footer component (no props)
        ├── custom-footer.story.svelte # Storybook wrapper
        └── custom-footer.stories.js   # CSF 3 stories
```

> **Note:** Files under `demo/` are committed to the repository as reference material.
> They are **not** scanned by the framework's Vite plugin and are **not** registered in
> `custom-registry.ts`. Only files under `experimental/custom/stages/`,
> `experimental/custom/callbacks/`, `experimental/custom/headers/`, and
> `experimental/custom/footers/` are picked up by the build.
