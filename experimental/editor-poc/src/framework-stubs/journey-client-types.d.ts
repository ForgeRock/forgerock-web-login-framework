// Type declarations for the journey-client-types-shim — the real surface of
// `@forgerock/journey-client/types` as TS resolves it in the login-widget
// build (types.d.ts), minus what the shim does not provide at runtime.
declare module '@forgerock/journey-client/types' {
  export type {
    Step,
    Callback,
    CallbackType,
    GenericError,
    WellknownResponse,
    PolicyRequirement,
    FailedPolicyRequirement,
    NameValue,
    PolicyParams,
    StepDetail,
    AuthResponse,
    FailureDetail,
  } from '@forgerock/sdk-types';
  export { PolicyKey, StepType } from '@forgerock/sdk-types';
  export type { BaseCallback } from '@forgerock/journey-client/dist/src/lib/callbacks/base-callback';
  export { createCallback } from '#journey-client-factory';
  export type { JourneyStep } from '@forgerock/journey-client/dist/src/lib/step.types';
  export type {
    StartParam,
    ResumeOptions,
    NextOptions,
  } from '@forgerock/journey-client/dist/src/lib/interfaces';
}
