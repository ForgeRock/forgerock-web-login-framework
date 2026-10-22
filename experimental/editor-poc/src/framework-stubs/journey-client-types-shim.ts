// Runtime shim for `@forgerock/journey-client/types`.
//
// The real `./types` export maps to a .d.ts only (type-only surface), but
// core/ re-exports RUNTIME values through it: step.mock.ts imports
// `createCallback` from '@forgerock/journey-client/types', and TS elides type
// imports so the widget build never needed a runtime module there. The editor
// preview DOES need the runtime: the whole point (IAM-12011) is rendering mock
// journey steps built by createJourneyStep through real callback components.
//
// This shim re-exports the real factory machinery from the installed package
// (pure in-memory callback construction, no network code). Types come from the
// package's .d.ts via the module declaration in journey-client-types.d.ts.
export { createCallback } from '#journey-client-factory';
export { PolicyKey, StepType } from '@forgerock/sdk-types';
