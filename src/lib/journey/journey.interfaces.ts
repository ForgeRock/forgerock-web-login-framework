import type {
  FRStep,
  FRLoginFailure,
  FRLoginSuccess,
} from '@forgerock/javascript-sdk';
import type { Step, StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import type { Writable } from 'svelte/store';

export interface JourneyStore extends Pick<Writable<JourneyStoreValue>, 'subscribe'> {
  next: (prevStep?: StepTypes, nextOptions?: StepOptions) => void;
  reset: () => void;
}
export interface JourneyStoreValue {
  completed: boolean;
  error: {
    code: number | null;
    message: string | null;
    step: Step | undefined;
  } | null;
  loading: boolean;
  step: StepTypes;
  successful: boolean;
  response: Step | null | undefined;
}
export type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;
