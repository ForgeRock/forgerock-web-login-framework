/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Callback payload preset catalog and parity check.
 *
 * Every callback type the mapper renders has one preset payload here, so a
 * story, editor preview, or test can render any renderable callback from a
 * single catalog. The check enforces two one-to-one alignments:
 *
 *   - the renderable-type list matches the mapper's switch cases exactly
 *     (a newly added mapper case cannot silently skip the catalog), and
 *   - the catalog has exactly one preset per renderable type (a newly
 *     renderable callback type without a payload fails the check).
 *
 * Payloads are re-exported from the existing `*.mock.ts` files next to each
 * callback component — the catalog adds no payload data of its own.
 */

import { callbackType } from '@forgerock/journey-client';

import { docsExample as booleanAttributeInput } from '../boolean/boolean.mock';
import { docsExample as choice } from '../choice/choice.mock';
import { docsExample as confirmation } from '../confirmation/confirmation.mock';
import { deviceProfileMockMessage } from '../device-profile/device-profile.mock';
import { docsExample as hiddenValue } from '../hidden-value/hidden-value.mock';
import { docsExample as kbaCreate } from '../kba/kba-create.mock';
import { docsExample as metadata } from '../metadata/metadata.mock';
import { docsExample as password } from '../password/password.mock';
import { docsExample as validatedCreatePassword } from '../password/validated-create-password.mock';
import { pingProtectEvaluate } from '../ping-protect-evaluation/ping-evaluate.mock';
import { PingProtectInitializeData } from '../ping-protect-initialize/ping-initialize.mock';
import { docsExample as pollingWait } from '../polling-wait/polling-wait.mock';
import { visibleGrecaptcha } from '../recaptcha/recaptcha.mock';
import { visibleGrecaptchaEnterprise } from '../recaptcha-enterprise/recaptcha-enterprise.mock';
import { docsExample as redirect } from '../redirect/redirect.mock';
import { docsExample as selectIdP } from '../select-idp/select-idp.mock';
import { docsExample as stringAttributeInput } from '../string-attribute/string-attribute-input.mock';
import { docsExample as termsAndConditions } from '../terms-and-conditions/terms-conditions.mock';
import { docsExample as textInput } from '../text-input/text-input.mock';
import {
  docsBaseExample as textOutput,
  docsSuspendedExample as suspendedTextOutput,
} from '../text-output/text-output.mock';
import { docsExample as name } from '../username/name.mock';
import { docsExample as validatedCreateUsername } from '../username/validated-create-username.mock';

import type { CallbackType as JourneyClientCallbackType } from '@forgerock/journey-client/types';

/** One raw AM callback payload entry. */
interface CallbackPayload {
  readonly type: JourneyClientCallbackType | string;
  readonly output?: ReadonlyArray<{ readonly name: string; readonly value: unknown }>;
  readonly input?: ReadonlyArray<{ readonly name: string; readonly value: unknown }>;
}

/** A preset: the raw payload for one renderable callback type. */
export interface CallbackPreset {
  readonly type: string;
  readonly callbacks: readonly CallbackPayload[];
}

/**
 * The callback types the mapper renders today, one per mapper case. The
 * real-file test verifies this list against the mapper source, so a mapper
 * case added without a catalog entry fails the check.
 */
export const RENDERABLE_CALLBACK_TYPES = [
  'BooleanAttributeInputCallback',
  'ChoiceCallback',
  'ConfirmationCallback',
  'DeviceProfileCallback',
  'HiddenValueCallback',
  'KbaCreateCallback',
  'MetadataCallback',
  'NameCallback',
  'PasswordCallback',
  'PingOneProtectEvaluationCallback',
  'PingOneProtectInitializeCallback',
  'PollingWaitCallback',
  'ReCaptchaCallback',
  'ReCaptchaEnterpriseCallback',
  'RedirectCallback',
  'SelectIdPCallback',
  'StringAttributeInputCallback',
  'SuspendedTextOutputCallback',
  'TermsAndConditionsCallback',
  'TextInputCallback',
  'TextOutputCallback',
  'ValidatedCreatePasswordCallback',
  'ValidatedCreateUsernameCallback',
] as const satisfies readonly JourneyClientCallbackType[];

export type RenderableCallbackType = (typeof RENDERABLE_CALLBACK_TYPES)[number];

/**
 * Extracts the callback types the mapper switches on, from its source
 * text. Guard for the hand-maintained renderable list above.
 */
export const mapperCallbackTypes = (mapperSource: string): readonly string[] => {
  const caseNames = [...mapperSource.matchAll(/case callbackType\.(\w+):/g)].map(
    (match) => match[1] ?? '',
  );
  return [...new Set(caseNames)];
};

/**
 * The preset catalog: one payload per renderable callback type. Keys are
 * the renderable types, so a missing entry is a type error, and the check
 * below verifies the payload's own type field matches.
 */
