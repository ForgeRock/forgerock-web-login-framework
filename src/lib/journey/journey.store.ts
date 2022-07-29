import {
  FRAuth,
  FRStep,
  FRLoginFailure,
  FRLoginSuccess,
  StepType,
} from '@forgerock/javascript-sdk';
import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import { writable, type Writable } from 'svelte/store';

import { htmlDecode } from '$lib/journey/utilities/decode.utilities';

export interface JourneyStore extends Pick<Writable<JourneyStoreValue>, 'subscribe'> {
  next: (prevStep?: StepTypes, nextOptions?: StepOptions) => void;
  reset: () => void;
}
export interface JourneyStoreValue {
  completed: boolean;
  // TODO: Think about turning this into an object with code, message and step
  error: string | null;
  loading: boolean;
  step: StepTypes;
  successful: boolean;
  token: string | null | undefined;
}
export type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

export function initialize(initOptions?: StepOptions): JourneyStore {
  const { set, subscribe }: Writable<JourneyStoreValue> = writable({
    completed: false,
    error: '',
    loading: false,
    step: null,
    successful: false,
    token: null,
  });

  let stepNumber = 0;

  async function next(prevStep: StepTypes = null, nextOptions?: StepOptions) {

    /**
     * Create an options object with nextOptions overriding anything from initOptions
     */
    const options = {
      ...initOptions,
      ...nextOptions,
    };

    /**
     * Save previous step information just in case we have a total
     * form failure due to 400 response from ForgeRock.
     */
    let previousCallbacks;
    let previousStage;

    if (prevStep && prevStep.type === StepType.Step) {
      previousStage = prevStep?.getStage && prevStep.getStage();
      previousCallbacks = prevStep?.callbacks;
    }
    const previousPayload = prevStep?.payload;
    let nextStep: StepTypes;

    set({
      completed: false,
      error: '',
      loading: true,
      step: prevStep,
      successful: false,
      token: null,
    });

    try {
      /**
       * Initial attempt to retrieve next step
       */
      nextStep = await FRAuth.next(prevStep as FRStep, options);
    } catch (err) {
      console.error(`Next step request | ${err}`);

      /**
       * Setup an object to display failure message
       */
      nextStep = new FRLoginFailure({
        message: 'Unknown request failure',
      });
    }

    if (nextStep.type === StepType.Step) {
      // Iterate on a successful progression
      stepNumber = stepNumber + 1;

      set({
        completed: false,
        error: '',
        loading: false,
        step: nextStep,
        successful: false,
        token: null,
      });
    } else if (nextStep.type === StepType.LoginSuccess) {
      set({
        completed: true,
        error: '',
        loading: false,
        step: null,
        successful: true,
        token: nextStep.getSessionToken(),
      });
    } else if (nextStep.type === StepType.LoginFailure) {
      /**
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
          message: 'Unknown request failure',
        });
      }

      /** *******************************************************************
       * SDK INTEGRATION POINT
       * Summary: Repopulate callbacks/payload with previous data.
       * --------------------------------------------------------------------
       * Details: Now that we have a new authId (the identification of the
       * fresh step) let's populate this new step with old callback data if
       * allowed with this stage. If not, the user will have to refill form. We
       * will display the error we collected from the previous submission,
       * restart the flow, and provide better UX with the previous form data,
       * so the user doesn't have to refill the form.
       ******************************************************************* */
      if (restartedStep.type === StepType.Step) {
        const currentStage = restartedStep.getStage() || '';
        // TODO: Convert hardcoded stage of 'registration' to a configurable allowlist
        if (currentStage === previousStage && currentStage.toLowerCase().includes('registration')) {
          if (previousCallbacks) {
            // Iterate over the callbacks to find any password and reset to empty value
            restartedStep.callbacks = previousCallbacks.map(
              (callback) => {
                callback.setInputValue('');
                return callback;
              },
            );
            restartedStep.payload = {
              ...previousPayload,
              authId: restartedStep.payload.authId,
            };
          }
        }

        /**
         * If error code is 110, then the issue is just the authId expiring.
         * If this is the first step in the journey, replace the callbacks
         * with existing callbacks to resubmit with a fresh authId.
         */
        if (nextStep.payload?.detail && stepNumber === 1) {
          const details = nextStep.payload?.detail as { errorCode: string };
          if (details?.errorCode === '110') {
            /**
             * Resubmit with new authId, but old callbacks to prevent failing
             * solely due to stale form.
             */
            if (previousCallbacks) {
              restartedStep.callbacks = previousCallbacks;
              restartedStep.payload = {
                ...previousPayload,
                authId: restartedStep.payload.authId,
              };
            }
            restartedStep = await FRAuth.next(restartedStep, options);
          }
        }
      }

      /**
       * After the above attempts to salvage the form submission, let's return
       * the final result to the user.
       */
      if (restartedStep.type === StepType.Step) {
        set({
          completed: false,
          error: failureMessageStr,
          loading: false,
          step: restartedStep,
          successful: false,
          token: null,
        });
      } else if (restartedStep.type === StepType.LoginSuccess) {
        set({
          completed: true,
          error: '',
          loading: false,
          step: restartedStep,
          successful: true,
          token: null,
        });
      } else {
        set({
          completed: true,
          error: failureMessageStr,
          loading: false,
          step: restartedStep,
          successful: false,
          token: null,
        });
      }
    }
  }

  function reset() {
    set({
      completed: false,
      error: '',
      loading: false,
      step: null,
      successful: false,
      token: null,
    });
  }

  return {
    next,
    reset,
    subscribe,
  };
}
