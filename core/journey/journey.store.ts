/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type {
  BaseCallback,
  JourneyStep,
  Step,
  StartParam,
  NextOptions,
  ResumeOptions,
  JourneyClient,
  GenericError,
} from '@forgerock/journey-client/types';
import { writable, type Writable } from 'svelte/store';

import { htmlDecode } from '$journey/_utilities/decode.utilities';
import type { JourneyStore, JourneyStoreValue, StackStore, StepTypes } from './journey.interfaces';
import { interpolate } from '$core/_utilities/i18n.utilities';
import {
  authIdTimeoutErrorCode,
  initCheckValidation,
  shouldPopulateWithPreviousCallbacks,
  shouldRedirectFromStep,
} from './stages/_utilities/step.utilities';
import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
import type { Maybe } from '$core/interfaces';
import { getJourneyClient } from '$core/journey-client.config';

/**
 * @function initializeJourney - Initializes the journey stack for tracking journey switches
 * @param {object} initOptions - The initial options to set
 * @returns {object} - The journey stack store with stack methods
 */
function initializeStack() {
  const { update, set, subscribe }: Writable<StartParam[]> = writable([]);

  // Assign to exported variable (see bottom of file)
  stack = {
    latest: async (): Promise<StartParam | undefined> => {
      return new Promise((resolve) => {
        // subscribe, grab the current value and unsubscribe
        subscribe((current) => {
          const lastItem = current[current.length - 1];
          resolve(lastItem);
        })();
      });
    },
    pop: async (): Promise<StartParam[]> => {
      return new Promise((resolve) => {
        update((current) => {
          let state;
          if (current.length) {
            state = current.slice(0, -1);
          } else {
            state = current;
          }
          resolve([...state]);
          return state;
        });
      });
    },
    push: async (options?: StartParam): Promise<StartParam[]> => {
      return new Promise((resolve) => {
        update((current) => {
          let state;

          if (!current.length) {
            state = options ? [options] : current;
          } else if (options && options?.journey !== current[current.length - 1]?.journey) {
            state = [...current, options];
          } else {
            state = current;
          }
          resolve([...state]);
          return state;
        });
      });
    },
    reset: () => {
      set([]);
    },
    subscribe,
  };

  return stack;
}

export const journeyStore: Writable<JourneyStoreValue> = writable({
  completed: false,
  error: null,
  loading: false,
  metadata: null,
  step: null,
  successful: false,
  response: null,
  recaptchaAction: null,
});

/**
 * @function initialize - Initializes the journey store
 * @returns {object} - The journey store
 */
