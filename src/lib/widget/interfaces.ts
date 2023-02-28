import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';

// Import store types
import type { JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import type { UserStoreValue } from '$lib/user/user.store';

export interface JourneyOptions {
  oauth?: boolean; // defaults to true
  user?: boolean; // defaults to true
}
export interface JourneyOptionsStart {
  config?: StepOptions;
  journey?: string;
  resumeUrl?: string; // current URL if resuming a journey/tree
}
export interface Modal {
  close(args?: { reason: 'auto' | 'external' | 'user' }): void;
  onClose(fn: (args: { reason: 'auto' | 'external' | 'user' }) => void): void;
  onMount(fn: (dialog: HTMLDialogElement, form: HTMLFormElement) => void): void;
  open(options?: JourneyOptions): void;
}
export interface Response {
  journey?: JourneyStoreValue;
  oauth?: OAuthTokenStoreValue;
  user?: UserStoreValue;
}
