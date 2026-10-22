/**
 * Preview-only `$login-framework` surface for the editor PoC (IAM-12011).
 *
 * Re-exports the curated custom-component surface (experimental/custom/
 * login-framework.ts) plus the widget runtime API that the published entry
 * (packages/login-widget/src/lib/index.svelte `<script context="module">`)
 * exports from its module context: configure, journey, component, user,
 * protect. This is what task 5's demo imports.
 *
 * Why a separate file instead of extending the curated surface: the curated
 * file is aliased by BOTH production builds (packages/login-widget/vite.config
 * .ts:58, apps/login-app/vite.config.ts:24), so widget-runtime exports there
 * would drag widget.api.ts into every production bundle and construct a second
 * widgetApiFactory instance per import site — store state would split between
 * the two instances. The preview surface composes instead of extending, so
 * production bundles stay untouched.
 */
export * from '../../../experimental/custom/login-framework';

import { componentApi } from '../../../packages/login-widget/src/lib/_utilities/component.utilities';
import { widgetApiFactory } from '../../../packages/login-widget/src/lib/widget.api';

// Same construction as the published entry: one factory call, the returned
// API delegates to real core/ stores. `configure` must be awaited before any
// other API call (see widget.api.ts); in the preview the AM journey request
// is mocked at the journey-client module boundary, so configure() only needs
// valid serverConfig-shaped values to parse.
const api = widgetApiFactory(componentApi());

export const configure = api.configure;
export const journey = api.journey;
export const component = componentApi;
// getStores exposes the raw journey/oauth/user stores — the widget runtime
// test (task 5) drives journeyStore.next() directly, mirroring what
// journey.svelte's submitForm does internally. Not part of the published
// module exports (the published entry keeps it private), but the factory
// already returns it, so the preview re-exports without extra surface.
export const getStores = api.getStores;
export const user = api.user;
export const protect = api.protect;
