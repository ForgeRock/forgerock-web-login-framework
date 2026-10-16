# Demo Components

> 🧪 **Experimental feature.** These demos are part of an early-access feature that is actively evolving.

This directory contains fully commented reference implementations of custom stage and callback components. Use them as templates when building your own.

## How to use

1. Pick the template that matches what you want to build:

   - `stages/custom-login/` — stage override (replaces an entire form layout)
   - `callbacks/custom-name/` — callback override (replaces a single input renderer)
   - `header/branded-header/` — branded page header (worked example for the wrapper)
   - `footer/branded-footer/` — branded page footer (worked example for the wrapper)

2. Copy the directory into the correct scanned location:

   ```sh
   # Stage override
   cp -r experimental/custom/demo/stages/custom-login \
         experimental/custom/stages/my-login

   # Callback override
   cp -r experimental/custom/demo/callbacks/custom-name \
         experimental/custom/callbacks/my-name
   ```

3. Update the `@component` header in the `.svelte` file (stages and callbacks only):

   - Change `Name:` to a unique component name (stages and callbacks may instead name the stage/callback they override).
   - Keep `Type:` unchanged (`stage` or `callback`).

4. The framework's Vite plugin regenerates `custom-registry.ts` automatically — if `pnpm dev` is running, the new component is picked up within milliseconds. Otherwise:

   ```sh
   pnpm build:widget   # or start pnpm dev
   ```

> **Page headers and footers are different.** They are not registry components. Edit the fixed wrapper files directly at `experimental/custom/header/header.svelte` and `experimental/custom/footer/footer.svelte`. The `header/` and `footer/` demos here are not copy-and-register templates — copy their markup and styles **into** the wrapper files, then verify with `pnpm dev` or by adding your own stories in the wrapper folders (they are yours, like `stages/` and `callbacks/`).

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
├── header/
│   └── branded-header/
│       ├── branded-header.svelte      # branded header example (branches on journeyName)
│       ├── branded-header.story.svelte # Storybook wrapper with store initialization
│       └── branded-header.stories.js  # CSF 3 stories (Default, Named, Register, Interaction)
└── footer/
    └── branded-footer/
        ├── branded-footer.svelte      # branded footer example (branches on journeyName)
        ├── branded-footer.story.svelte # Storybook wrapper with store initialization
        └── branded-footer.stories.js  # CSF 3 stories (Default, Named, Register, Interaction)
```

> **Note:** Files under `demo/` are committed to the repository as reference material.
> They are **not** scanned by the framework's Vite plugin and are **not** registered in
> `custom-registry.ts`. Only files under `experimental/custom/stages/` and
> `experimental/custom/callbacks/` are picked up by the build.
