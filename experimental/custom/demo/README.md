# Demo Components

> 🧪 **Experimental feature.** These demos are part of an early-access feature that is actively evolving.

This directory contains fully commented reference implementations of custom stage and callback components. Use them as templates when building your own.

## How to use

1. Pick the template that matches what you want to build:

   - `stages/custom-login/` — stage override (replaces an entire form layout)
   - `callbacks/custom-name/` — callback override (replaces a single input renderer)

2. Copy the directory into the correct scanned location:

   ```sh
   # Stage override
   cp -r experimental/custom/demo/stages/custom-login \
         experimental/custom/stages/my-login

   # Callback override
   cp -r experimental/custom/demo/callbacks/custom-name \
         experimental/custom/callbacks/my-name
   ```

3. Update the `@component` header in the `.svelte` file:

   - Change `Name:` to the stage/callback name you want to override, or a brand-new name for an extension.
   - Keep `Type: stage` or `Type: callback` unchanged.

4. Rebuild to regenerate `custom-registry.ts`:

   ```sh
   pnpm build:widget   # or restart pnpm dev
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
└── callbacks/
    └── custom-name/
        ├── custom-name.svelte         # heavily commented callback component
        ├── custom-name.mock.ts        # mock AM response for Storybook / tests
        ├── custom-name.story.svelte   # Storybook wrapper with metadata stubs
        └── custom-name.stories.js    # CSF 3 stories (Base, Interaction)
```

> **Note:** Files under `demo/` are committed to the repository as reference material.
> They are **not** scanned by the pre-build script and are **not** registered in
> `custom-registry.ts`. Only files under `experimental/custom/stages/` and
> `experimental/custom/callbacks/` are picked up by the build.
