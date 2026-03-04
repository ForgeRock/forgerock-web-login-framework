/**
 * Barrel module — re-exports from runtime.ts and handler.ts for backwards compatibility.
 *
 * Existing consumers import from '$server/run' and continue to work unchanged.
 * New code may import directly from '$server/runtime' or '$server/handler'.
 */
export { run, initializeAppRuntime, initializeTestRuntime, getRuntime } from './runtime';
export type { AppServices } from './runtime';

export {
  handleRoute,
  handleRouteAsValue,
  handleFormAction,
  FormActionResult,
  annotateRequest,
} from './handler';
export type { RequestContext } from './handler';
