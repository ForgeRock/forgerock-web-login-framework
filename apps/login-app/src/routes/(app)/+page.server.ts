import type { Actions, PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';
import { Effect } from 'effect';

import {
  deleteAuthCookies,
  deleteOauthCookie,
  deleteSessionCookie,
  readCookiesAsMap,
  unsealAuthId,
  unsealStep,
} from '$server/cookie-crypto';
import { RequestBodyError } from '$server/errors';
import {
  type AuthIndexParams,
  buildInitQueryParams,
  loadOptionalOauth,
  loadOptionalSession,
  processAmResponse,
} from '$server/page-helpers';
import { FormActionResult, handleFormAction, run } from '$server/run';
import { checkRateLimit } from '$server/request';
import { AmProxyService } from '$server/services/am-proxy';
import { AppConfigService } from '$server/services/app-config';
import { mergeFormDataIntoStep, buildAmRequestBody, buildAmQueryString } from '$server/step-mapper';

// ─── Load Function ───────────────────────────────────────────────────────────

/**
 * Load function: checks for existing step cookies and returns step data.
 * Runs on initial page load AND after each form action.
 */
export const load: PageServerLoad = async (event) => {
  const cookies = readCookiesAsMap(event.cookies);
  const unsealedStep = Effect.all({ config: AppConfigService }).pipe(
    Effect.flatMap(({ config }) =>
      unsealStep(cookies).pipe(
        Effect.map((step) =>
          FormActionResult.step({
            callbacks: step.callbacks,
            stage: step.stage,
            header: step.header,
            description: step.description,
          }),
        ),
        Effect.catchTag('CookieMissing', () =>
          Effect.succeed(FormActionResult.step({ callbacks: [] })),
        ),
        Effect.catchTag('CookieDecryptionFailed', (err) => {
          deleteAuthCookies(event.cookies, config);
          deleteSessionCookie(event.cookies, config);
          return Effect.logWarning('Step cookie decryption failed in load').pipe(
            Effect.annotateLogs({ cookie: err.cookie, cause: String(err.cause) }),
            Effect.as(FormActionResult.error('Session expired, please try again')),
          );
        }),
        Effect.catchTag('CookieSchemaError', (err) => {
          deleteAuthCookies(event.cookies, config);
          deleteSessionCookie(event.cookies, config);
          return Effect.logWarning('Step cookie schema validation failed in load').pipe(
            Effect.annotateLogs({ cookie: err.cookie, cause: String(err.cause) }),
            Effect.as(FormActionResult.error('Session expired, please try again')),
          );
        }),
      ),
    ),
  );

  return unsealedStep.pipe(handleFormAction({ method: 'GET', pathname: event.url.pathname }), run);
};

// ─── Form Actions ────────────────────────────────────────────────────────────

export const actions: Actions = {
  /**
   * Initialize a new authentication flow.
   * Sends an empty POST to AM's /authenticate endpoint.
   */
  init: async (event) => {
    const { authIndexType, authIndexValue, queryString } = buildInitQueryParams(
      event.url.searchParams,
    );
    const authIndexParams: AuthIndexParams = {
      authIndexType: authIndexValue ? authIndexType : undefined,
      authIndexValue: authIndexValue || undefined,
    };
    const cookies = readCookiesAsMap(event.cookies);

    const result = await checkRateLimit(event.getClientAddress(), '/init').pipe(
      Effect.andThen(
        Effect.all({
          config: AppConfigService,
          amProxy: AmProxyService,
          oauthQuery: loadOptionalOauth(cookies).pipe(
            Effect.catchTag('SessionCorrupted', () => Effect.succeed(undefined)),
          ),
        }),
      ),
      Effect.bind('amResponse', ({ amProxy }) =>
        amProxy.authenticate({ body: '{}', cookie: '', queryString }),
      ),
      Effect.flatMap(({ config, amResponse, oauthQuery }) =>
        processAmResponse(amResponse, config, event.cookies, authIndexParams, oauthQuery),
      ),
      handleFormAction({ method: 'POST', pathname: `${event.url.pathname}?/init` }),
      run,
    );

    if (result._tag === 'AuthComplete' && result.redirectTo) {
      redirect(303, result.redirectTo);
    }

    return result;
  },

  /**
   * Submit a form step to AM.
   * Reads FormData, merges into stored callbacks, submits to AM.
   */
  step: async (event) => {
    const cookies = readCookiesAsMap(event.cookies);

    const result = await checkRateLimit(event.getClientAddress(), '/step').pipe(
      Effect.andThen(
        Effect.all({
          config: AppConfigService,
          amProxy: AmProxyService,
          authId: unsealAuthId(cookies),
          stepData: unsealStep(cookies),
          sessionData: loadOptionalSession(cookies),
          oauthQuery: loadOptionalOauth(cookies),
          formData: Effect.tryPromise({
            try: () => event.request.formData(),
            catch: (cause) => new RequestBodyError({ cause }),
          }),
        }),
      ),
      Effect.let('mergeResult', ({ stepData, formData }) =>
        mergeFormDataIntoStep(stepData, formData),
      ),
      Effect.tap(({ mergeResult }) =>
        Effect.forEach(mergeResult.warnings, (w) => Effect.logWarning(w)),
      ),
      Effect.bind('requestBody', ({ authId, mergeResult }) =>
        buildAmRequestBody(authId, mergeResult.step),
      ),
      Effect.flatMap(({ config, amProxy, requestBody, mergeResult, sessionData, oauthQuery }) =>
        amProxy
          .authenticate({
            body: requestBody,
            cookie: sessionData?.amCookie ?? '',
            queryString: buildAmQueryString(mergeResult.step),
          })
          .pipe(
            Effect.flatMap((amResponse) =>
              processAmResponse(
                amResponse,
                config,
                event.cookies,
                {
                  authIndexType: mergeResult.step.authIndexType,
                  authIndexValue: mergeResult.step.authIndexValue,
                },
                oauthQuery,
              ),
            ),
          ),
      ),
      Effect.catchTag('SessionCorrupted', () =>
        AppConfigService.pipe(
          Effect.tap((config) =>
            Effect.sync(() => {
              deleteAuthCookies(event.cookies, config);
              deleteSessionCookie(event.cookies, config);
              deleteOauthCookie(event.cookies, config);
            }),
          ),
          Effect.as(FormActionResult.error('Your session has expired. Please start over.')),
        ),
      ),
      handleFormAction({ method: 'POST', pathname: `${event.url.pathname}?/step` }),
      run,
    );

    if (result._tag === 'AuthComplete' && result.redirectTo) {
      redirect(303, result.redirectTo);
    }

    return result;
  },
};