export function initialize(): JourneyStore {
  const stack = initializeStack();
  let stepNumber = 0;
  // TODO: JourneyResult is not currently exported by Journey Client, so we define it here
  type JourneyResult = Awaited<ReturnType<JourneyClient['start']>>;

  async function start(startOptions?: StartParam, recaptchaAction?: string) {
    journeyStore.update((current) => ({
      ...current,
      completed: false,
      error: null,
      loading: true,
      step: null,
      successful: false,
      response: null,
      recaptchaAction: recaptchaAction ?? startOptions?.journey ?? null,
    }));

    if (startOptions) {
      await stack.push(startOptions);
    }

    let result;
    try {
      const journeyClient = await getJourneyClient();
      result = await journeyClient.start(startOptions);
    } catch (err) {
      console.error(`Start request | ${err}`);
      result = toGenericError(err);
    }
    await handleJourneyResult(result);
  }

  async function next(prevStep: JourneyStep, nextOptions?: NextOptions) {
    const previousCallbacks = prevStep.callbacks;
    const previousPayload = prevStep.payload;

    journeyStore.update((current) => ({
      ...current,
      completed: false,
      error: null,
      loading: true,
      step: prevStep,
      successful: false,
      response: null,
    }));

    let result;
    try {
      const journeyClient = await getJourneyClient();
      result = await journeyClient.next(prevStep, nextOptions);
    } catch (err) {
      console.error(`Next step request | ${err}`);
      result = toGenericError(err);
    }
    await handleJourneyResult(result, {
      prevStep,
      previousCallbacks,
      previousPayload,
      nextOptions,
    });
  }

  async function resume(url: string, resumeOptions?: ResumeOptions) {
    journeyStore.update((current) => ({
      ...current,
      completed: false,
      error: null,
      loading: true,
      step: current.step ?? null,
      successful: false,
      response: null,
    }));

    let result;
    try {
      const journeyClient = await getJourneyClient();
      /**
       * Journey Client `resume()` already parses: `code`, `state`, `form_post_entry`, `responsekey`.
       * We only parse the legacy URL params that Journey Client does NOT currently support.
       */
      let updatedResumeOptions = resumeOptions;

      try {
        const parsedUrl = new URL(url);
        const params = parsedUrl.searchParams;

        const error = params.get('error');
        const errorCode = params.get('errorCode');
        const errorMessage = params.get('errorMessage');
        const nonce = params.get('nonce');
        const scope = params.get('scope');
        const RelayState = params.get('RelayState');
        const suspendedId = params.get('suspendedId');
        const authIndexValue = params.get('authIndexValue');
        const journeyParam =
          params.get('journey') || resumeOptions?.journey || authIndexValue || undefined;

        /**
         * URL-derived params can override resumeOptions query property
         * RelayState is PascalCase to match the property name that AM expects
         */
        const mergedQuery = {
          ...resumeOptions?.query,
          ...(error && { error }),
          ...(errorCode && { errorCode }),
          ...(errorMessage && { errorMessage }),
          ...(nonce && { nonce }),
          ...(RelayState && { RelayState }),
          ...(scope && { scope }),
          ...(suspendedId && { suspendedId }),
        };

        updatedResumeOptions = {
          ...(journeyParam && { journey: journeyParam }),
          ...(mergedQuery && { query: mergedQuery }),
        };
      } catch {
        // If URL parsing fails, fall back to the provided `resumeOptions` unchanged.
        updatedResumeOptions = resumeOptions;
      }

      result = await journeyClient.resume(url, updatedResumeOptions);
    } catch (err) {
      console.error(`Resume request | ${err}`);
      result = toGenericError(err);
    }
    await handleJourneyResult(result);
  }

  async function push(newOptions: StartParam) {
    reset();
    await stack.push(newOptions);
    await start(newOptions);
  }

  async function pop() {
    reset();
    const updatedStack = await stack.pop();
    const currentJourney = updatedStack[updatedStack.length - 1];
    await start(currentJourney);
  }

  async function redirect(step: JourneyStep) {
    if (!shouldRedirectFromStep(step)) {
      return;
    }

    try {
      const journeyClient = await getJourneyClient();
      await journeyClient.redirect(step);
    } catch (err) {
      console.error(`Redirect request | ${err}`);
    }
  }

  function reset() {
    journeyStore.set({
      completed: false,
      error: null,
      loading: false,
      metadata: null,
      step: null,
      successful: false,
      response: null,
      recaptchaAction: null,
    });
  }

  async function handleJourneyResult(
    result: JourneyResult,
    context?: {
      prevStep?: StepTypes;
      previousCallbacks?: BaseCallback[];
      previousPayload?: Step;
      nextOptions?: NextOptions;
    },
  ) {
    if (result.type === 'Step') {
      const stepResult = result as JourneyStep;
      const stageAttribute = stepResult.getStage();

      let stageJson: Maybe<Record<string, unknown>> = null;
      let stageName: Maybe<string> = null;

      // Check if stage attribute is serialized JSON
      if (stageAttribute && stageAttribute.includes('{')) {
        try {
          stageJson = JSON.parse(stageAttribute);
        } catch {
          console.warn('Stage attribute value was not parsable');
        }
      } else if (stageAttribute) {
        stageName = stageAttribute;
      }

      const callbackMetadata = buildCallbackMetadata(stepResult, initCheckValidation(), stageJson);
      const stepMetadata = buildStepMetadata(callbackMetadata, stageJson, stageName);

      // Iterate on a successful progression
      stepNumber = stepNumber + 1;
      journeyStore.update((current) => ({
        ...current,
        completed: false,
        error: null,
        loading: false,
        metadata: {
          callbacks: callbackMetadata,
          step: stepMetadata,
        },
        step: stepResult,
        successful: false,
        response: null,
      }));
    } else if (result.type === 'LoginSuccess') {
      /**
       * SUCCESSFUL COMPLETION BLOCK
       */
      stack.reset();

      // Set final state
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: null,
        loading: false,
        metadata: null,
        step: null,
        successful: true,
        response: result.payload,
      }));
    } else if (result.type === 'LoginFailure') {
      const failureResult = result;
      const failureMessageStr = htmlDecode(failureResult.payload?.message || 'Unknown login error');

      await restartJourney(failureMessageStr, context, failureResult);
    } else {
      // Handle GenericError case
      const genericError = result;
      const errorMessage =
        /**
         * TODO: Journey Client currently does not handle JourneyLoginFailure case
         * It returns a GenericError type when it should be returning JourneyLoginFailure type
         * The hack below temporarily passes failing tests for Login journey
         * Remove this check when https://github.com/ForgeRock/ping-javascript-sdk/pull/574
         * PR has been merged and journey client is published to npm
         */
        genericError.error === 'no_response_data' && context?.prevStep
          ? interpolate('loginFailure')
          : genericError.message ?? genericError.error ?? interpolate('unknownNetworkError');

      await restartJourney(errorMessage, context);
    }
  }

  async function restartJourney(
    errorMessage: Maybe<string>,
    context?: {
      prevStep?: StepTypes;
      previousCallbacks?: BaseCallback[];
      previousPayload?: Step;
      nextOptions?: NextOptions;
    },
    failureResult?: Extract<JourneyResult, { type: 'LoginFailure' }>,
  ) {
    let restartedResult: JourneyResult | null = null;

    try {
      /**
       * Restart journey to get fresh step
       */
      const restartOptions = await stack.latest();
      const journeyClient = await getJourneyClient();
      restartedResult = await journeyClient.start(restartOptions);

      /**
       * Now that we have a new authId (the identification of the
       * fresh step) let's populate this new step with old callback data if
       * this is step one and meets a few criteria.
       *
       * If error code is 110 or error message includes "Constrained Violation",
       * then the issue needs special handling.
       *
       * If this is the first step in the journey, replace the callbacks with
       * existing callbacks to resubmit with a fresh authId.
       ******************************************************************* */
      if (
        failureResult &&
        restartedResult.type === 'Step' &&
        shouldPopulateWithPreviousCallbacks(
          failureResult,
          context?.previousCallbacks,
          restartedResult,
          stepNumber,
        )
      ) {
        const restartedStep = restartedResult;
        restartedStep.callbacks = context?.previousCallbacks as BaseCallback[];

        // Rebuild payload onto restartedStep ensuring the use of the NEW authId
        restartedStep.payload = {
          ...(context?.previousPayload as Step),
          authId: restartedStep.payload.authId,
        };

        const details = failureResult.payload.detail as { errorCode: string } | null;

        /**
         * Only if the authId expires do we resubmit with same callback values
         */
        if (details?.errorCode === authIdTimeoutErrorCode) {
          restartedResult = await journeyClient.next(restartedStep, context?.nextOptions);
        }
      }
    } catch (err) {
      console.error(`Restart failed step request | ${err}`);
      restartedResult = toGenericError(err);
    }

    /**
     * SET RESULT OF SUBSEQUENT REQUEST
     *
     * After the above attempts to salvage the form submission, let's return
     * the final result to the user.
     */
    if (restartedResult.type === 'Step') {
      const restartedStep = restartedResult;
      const stageAttribute = restartedStep.getStage();

      let stageJson: Maybe<Record<string, unknown>> = null;
      let stageName: Maybe<string> = null;

      if (stageAttribute && stageAttribute.includes('{')) {
        try {
          stageJson = JSON.parse(stageAttribute);
        } catch {
          console.warn('Stage attribute value was not parsable');
        }
      } else if (stageAttribute) {
        stageName = stageAttribute;
      }

      const callbackMetadata = buildCallbackMetadata(
        restartedStep,
        initCheckValidation(),
        stageJson,
      );
      const stepMetadata = buildStepMetadata(callbackMetadata, stageJson, stageName);

      journeyStore.update((current) => ({
        ...current,
        completed: false,
        error: {
          code: failureResult?.getCode() ?? null,
          message: errorMessage,
          stage: context?.prevStep?.payload?.stage ?? null,
          troubleshoot: null,
          detail: failureResult?.payload?.detail ?? null,
        },
        loading: false,
        metadata: {
          callbacks: callbackMetadata,
          step: stepMetadata,
        },
        step: restartedStep,
        successful: false,
        response: null,
      }));
      return;
    } else if (restartedResult.type === 'LoginSuccess') {
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: null,
        loading: false,
        metadata: null,
        step: null,
        successful: true,
        response: restartedResult.payload,
      }));
      return;
    } else {
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: {
          code: failureResult?.getCode() ?? null,
          message: errorMessage,
          stage: context?.prevStep?.payload?.stage ?? null,
          troubleshoot: null,
          detail: failureResult?.payload?.detail ?? null,
        },
        loading: false,
        metadata: null,
        step: null,
        successful: false,
        response: restartedResult.type === 'LoginFailure' ? restartedResult.payload : null,
      }));
    }
  }

  function toGenericError(err: unknown): GenericError {
    const message = err instanceof Error ? err.message : interpolate('unknownNetworkError');
    return {
      error: 'unknown_error',
      message,
      type: 'unknown_error',
    };
  }

  return {
    next,
    pop,
    push,
    reset,
    resume,
    start,
    redirect,
    subscribe: journeyStore.subscribe,
  };
}

export let stack: StackStore;
