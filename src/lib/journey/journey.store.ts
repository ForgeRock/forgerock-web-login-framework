import {
  Config,
  FRAuth,
  FRStep,
  FRLoginFailure,
  StepType,
  FRCallback,
} from '@forgerock/javascript-sdk';
import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import { get, writable, type Writable } from 'svelte/store';

import { htmlDecode } from '$journey/_utilities/decode.utilities';
import { logErrorAndThrow } from '$lib/_utilities/errors.utilities';
import type { JourneyStore, JourneyStoreValue, StackStore, StepTypes } from './journey.interfaces';
import { interpolate } from '$lib/_utilities/i18n.utilities';
import {
  authIdTimeoutErrorCode,
  initCheckValidation,
  shouldPopulateWithPreviousCallbacks,
} from './stages/_utilities/step.utilities';
import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
import type { Maybe } from '$lib/interfaces';

function initializeStack(initOptions?: StepOptions) {
  const initialValue = initOptions ? [initOptions] : [];
  const { update, set, subscribe }: Writable<StepOptions[]> = writable(initialValue);

  // Assign to exported variable (see bottom of file)
  stack = {
    latest: async (): Promise<StepOptions> => {
      return new Promise((resolve) => {
        // subscribe, grab the current value and unsubscribe
        subscribe((current) => {
          const lastItem = current[current.length - 1];
          resolve(lastItem);
        })();
      });
    },
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

export const journeyStore: Writable<JourneyStoreValue> = writable({
  completed: false,
  error: null,
  loading: false,
  metadata: null,
  step: null,
  successful: false,
  response: null,
});
export function initialize(initOptions?: StepOptions): JourneyStore {
  const stack = initializeStack();

  let stepNumber = 0;

  async function next(prevStep: StepTypes = null, nextOptions?: StepOptions, resumeUrl?: string) {
    if (!Config.get().serverConfig?.baseUrl) {
      logErrorAndThrow('missingBaseUrl');
    }

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

    journeyStore.set({
      completed: false,
      error: null,
      loading: true,
      metadata: get(journeyStore).metadata,
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
        nextStep = await FRAuth.start(options);
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
      const stageAttribute = nextStep.getStage();

      let stageJson: Maybe<Record<string, unknown>> = null;
      let stageName: Maybe<string> = null;

      // Check if stage attribute is serialized JSON
      if (stageAttribute && stageAttribute.includes('{')) {
        try {
          stageJson = JSON.parse(stageAttribute);
        } catch (err) {
          console.warn('Stage attribute value was not parsable');
        }
      } else if (stageAttribute) {
        stageName = stageAttribute;
      }

      const callbackMetadata = buildCallbackMetadata(nextStep, initCheckValidation(), stageJson);
      const stepMetadata = buildStepMetadata(callbackMetadata, stageJson, stageName);

      // Iterate on a successful progression
      stepNumber = stepNumber + 1;

      journeyStore.set({
        completed: false,
        error: null,
        loading: false,
        metadata: {
          callbacks: callbackMetadata,
          step: stepMetadata,
        },
        step: nextStep,
        successful: false,
        response: null,
      });
    } else if (nextStep.type === StepType.LoginSuccess) {
      /**
       * SUCCESSFUL COMPLETION BLOCK
       */
      stack.reset();

      // Set final state
      journeyStore.set({
        completed: true,
        error: null,
        loading: false,
        metadata: null,
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
        const restartOptions = await stack.latest();
        restartedStep = await FRAuth.next(undefined, restartOptions);
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
        const stageAttribute = restartedStep.getStage();

        let stageJson: Maybe<Record<string, unknown>> = null;
        let stageName: Maybe<string> = null;

        // Check if stage attribute is serialized JSON
        if (stageAttribute && stageAttribute.includes('{')) {
          try {
            stageJson = JSON.parse(stageAttribute);
          } catch (err) {
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

        journeyStore.set({
          completed: false,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
            troubleshoot: null,
          },
          loading: false,
          metadata: {
            callbacks: callbackMetadata,
            step: stepMetadata,
          },
          step: restartedStep,
          successful: false,
          response: null,
        });
      } else if (restartedStep.type === StepType.LoginSuccess) {
        journeyStore.set({
          completed: true,
          error: null,
          loading: false,
          metadata: null,
          step: null,
          successful: true,
          response: restartedStep.payload,
        });
      } else {
        journeyStore.set({
          completed: true,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
            troubleshoot: null,
          },
          loading: false,
          metadata: null,
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
    const configTree = Config.get().tree;
    // If no tree is passed in, but there's a configured default tree, use that
    if (!startOptions?.tree && configTree) {
      if (startOptions) {
        startOptions.tree = configTree;
      } else {
        startOptions = {
          tree: configTree,
        };
      }
    }
    await stack.push(startOptions);
    await next(undefined, startOptions);
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
