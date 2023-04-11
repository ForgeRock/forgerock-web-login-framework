<script>
  // import Image from '../../image.svelte';

  // export let data;
</script>

# Development Guidelines

## Requirements

### Technical

1. Node.js v16
2. npm v8

### Knowledge

1. JavaScript & TypeScript
2. Svelte
3. Tailwind
4. ES Modules

## Quick Start

### Install, build & run

Once you have cloned the repo to your local environment (`git clone`), run the following commands from within the project directory:

1. `npm install` (or simply `npm i`)
2. `npm run build`
3. `npm run dev` (leave running)

This will install all the necessary dependencies, build the project and run it in `dev` mode, providing you with Hot Module Reloading. This will also produce the Widget package for use in external applications.

For additional tooling, here are optional commands for helping develop this framework:

- `npm run storybook`; runs Storybook locally to help build the UI components ([`storybook.js.org`](https://storybook.js.org/))
- `npm t`; runs Vitest to continuously run unit tests to help build utility functions ([`vitest.dev`](https://vitest.dev/))
- `npm run test:storybook`; runs Storybook integration tests to verify UI component behavior ([Interaction test docs](https://storybook.js.org/docs/react/writing-tests/interaction-testing))
- `npm run test:e2e`; runs Playwright end-to-end tests to verify application soundness ([`playwright.dev`](https://playwright.dev/))

## Project overview

This framework is broken into layers of responsibilities and patterns. Our intention is to abide by the building with small modules of code that try to do singular responsibilities and offer high degrees of "composability".

### The `lib` directory

The code within this directory is shared code and will not have a preference for the type of deployment or "form factor" is being used. A deployment type would be a stand-alone app versus an embedded Widget. A form factor is the type of Widget: modal or inline.

The following are the patterns of modules that make up this `lib` directory:

1. Components: generic UI modules
   1. Primitives: smallest unit of a UI component with lowest specificity
   2. Compositions: UI component that is comprised of primitives
   3. Icons: UI components solely for rendering accessible icons
2. Utilities: generic pure-stateless functions with singular, data-centric responsibilities
3. Stores: reactive state-management objects for handling larger sets of data shared between components

Here are the main directories within the `lib` directory:

1. `_utilities`: highest level shared utility functions
2. `components`: corresponds to the patterns explained above
3. `journey`: collection of components, utilities and stores specific to AM journeys/trees
4. `oauth`: collection of modules for OAuth support
5. `server`: collection of modules for the server support
6. `user`: collection of modules for user related support

### The `locales` directory

This directory stores the locale JSON files for translations. These files are flat, key-value pairs with the translated content.

### The `routes` directory

This directory contains all the routes of this project. This is the standard SvelteKit routes directory. SvelteKit is leveraged in many ways within this project, so here's a breakdown of their usage:

1. `(app)`: contains the routes of the deployable, stand-alone Login Application
2. `api`: contains the routes of the deployable back-end/procy for the login application
3. `docs`: contains this project's documentation
4. `e2e`: contains this project's end-to-end test targets

### The `widget` directory

This directory contains the source code that produces the embeddable, Login Widget. It contains the two form factors (modal and inline) as well as the CSS files.

Any and all code specifically related to the Widget's behavior or rendering will reside within this directory. None of this code will be shared with the deployable Login Application.
