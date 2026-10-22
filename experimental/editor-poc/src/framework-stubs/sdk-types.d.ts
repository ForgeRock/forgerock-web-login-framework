// Type declaration for @forgerock/sdk-types — vite resolves the REAL package
// via the vite.config.ts alias at runtime (so `callbackType` is the genuine
// const object; see journey-client-mock.ts for why it must not be copied).
// This declaration only keeps `npx tsc --noEmit` quiet inside editor-poc,
// which cannot resolve the pnpm-nested package on its own. Surface mirrors
// what this PoC consumes from the package (callbackType, PolicyKey, StepType).
declare module '@forgerock/sdk-types' {
  export const callbackType: Record<string, string>;

  export enum PolicyKey {}

  export enum StepType {}
}
