/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { StepOptions } from '@forgerock/javascript-sdk';
import type { InitParams } from '@forgerock/ping-protect';
import type { z } from 'zod';

// Import store types
import type { JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthTokenStoreValue } from '$core/oauth/oauth.store';
import type { UserStoreValue } from '$core/user/user.store';

import type { partialConfigSchema } from '$core/sdk.config';
import type { journeyConfigSchema } from '$journey/config.store';
import type { partialLinksSchema } from '$core/links.store';
import type { partialStringsSchema } from '$core/locale.store';
import type { partialStyleSchema } from '$core/style.store';

export interface JourneyOptions {
  oauth?: boolean; // defaults to true
  user?: boolean; // defaults to true
}
export interface JourneyOptionsChange {
  forgerock?: StepOptions;
  journey: string;
}
export interface JourneyOptionsStart {
  forgerock?: StepOptions;
  journey?: string;
  resumeUrl?: string; // current URL if resuming a journey/tree
  recaptchaAction?: string;
}
export interface ModalApi {
  close(args?: { reason: 'auto' | 'external' | 'user' }): void;
  onClose(fn: (args: { reason: 'auto' | 'external' | 'user' }) => void): void;
  onMount(fn: () => void): void;
  open(options?: JourneyOptions): void;
}
export interface Response {
  journey?: JourneyStoreValue;
  oauth?: OAuthTokenStoreValue;
  user?: UserStoreValue;
}

export interface Protect {
  start: (config: InitParams) => Promise<void>;
  resumeBehavioralData: () => void;
  pauseBehavioralData: () => void;
  getData: () => Promise<string | undefined>;
}

export interface WidgetConfigOptions {
  forgerock?: z.infer<typeof partialConfigSchema>;
  content?: z.infer<typeof partialStringsSchema>;
  journeys?: z.infer<typeof journeyConfigSchema>;
  links?: z.infer<typeof partialLinksSchema>;
  style?: z.infer<typeof partialStyleSchema>;
}
