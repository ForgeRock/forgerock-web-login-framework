import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import type { z } from 'zod';

// Import store types
import type { JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import type { UserStoreValue } from '$lib/user/user.store';

import type { partialConfigSchema } from '$lib/sdk.config';
import type { journeyConfigSchema } from '$journey/config.store';
import type { partialLinksSchema } from '$lib/links.store';
import type { partialStringsSchema } from '$lib/locale.store';
import type { partialStyleSchema } from '$lib/style.store';

export interface JourneyOptions {
  oauth?: boolean; // defaults to true
  user?: boolean; // defaults to true
}
export interface JourneyOptionsStart {
  config?: StepOptions;
  journey?: string;
  resumeUrl?: string; // current URL if resuming a journey/tree
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
export interface WidgetConfigOptions {
  config?: z.infer<typeof partialConfigSchema>;
  content?: z.infer<typeof partialStringsSchema>;
  journeys?: z.infer<typeof journeyConfigSchema>;
  links?: z.infer<typeof partialLinksSchema>;
  style?: z.infer<typeof partialStyleSchema>;
}
