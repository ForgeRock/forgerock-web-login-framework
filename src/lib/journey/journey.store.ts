import { FRAuth, FRStep, FRLoginFailure, StepType, FRCallback } from '@forgerock/javascript-sdk';
import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import { writable, type Writable } from 'svelte/store';

import { htmlDecode } from '$journey/_utilities/decode.utilities';
import type { JourneyStore, JourneyStoreValue, StackStore, StepTypes } from './journey.interfaces';
import { interpolate } from '$lib/_utilities/i18n.utilities';
import {
  authIdTimeoutErrorCode,
  shouldPopulateWithPreviousCallbacks,
} from './_utilities/step.utilities';

function initializeStack(initOptions?: StepOptions) {
  const initialValue = initOptions ? [initOptions] : [];
  const { update, set, subscribe }: Writable<StepOptions[]> = writable(initialValue);

  // Assign to exported variable (see bottom of file)
  stack = {
    pop: async (): Promise<StepOptions[]> => {
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
    push: async (options?: StepOptions): Promise<StepOptions[]> => {
      return new Promise((resolve) => {
        update((current) => {
          let state;

          console.log(options);

          if (!current.length) {
            state = [{ ...options }];
          } else if (options && options?.tree !== current[current.length - 1]?.tree) {
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

export function initialize(initOptions?: StepOptions): JourneyStore {
  const { set, subscribe }: Writable<JourneyStoreValue> = writable({
    completed: false,
    error: null,
    loading: false,
    step: null,
    successful: false,
    response: null,
  });
  const stack = initializeStack();

  let stepNumber = 0;

  async function next(prevStep: StepTypes = null, nextOptions?: StepOptions, resumeUrl?: string) {
    /**
     * Create an options object with nextOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...initOptions,
      ...nextOptions,
    };

    /**
     * Save previous step information just in case we have a total
     * form failure due to 400 response from ForgeRock.
     */
    let previousCallbacks: FRCallback[] | undefined;

    if (prevStep && prevStep.type === StepType.Step) {
      previousCallbacks = prevStep?.callbacks;
    }
    const previousPayload = prevStep?.payload;
    let nextStep: StepTypes;

    set({
      completed: false,
      error: null,
      loading: true,
      step: prevStep,
      successful: false,
      response: null,
    });

    try {
      if (resumeUrl) {
        // If resuming an unknown journey remove the tree from the options
        options.tree = undefined;

        /**
         * Attempt to resume journey
         */
        nextStep = await FRAuth.resume(resumeUrl, options);
      } else if (prevStep) {
        // If continuing on a tree remove it from the options
        options.tree = undefined;

        /**
         * Initial attempt to retrieve next step
         */
        nextStep = await FRAuth.next(prevStep as FRStep, options);
      } else {
        nextStep = await FRAuth.next(undefined, options);
      }
    } catch (err) {
      console.error(`Next step request | ${err}`);

      /**
       * Setup an object to display failure message
       */
      nextStep = new FRLoginFailure({
        message: interpolate('unknownNetworkError'),
      });
    }

    if (nextStep.type === StepType.Step) {
      /**
       * SUCCESSFUL CONTINUATION BLOCK
       */

      // Iterate on a successful progression
      stepNumber = stepNumber + 1;

      set({
        completed: false,
        error: null,
        loading: false,
        step: nextStep,
        successful: false,
        response: null,
      });
    } else if (nextStep.type === StepType.LoginSuccess) {
      /**
       * SUCCESSFUL COMPLETION BLOCK
       */

      // Set final state
      set({
        completed: true,
        error: null,
        loading: false,
        step: null,
        successful: true,
        response: nextStep.payload,
      });
    } else if (nextStep.type === StepType.LoginFailure) {
      /**
       * FAILURE COMPLETION BLOCK
       *
       * Grab failure message, which may contain encoded HTML
       */
      const failureMessageStr = htmlDecode(nextStep.payload.message || '');
      let restartedStep: StepTypes | null = null;

      try {
        /**
         * Restart tree to get fresh step
         */
        restartedStep = await FRAuth.next(undefined, options);
      } catch (err) {
        console.error(`Restart failed step request | ${err}`);

        /**
         * Setup an object to display failure message
         */
        restartedStep = new FRLoginFailure({
          message: interpolate('unknownNetworkError'),
        });
      }

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
        shouldPopulateWithPreviousCallbacks(nextStep, previousCallbacks, restartedStep, stepNumber)
      ) {
        /**
         * TypeScript notes:
         *
         * Assert that restartedStep is FRStep as that is required for the above condition to be true.
         * Also, assert that previousCallbacks is FRCallback[] as that too is required for above to be true.
         *
         * Attempt a refactor using Ryan's suggestion found here: https://www.typescriptlang.org/play?#code/PTAEHUFMBsGMHsC2lQBd5oBYoCoE8AHSAZVgCcBLA1UABWgEM8BzM+AVwDsATAGiwoBnUENANQAd0gAjQRVSQAUCEmYKsTKGYUAbpGF4OY0BoadYKdJMoL+gzAzIoz3UNEiPOofEVKVqAHSKymAAmkYI7NCuqGqcANag8ABmIjQUXrFOKBJMggBcISGgoAC0oACCbvCwDKgU8JkY7p7ehCTkVDQS2E6gnPCxGcwmZqDSTgzxxWWVoASMFmgYkAAeRJTInN3ymj4d-jSCeNsMq-wuoPaOltigAKoASgAywhK7SbGQZIIz5VWCFzSeCrZagNYbChbHaxUDcCjJZLfSDbExIAgUdxkUBIursJzCFJtXydajBZJcWD1RqgJyofGcABqDGg7EgAB4cAA+AAUq3y3nBqwUPGEglQlE4IwA-FcJcNQALOOxENJvgBKUAAb0UJT1CNAPNQ7SJoIAvBbQAAiZWq75WzV0hmgUG6vXg6CCFBOsheVZukoB0CKAC+incNCGUtAZtpkHpvuZrI54slzF5VoAjA6ANzkynUrxCYjyqV8gWphUAH36KrVZHVAuB8BaXh17oNRpNqXNloA5JWpX3Ne33XqfZkyGy8+6w0GJziWV683PO8XS8wjXFmOqR0Go8wAhlYKzuPoeVbsNBoPBc6HgiocM0PL7QIh4H0GMD2JG7owpewDDMJA-AnuoiRfvAegiF4VoAKKrAwiALPoVpJNiVrgA4qADqAABykASFaQQqAA8l8ZDvF6-DAUcqCOAorjSHgcbvjoCpfF6aKINCwiXF8kgftEIgGBw2ILEwrAcDwQQlEAA
         */
        restartedStep = restartedStep as FRStep;
        // Rebuild callbacks onto restartedStep
        restartedStep.callbacks = previousCallbacks as FRCallback[];

        // Rebuild payload onto restartedStep ensuring the use of the NEW authId
        restartedStep.payload = {
          ...previousPayload,
          authId: restartedStep.payload.authId,
        };

        const details = nextStep.payload.detail as { errorCode: string } | null;

        /**
         * Only if the authId expires do we resubmit with same callback values
         */
        if (details?.errorCode === authIdTimeoutErrorCode) {
          restartedStep = await FRAuth.next(restartedStep, options);
        }
      }

      /**
       * SET RESULT OF SUBSEQUENT REQUEST
       *
       * After the above attempts to salvage the form submission, let's return
       * the final result to the user.
       */
      if (restartedStep.type === StepType.Step) {
        set({
          completed: false,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
          },
          loading: false,
          step: restartedStep,
          successful: false,
          response: null,
        });
      } else if (restartedStep.type === StepType.LoginSuccess) {
        set({
          completed: true,
          error: null,
          loading: false,
          step: null,
          successful: true,
          response: restartedStep.payload,
        });
      } else {
        set({
          completed: true,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
          },
          loading: false,
          step: null,
          successful: false,
          response: restartedStep.payload,
        });
      }
    }
  }

  async function pop() {
    reset();
    const updatedStack = await stack.pop();
    const currentJourney = updatedStack[updatedStack.length - 1];
    await start(currentJourney);
  }

  async function push(newOptions: StepOptions) {
    reset();
    await stack.push(newOptions);
    await start(newOptions);
  }

  async function resume(url: string, resumeOptions?: StepOptions) {
    await next(undefined, resumeOptions, url);
  }

  async function start(startOptions?: StepOptions) {
    await stack.push(startOptions);
    await next(undefined, startOptions);
  }

  function reset() {
    set({
      completed: false,
      error: null,
      loading: false,
      step: null,
      successful: false,
      response: null,
    });
  }

  return {
    next,
    pop,
    push,
    reset,
    resume,
    start,
    subscribe,
  };
}

export let stack: StackStore;
