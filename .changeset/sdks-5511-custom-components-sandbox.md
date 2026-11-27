---
'@forgerock/login-widget': minor
'@forgerock/login-framework-cli': major
---

**Breaking: custom components moved from `experimental/custom/` to `custom/components/`.** Projects scaffolded by CLI 0.2.x keep their components under `experimental/custom/{stages,callbacks}/`, and the framework no longer scans or builds that location, so after updating, existing custom components silently drop out of the app. Both the framework Vite plugin (at build start) and `ping-lf update` detect a legacy `experimental/custom/` tree that still contains Svelte files and warn with the steps below. To migrate:

1. Move each component directory from `experimental/custom/stages/<name>` and `experimental/custom/callbacks/<name>` into `custom/components/stages/` and `custom/components/callbacks/`.
2. Update the moved components' imports to the `$login-framework` surface module (`custom/components/login-framework.ts`).
3. Run `ping-lf update` to refresh the framework-owned files (including the curated surface file), then build: the Vite plugin regenerates the component registry from the new location.

Because the CLI's project layout and update behavior change for existing projects, `@forgerock/login-framework-cli` ships this change as a major release.

`ping-lf update` now treats `custom/` as a customer-owned sandbox: the update copy skips everything under it (components, wrappers, README, demo), so customer edits survive every upgrade. The one exception is the framework-owned curated surface file `custom/components/login-framework.ts`: it is versioned by the framework even though it lives inside the sandbox, so update explicitly refreshes it from the update source, overwriting the project's copy (a framework source that predates the surface file only warns and keeps the existing copy). Every other path under `custom/` stays customer-owned, and `init` remains the only other flow that writes inside the sandbox. A core build whose project has no curated surface file fails with the restore instructions (`ping-lf update`, or re-copy the file from the framework repository) instead of a raw ENOENT.

Custom component source is now boundary-checked at build time: a production file under `custom/components/` that imports an internal alias (`$core`, `$journey`, `$components`, `$locales`), a runtime `@forgerock/journey-client` module (type-only imports from `@forgerock/journey-client/types` stay allowed), or anything resolving outside `custom/components/` fails the build with the offending import listed and the allowed forms named. Test, mock, and Storybook story files, and the curated `login-framework.ts` surface itself, are exempt. The CLI and MCP `generate` scaffolds and the checked-in demo components carry the documented prop contract in their headers: the framework passes exactly the documented props, callback values move through `getInputValue`/`setInputValue`, stages submit through `form.submit()`, `journey.loading` is authoritative, and AM-derived content renders as text only.