export const callbackPresets: Record<RenderableCallbackType, CallbackPreset> = {
  BooleanAttributeInputCallback: {
    type: callbackType.BooleanAttributeInputCallback,
    callbacks: [booleanAttributeInput],
  },
  ChoiceCallback: { type: callbackType.ChoiceCallback, callbacks: [choice] },
  ConfirmationCallback: { type: callbackType.ConfirmationCallback, callbacks: [confirmation] },
  DeviceProfileCallback: {
    type: callbackType.DeviceProfileCallback,
    callbacks: [deviceProfileMockMessage.callbacks[0]],
  },
  HiddenValueCallback: { type: callbackType.HiddenValueCallback, callbacks: [hiddenValue] },
  KbaCreateCallback: { type: callbackType.KbaCreateCallback, callbacks: [kbaCreate] },
  MetadataCallback: { type: callbackType.MetadataCallback, callbacks: [metadata] },
  NameCallback: { type: callbackType.NameCallback, callbacks: [name] },
  PasswordCallback: { type: callbackType.PasswordCallback, callbacks: [password] },
  PingOneProtectEvaluationCallback: {
    type: callbackType.PingOneProtectEvaluationCallback,
    callbacks: [pingProtectEvaluate.callbacks[0]],
  },
  PingOneProtectInitializeCallback: {
    type: callbackType.PingOneProtectInitializeCallback,
    callbacks: [PingProtectInitializeData.callbacks[0]],
  },
  PollingWaitCallback: { type: callbackType.PollingWaitCallback, callbacks: [pollingWait] },
  ReCaptchaCallback: {
    type: callbackType.ReCaptchaCallback,
    callbacks: [visibleGrecaptcha.callbacks[0]],
  },
  ReCaptchaEnterpriseCallback: {
    type: callbackType.ReCaptchaEnterpriseCallback,
    callbacks: [visibleGrecaptchaEnterprise.callbacks[0]],
  },
  RedirectCallback: { type: callbackType.RedirectCallback, callbacks: [redirect] },
  SelectIdPCallback: { type: callbackType.SelectIdPCallback, callbacks: [selectIdP] },
  StringAttributeInputCallback: {
    type: callbackType.StringAttributeInputCallback,
    callbacks: [stringAttributeInput],
  },
  SuspendedTextOutputCallback: {
    type: callbackType.SuspendedTextOutputCallback,
    callbacks: [suspendedTextOutput],
  },
  TermsAndConditionsCallback: {
    type: callbackType.TermsAndConditionsCallback,
    callbacks: [termsAndConditions],
  },
  TextInputCallback: { type: callbackType.TextInputCallback, callbacks: [textInput] },
  TextOutputCallback: { type: callbackType.TextOutputCallback, callbacks: [textOutput] },
  ValidatedCreatePasswordCallback: {
    type: callbackType.ValidatedCreatePasswordCallback,
    callbacks: [validatedCreatePassword],
  },
  ValidatedCreateUsernameCallback: {
    type: callbackType.ValidatedCreateUsernameCallback,
    callbacks: [validatedCreateUsername],
  },
};

/** Why a preset-catalog alignment fails. */
export type CallbackPresetViolationKind =
  | 'missing-preset'
  | 'preset-not-renderable'
  | 'unknown-mapper-type';

/** One alignment failure, with a human-readable detail. */
export interface CallbackPresetViolation {
  readonly kind: CallbackPresetViolationKind;
  readonly detail: string;
}

/**
 * Checks the preset catalog's alignment with the journey-client callback
 * enum and the mapper's rendered types. Pure.
 *
 * @param enumTypes every journey-client callback type (the full enum)
 * @param mapperCases the types the mapper switches on (from
 *   `mapperCallbackTypes` over the mapper source)
 * @param presets the catalog to check (defaults to `callbackPresets`)
 */
export const checkCallbackPresets = ({
  enumTypes,
  mapperCases,
  presets = callbackPresets,
}: {
  enumTypes: readonly string[];
  mapperCases: readonly string[];
  presets?: Readonly<Record<string, CallbackPreset>>;
}): readonly CallbackPresetViolation[] => [
  ...mapperCases
    .filter((mapperCase) => !enumTypes.includes(mapperCase))
    .map((type) => ({
      kind: 'unknown-mapper-type' as const,
      detail: `${type} is rendered by the mapper but is not a journey-client callback type`,
    })),
  ...mapperCases
    .filter((mapperCase) => presets[mapperCase] === undefined)
    .map((type) => ({
      kind: 'missing-preset' as const,
      detail: `${type} is rendered by the mapper but has no preset payload`,
    })),
  ...Object.keys(presets)
    .filter((presetType) => !mapperCases.includes(presetType))
    .map((type) => ({
      kind: 'preset-not-renderable' as const,
      detail: `${type} has a preset but the mapper never renders it`,
    })),
];
