/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
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

  // Derive the real return type from the JourneyClient API so we don't duplicate the
  // union or rely on unsafe `as` casts elsewhere in this module.
  type JourneyResult = Awaited<ReturnType<JourneyClient['start']>>;

  function isJourneyError(result: unknown): result is GenericError {
    if (typeof result !== 'object' || result === null) {
      return false;
    }

    if (!('error' in result) || !('type' in result)) {
      return false;
    }

    const maybeError = (result as { error?: unknown }).error;
    const maybeType = (result as { type?: unknown }).type;
    const maybeMessage = (result as { message?: unknown }).message;

    if (typeof maybeError !== 'string' || typeof maybeType !== 'string') {
      return false;
    }

    if (maybeMessage !== undefined && typeof maybeMessage !== 'string') {
      return false;
    }

    return true;
  }

  function toJourneyError(err: unknown): GenericError {
    const message = err instanceof Error ? err.message : interpolate('unknownNetworkError');
    return {
      error: 'unknown_error',
      message,
      type: 'unknown_error',
    };
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
    if (isJourneyError(result)) {
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: {
          code: null,
          message: result.message ?? result.error ?? interpolate('unknownNetworkError'),
          stage: null,
          troubleshoot: null,
          detail: null,
        },
        loading: false,
        metadata: null,
        step: null,
        successful: false,
        response: null,
      }));
      return;
    }

    // Simplify by using direct discriminant checks on `type`.

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
      return;
    }

    if (result.type === 'LoginSuccess') {
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
      return;
    }

    if (result.type !== 'LoginFailure') {
      /**
       * FAILURE COMPLETION BLOCK
       */
      // Unexpected shape — treat as a network/unknown error
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: {
          code: null,
          message: interpolate('unknownNetworkError'),
          stage: null,
          troubleshoot: null,
          detail: null,
        },
        loading: false,
        metadata: null,
        step: null,
        successful: false,
        response: null,
      }));
      return;
    }

    const failureResult = result;
    const failureMessageStr = htmlDecode(failureResult.payload?.message || 'Unknown login error');

    let restartedResult: JourneyResult | GenericError | null = null;

    try {
      const journeyClient = await getJourneyClient();
      const restartOptions = await stack.latest();
      restartedResult = await journeyClient.start(restartOptions);

      if (
        restartedResult &&
        shouldPopulateWithPreviousCallbacks(
          failureResult as never,
          context?.previousCallbacks,
          restartedResult as never,
          stepNumber,
        )
      ) {
        if (restartedResult && (restartedResult as JourneyResult).type === 'Step') {
          const restartedStep = restartedResult as JourneyStep;
          restartedStep.callbacks = context?.previousCallbacks as BaseCallback[];

          restartedStep.payload = {
            ...(context?.previousPayload as Step),
            authId: restartedStep.payload.authId,
          };

          const details = failureResult.payload.detail as { errorCode: string } | null;
          if (details?.errorCode === authIdTimeoutErrorCode) {
            restartedResult = await journeyClient.next(restartedStep, context?.nextOptions);
          }
        }
      }
    } catch (err) {
      console.error(`Restart failed step request | ${err}`);
      restartedResult = toJourneyError(err);
    }

    if (restartedResult && isJourneyError(restartedResult)) {
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: {
          code: failureResult.getCode ? failureResult.getCode() : null,
          message: failureMessageStr,
          stage: context?.prevStep?.payload?.stage,
          troubleshoot: null,
          detail: failureResult.payload?.detail,
        },
        loading: false,
        metadata: null,
        step: null,
        successful: false,
        response: null,
      }));
      return;
    }

    if (restartedResult && (restartedResult as JourneyResult).type === 'Step') {
      const restartedStep = restartedResult as JourneyStep;
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
          code: failureResult.getCode ? failureResult.getCode() : null,
          message: failureMessageStr,
          stage: context?.prevStep?.payload?.stage,
          troubleshoot: null,
          detail: failureResult.payload?.detail,
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
    }

    if (restartedResult && (restartedResult as JourneyResult).type === 'LoginSuccess') {
      journeyStore.update((current) => ({
        ...current,
        completed: true,
        error: null,
        loading: false,
        metadata: null,
        step: null,
        successful: true,
        response: (restartedResult as { payload: Step }).payload,
      }));
      return;
    }

    journeyStore.update((current) => ({
      ...current,
      completed: true,
      error: {
        code: failureResult.getCode ? failureResult.getCode() : null,
        message: failureMessageStr,
        stage: context?.prevStep?.payload?.stage,
        troubleshoot: null,
        detail: failureResult.payload?.detail,
      },
      loading: false,
      metadata: null,
      step: null,
      successful: false,
      response:
        restartedResult &&
        typeof restartedResult === 'object' &&
        restartedResult !== null &&
        'payload' in restartedResult
          ? (restartedResult as { payload: Step }).payload
          : null,
    }));
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
      result = toJourneyError(err);
    }
    await handleJourneyResult(result, {
      prevStep,
      previousCallbacks,
      previousPayload,
      nextOptions,
    });
  }

  async function pop() {
    reset();
    const updatedStack = await stack.pop();
    const currentJourney = updatedStack[updatedStack.length - 1];
    await start(currentJourney);
  }

  async function push(newOptions: StartParam) {
    reset();
    await stack.push(newOptions);
    await start(newOptions);
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
      result = await journeyClient.resume(url, resumeOptions);
    } catch (err) {
      console.error(`Resume request | ${err}`);
      result = toJourneyError(err);
    }
    await handleJourneyResult(result);
  }

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
      result = toJourneyError(err);
    }
    await handleJourneyResult(result);
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

  return {
    next,
    pop,
    push,
    reset,
    resume,
    start,
    subscribe: journeyStore.subscribe,
  };
}

export let stack: StackStore;
