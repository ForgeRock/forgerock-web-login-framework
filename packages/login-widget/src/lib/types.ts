/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { componentApi } from './_utilities/component.utilities';
import { widgetApiFactory } from './widget.api';

import type { Step as SdkStep } from '@forgerock/journey-client/types';
import type { OauthTokens as SdkOauthTokens } from '@forgerock/oidc-client/types';

import type {
  JourneyOptions as JourneyApiOptionsInit,
  JourneyOptionsChange as JourneyApiOptionsChange,
  JourneyOptionsStart as JourneyApiOptionsStart,
  WidgetConfigOptions as WidgetApiConfigOptions,
} from './interfaces';
import type { ComponentStoreValue } from '$core/component.store';
import type { OAuthTokenStoreValue as OAuthTokenStoreEventValue } from '$core/oauth/oauth.store';
import type { UserStoreValue as UserStoreEventValue } from '$core/user/user.store';
import type { JourneyStoreValue as JourneyStoreEventValue } from '$journey/journey.interfaces';

const _api = widgetApiFactory(componentApi());

// Widget API Types
export type JourneyApi = ReturnType<typeof _api.journey>;
export type UserInfoApi = ReturnType<typeof _api.user.info>;
export type UserTokensApi = ReturnType<typeof _api.user.tokens>;
export type ProtectApi = typeof _api.protect;
// Widget API Options Type
export type JourneyOptions = JourneyApiOptionsInit;
export type JourneyOptionsChange = JourneyApiOptionsChange;
export type JourneyOptionsStart = JourneyApiOptionsStart;
export type WidgetConfigOptions = WidgetApiConfigOptions;

// Widget API Return Type
export type ComponentEventValue = Pick<
  ComponentStoreValue,
  'error' | 'lastAction' | 'mounted' | 'open' | 'reason'
>;
export type JourneyStoreValue = JourneyStoreEventValue;
export type OAuthTokenStoreValue = OAuthTokenStoreEventValue;
export type UserStoreValue = UserStoreEventValue;

// SDK OAuth Tokens Type
export type OauthTokens = SdkOauthTokens;

// SDK Step Type
export type Step = SdkStep;
