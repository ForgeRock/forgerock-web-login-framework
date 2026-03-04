import { randomUUID } from 'node:crypto';

import { HttpServerResponse } from '@effect/platform';
import { Effect } from 'effect';

import type { StepCookieData } from '$server/cookie-crypto';
import {
  type BffError,
  catchDefect,
  errorToMessage,
  errorToResponse,
  logBffError,
} from '$server/error-response';
import type { AppServices } from '$server/runtime';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Minimal request metadata for structured log annotations */
export interface RequestContext {
  readonly method: string;
  readonly pathname: string;
}

/** Result type for form action pipelines — discriminated union on `_tag` */
export type FormActionResult =
  | { readonly _tag: 'Step'; readonly step: StepCookieData }
  | { readonly _tag: 'Error'; readonly error: string }
  | { readonly _tag: 'AuthComplete'; readonly redirectTo?: string }
  | { readonly _tag: 'Defect'; readonly error: string };

/** Constructors for FormActionResult variants */
export const FormActionResult = {
  step: (step: StepCookieData): FormActionResult => ({ _tag: 'Step', step }),
  error: (error: string): FormActionResult => ({ _tag: 'Error', error }),
  authComplete: (redirectTo?: string): FormActionResult => ({ _tag: 'AuthComplete', redirectTo }),
  defect: (error: string): FormActionResult => ({ _tag: 'Defect', error }),
} as const;

// ─── Request Annotation ──────────────────────────────────────────────────────

/** Annotate all log output with requestId and optional HTTP context */
export const annotateRequest = (context?: RequestContext) =>
  Effect.annotateLogs({
    requestId: randomUUID(),
    ...(context && { method: context.method, pathname: context.pathname }),
  });

// ─── Effect Combinators ──────────────────────────────────────────────────────

/**
 * Pipeable combinator that wraps an HTTP handler Effect with BFF error handling.
 *
 * Annotates all log output with a unique `requestId`, HTTP `method`, and
 * `pathname`. Maps typed BFF errors to HTTP responses. Unhandled defects become 500s.
 * Converts the platform HttpServerResponse to a web Response at the boundary.
 */
export const handleRoute =
  (context?: RequestContext) =>
  <E extends BffError>(
    effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, AppServices>,
  ): Effect.Effect<Response, never, AppServices> =>
    effect.pipe(
      Effect.tapError(logBffError('route handler')),
      Effect.catchAll(errorToResponse),
      Effect.catchAllDefect(
        catchDefect('route handler', (ref) =>
          HttpServerResponse.text(`Internal server error [ref: ${ref}]`, { status: 500 }),
        ),
      ),
      Effect.map(HttpServerResponse.toWeb),
      Effect.withLogSpan('request'),
      annotateRequest(context),
    );

/**
 * Like `handleRoute` but returns success values as-is instead of requiring
 * Effect<HttpServerResponse, ...>. Errors and defects are converted to web
 * Response objects, so callers discriminate via `instanceof Response`.
 *
 * Useful for routes (like /api/authorize) that need to inspect the result
 * before deciding whether to throw a SvelteKit redirect.
 */
export const handleRouteAsValue =
  (context?: RequestContext) =>
  <A, E extends BffError>(
    effect: Effect.Effect<A, E, AppServices>,
  ): Effect.Effect<A | Response, never, AppServices> =>
    effect.pipe(
      Effect.tapError(logBffError('route handler')),
      Effect.catchAll((error) => errorToResponse(error).pipe(Effect.map(HttpServerResponse.toWeb))),
      Effect.catchAllDefect(
        catchDefect(
          'route handler',
          (ref) => new Response(`Internal server error [ref: ${ref}]`, { status: 500 }),
        ),
      ),
      Effect.withLogSpan('request'),
      annotateRequest(context),
    );

const defectResult = (ref: string): FormActionResult =>
  FormActionResult.defect(`Internal server error [ref: ${ref}]`);

/**
 * Pipeable combinator that wraps a form action Effect with BFF error handling.
 *
 * Unlike `handleRoute` (which produces a Response), this maps errors to
 * user-friendly messages in a FormActionResult, suitable for SvelteKit form actions.
 */
export const handleFormAction =
  (context?: RequestContext) =>
  <E extends BffError>(
    effect: Effect.Effect<FormActionResult, E, AppServices>,
  ): Effect.Effect<FormActionResult, never, AppServices> =>
    effect.pipe(
      Effect.tapError(logBffError('form action')),
      Effect.catchAll((error) =>
        errorToMessage(error).pipe(Effect.map((message) => FormActionResult.error(message))),
      ),
      Effect.catchAllDefect(catchDefect('form action', defectResult)),
      Effect.withLogSpan('request'),
      annotateRequest(context),
    );
