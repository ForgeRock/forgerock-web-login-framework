/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { LogLevel, RequestMiddleware } from '@forgerock/oidc-client/types';
import type { SignalsInitializationOptions } from '@forgerock/protect/types';
import type { z } from 'zod';

import type { captchaConfigSchema } from '$core/captcha.config';
import type { partialLinksSchema } from '$core/links.store';
import type { partialStringsSchema } from '$core/locale.store';
import type { OAuthTokenStoreValue } from '$core/oauth/oauth.store';
import type { oidcClientConfigSchema } from '$core/oidc/oidc.store';
import type { ProtectConfig } from '$core/protect/protect.store';
import type { partialStyleSchema } from '$core/style.store';
import type { UserStoreValue } from '$core/user/user.store';
import type { journeyConfigSchema } from '$journey/config.store';
import type { JourneyStoreValue } from '$journey/journey.interfaces';

export interface JourneyOptions {
  oauth?: boolean; // defaults to true
  user?: boolean; // defaults to true
}
export interface JourneyOptionsChange {
  journey: string;
  query?: Record<string, string>;
}
export interface JourneyOptionsStart {
  journey?: string;
  query?: Record<string, string>;
  resumeUrl?: string; // current URL if resuming a journey
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
  start: (
    config: ProtectConfig | SignalsInitializationOptions,
  ) => Promise<void | { error: string }>;
  resumeBehavioralData: () => void | { error: string };
  pauseBehavioralData: () => void | { error: string };
  getData: () => Promise<string | { error: string }>;
}

export interface WidgetConfigOptions {
  wellknown: string;
  captcha?: z.infer<typeof captchaConfigSchema>;
  // Applied to both the journey and OIDC clients (maps to each client's `log`).
  logLevel?: LogLevel;
  // Request middleware forwarded to both the journey and OIDC clients.
  middleware?: RequestMiddleware[];
  oidcClient?: Omit<z.infer<typeof oidcClientConfigSchema>, 'serverConfig' | 'log'>;
  content?: z.infer<typeof partialStringsSchema>;
  journeys?: z.infer<typeof journeyConfigSchema>;
  links?: z.infer<typeof partialLinksSchema>;
  style?: z.infer<typeof partialStyleSchema>;
}
