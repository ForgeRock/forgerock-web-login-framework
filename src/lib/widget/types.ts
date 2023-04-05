import type {
  ConfigOptions as SdkConfigOptions,
  OAuth2Tokens as SdkOAuth2Tokens,
  Step as SdkStep,
} from '@forgerock/javascript-sdk';

import { widgetApiFactory } from './_utilities/api.utilities';
import { componentApi } from './_utilities/component.utilities';

import type {
  JourneyOptions as JourneyApiOptionsInit,
  JourneyOptionsChange as JourneyApiOptionsChange,
  JourneyOptionsStart as JourneyApiOptionsStart,
  WidgetConfigOptions as WidgetApiConfigOptions,
} from './interfaces';
import type { JourneyStoreValue as JourneyStoreEventValue } from '$journey/journey.interfaces';
import type { OAuthTokenStoreValue as OAuthTokenStoreEventValue } from '$lib/oauth/oauth.store';
import type { UserStoreValue as UserStoreEventValue } from '$lib/user/user.store';

const api = widgetApiFactory(componentApi());

// Widget API Types
export type ConfigurationApi = ReturnType<typeof api.configuration>;
export type JourneyApi = ReturnType<typeof api.journey>;
export type UserInfoApi = ReturnType<typeof api.user.info>;
export type UserTokensApi = ReturnType<typeof api.user.tokens>;

// Widget API Options Type
export type JourneyOptions = JourneyApiOptionsInit;
export type JourneyOptionsChange = JourneyApiOptionsChange;
export type JourneyOptionsStart = JourneyApiOptionsStart;
export type WidgetConfigOptions = WidgetApiConfigOptions;

// Widget API Return Type
export type JourneyStoreValue = JourneyStoreEventValue;
export type OAuthTokenStoreValue = OAuthTokenStoreEventValue;
export type UserStoreValue = UserStoreEventValue;

// SDK Configuration Options Type
export type ConfigOptions = SdkConfigOptions;

// SDK OAuth Tokens Type
export type OAuth2Tokens = SdkOAuth2Tokens;

// SDK Step Type
export type Step = SdkStep;
