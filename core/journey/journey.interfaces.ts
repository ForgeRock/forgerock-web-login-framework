/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type {
  JourneyStep,
  NextOptions,
  ResumeOptions,
  StartParam,
  Step,
} from '@forgerock/journey-client/types';
import type { Component } from 'svelte';
import type { Writable } from 'svelte/store';

import type { Maybe } from '$core/interfaces';

/*
 * TODO: Journey Client does not export StepDetail
 * This should be replaced with an import from journey-client/types
 * when Journey Client starts exporting StepDetail
 */
type StepDetail = NonNullable<Step['detail']>;

export type CaptchaMode = 'visible' | 'invisible';

export interface CallbackMetadata {
  derived: {
    canForceUserInputOptionality: boolean;
    isFirstInvalidInput: boolean;
    isReadyForSubmission: boolean;
    isSelfSubmitting: boolean;
    isUserInputRequired: boolean;
    isPasskeyAutofillEligible: boolean;
  };
  idx: number;
  initOptions?: Record<string, unknown>;
  platform?: Record<string, unknown>;
}
export interface JourneyStore extends Pick<Writable<JourneyStoreValue>, 'subscribe'> {
  next: (prevStep: JourneyStep, nextOptions?: NextOptions) => Promise<void>;
  pop: () => Promise<void>;
  push: (changeOptions: StartParam) => Promise<void>;
  reset: () => void;
  resume: (url: string, resumeOptions?: ResumeOptions) => Promise<void>;
  start: (startOptions?: StartParam, recaptchaAction?: string) => Promise<void>;
  redirect: (step: JourneyStep) => Promise<void>;
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
  redirect: (step: JourneyStep) => Promise<void>;
  stack: StackStore;
}
export type StageComponent = Component<{
  componentStyle: 'app' | 'inline' | 'modal';
  form: StageFormObject;
  formEl?: HTMLFormElement | null;
  journey: StageJourneyObject;
  metadata: JourneyStoreValue['metadata'];
  step: JourneyStep;
}>;
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
