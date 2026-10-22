// Journey-client boundary mock — the AM journey request is the one thing the
// preview fakes (IAM-12011). Everything a custom component touches (callback
// types, components, stores, utilities) resolves to real framework code; only
// the client's start/next/resume/redirect/terminate return fixtures instead of
// POSTing to AM.
//
// Replaces the task-1 throwing stub: task 5's demo drives the REAL widget
// runtime (configure -> journey -> journeyStore), which needs a client that
// walks a step -> LoginSuccess rather than throwing. Same module boundary, real
// behavior instead of a boundary error.
//
// The fixtures pass through the REAL callback factory (the same machinery
// `createJourneyObject` uses in journey-client) so the emitted step carries
// `BaseCallback` instances with working `getType()`/`setInputValue()` — the
// journey store's metadata building and the CallbackMapper both call those.
//
// `callbackType` is re-exported from the REAL @forgerock/sdk-types package
// (resolved via the alias in vite.config.ts / vitest.config.ts) rather than
// hand-copied: core/style.store.ts evaluates Object.values(callbackType) at
// module scope into a zod enum, so a copied subset would silently shrink
// style parsing.
export { callbackType } from '@forgerock/sdk-types';

import { createCallback } from '#journey-client-factory';

export function journey(): Promise<{
  subscribe: (listener: () => void) => () => void;
  start: () => Promise<Record<string, unknown>>;
  next: () => Promise<Record<string, unknown>>;
  redirect: () => Promise<void>;
  resume: () => Promise<Record<string, unknown>>;
  terminate: () => Promise<void>;
}> {
  return Promise.resolve(createClient());
}

function createClient() {
  // Raw AM Step payloads — the same JSON AM would send.
  const stepPayload = {
    authId: 'mock-auth-id',
    callbacks: [
      {
        type: 'NameCallback',
        _id: 0,
        input: [{ name: 'IDToken1', value: '' }],
        output: [{ name: 'prompt', value: 'Username' }],
      },
      {
        type: 'PasswordCallback',
        _id: 1,
        input: [{ name: 'IDToken2', value: '' }],
        output: [{ name: 'prompt', value: 'Password' }],
      },
    ],
  };
  const successPayload = {
    successUrl: 'https://mock.example.com/after-login',
    tokenId: 'mock-session-token',
  };

  // Mirror journey-client's createJourneyObject: raw payload -> JourneyStep
  // with factory-converted callbacks + accessor functions. createCallback
  // returns a BaseCallback with getType/setInputValue/getOutputByName —
  // typed here as the structural surface the accessors below use (the
  // ambient `#journey-client-factory` declaration types it as unknown, and
  // narrowing every call site would duplicate journey-client's own types).
  interface MockCallback {
    getType: () => string;
    setInputValue: (value: unknown) => void;
  }
  type StepPayload = {
    authId: string;
    callbacks: Array<{
      type: string;
      _id: number;
      input: Array<Record<string, unknown>>;
      output: Array<Record<string, unknown>>;
    }>;
  };
  function buildStep(payload: StepPayload): Record<string, unknown> {
    const callbacks = payload.callbacks.map((callback) => createCallback(callback) as MockCallback);
    return {
      payload: structuredClone(payload),
      callbacks,
      type: 'Step',
      getCallbackOfType: (type: string) => {
        const found = callbacks.filter((callback) => callback.getType() === type);
        if (found.length !== 1) {
          throw new Error(`Expected 1 callback of type "${type}", but found ${found.length}`);
        }
        return found[0];
      },
      getCallbacksOfType: (type: string) =>
        callbacks.filter((callback) => callback.getType() === type),
      setCallbackValue: (type: string, value: unknown) => {
        const found = callbacks.filter((callback) => callback.getType() === type);
        if (found.length !== 1) {
          throw new Error(`Expected 1 callback of type "${type}", but found ${found.length}`);
        }
        found[0].setInputValue(value);
      },
      getDescription: () => undefined,
      getHeader: () => undefined,
      getStage: () => undefined,
    };
  }

  return {
    subscribe: () => () => undefined,
    start: async () => buildStep(stepPayload),
    next: async () => ({
      payload: structuredClone(successPayload),
      type: 'LoginSuccess',
    }),
    redirect: async () => undefined,
    resume: async () => buildStep(stepPayload),
    terminate: async () => undefined,
  };
}
