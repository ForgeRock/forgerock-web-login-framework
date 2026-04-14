/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type {
  JourneyStep,
  StartParam,
  Step,
  NextOptions,
  ResumeOptions,
} from '@forgerock/journey-client/types';
import type { StepDetail } from '@forgerock/javascript-sdk';
import type { Writable } from 'svelte/store';
import type { Maybe } from '$core/interfaces';

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
  next: (prevStep: JourneyStep, nextOptions?: NextOptions) => Promise<void>;
  pop: () => Promise<void>;
  push: (changeOptions: StartParam) => Promise<void>;
  reset: () => void;
  resume: (url: string, resumeOptions?: ResumeOptions) => Promise<void>;
  start: (startOptions?: StartParam, recaptchaAction?: string) => Promise<void>;
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
  push: (options: StartParam) => void;
  stack: StackStore;
}
export interface JourneyStoreValue {
  completed: boolean;
  error: Maybe<{
    code: Maybe<number>;
    message: Maybe<string>;
    stage: Maybe<string>;
    troubleshoot: Maybe<string>;
    detail: Maybe<StepDetail>;
  }>;
  loading: boolean;
  metadata: {
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  } | null;
  step?: StepTypes;
  successful: boolean;
  response: Maybe<Step>;
  recaptchaAction?: Maybe<string>;
}
export interface StackStore extends Pick<Writable<StartParam[]>, 'subscribe'> {
  latest: () => Promise<StartParam | undefined>;
  pop: () => Promise<StartParam[]>;
  push: (options?: StartParam) => Promise<StartParam[]>;
  reset: () => void;
}
export interface StepMetadata {
  derived: {
    isUserInputOptional: boolean;
    isStepSelfSubmittable: () => boolean;
    numOfCallbacks: number;
    numOfSelfSubmittableCbs: number;
    numOfUserInputCbs: number;
    stageName?: string;
  };
  platform?: Record<string, unknown>;
}
export type SelfSubmitFunction = () => void;
export type StepTypes = JourneyStep | null;
