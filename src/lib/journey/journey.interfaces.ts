import type { FRStep, FRLoginFailure, FRLoginSuccess } from '@forgerock/javascript-sdk';
import type { Step, StepOptions } from '@forgerock/javascript-sdk/src/auth/interfaces';
import type { Writable } from 'svelte/store';
import type { Maybe } from '$lib/interfaces';

export interface CallbackMetadata {
  derived: {
    canForceUserInputOptionality: boolean;
    isFirstInvalidInput: boolean;
    isReadyForSubmission: boolean;
    isSelfSubmitting: boolean;
    isUserInputRequired: boolean;
  };
  idx: number;
  platform?: Record<string, unknown>;
}
export interface JourneyStore extends Pick<Writable<JourneyStoreValue>, 'subscribe'> {
  next: (prevStep?: StepTypes, nextOptions?: StepOptions) => void;
  pop: () => void;
  push: (changeOptions: StepOptions) => void;
  reset: () => void;
  resume: (url: string, resumeOptions?: StepOptions) => void;
  start: (startOptions?: StepOptions) => void;
}
export interface StageFormObject {
  icon: boolean;
  message: string;
  status: string;
  submit: () => void;
}
export interface StageJourneyObject {
  loading: boolean;
  pop: () => void;
  push: (options: StepOptions) => void;
  stack: StackStore;
}
export interface JourneyStoreValue {
  completed: boolean;
  error: Maybe<{
    code: Maybe<number>;
    message: Maybe<string>;
    stage: Maybe<string>;
    troubleshoot: Maybe<string>;
  }>;
  loading: boolean;
  metadata: {
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  } | null;
  step: StepTypes;
  successful: boolean;
  response: Maybe<Step>;
}
export interface StackStore extends Pick<Writable<StepOptions[]>, 'subscribe'> {
  latest: () => Promise<StepOptions>;
  pop: () => Promise<StepOptions[]>;
  push: (options?: StepOptions) => Promise<StepOptions[]>;
  reset: () => void;
}
export interface StepMetadata {
  derived: {
    isUserInputOptional: boolean;
    isStepSelfSubmittable: () => boolean;
    numOfCallbacks: number;
    numOfSelfSubmittableCbs: number;
    numOfUserInputCbs: number;
  };
  platform?: Record<string, unknown>;
}
export type SelfSubmitFunction = () => void;
export type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;
