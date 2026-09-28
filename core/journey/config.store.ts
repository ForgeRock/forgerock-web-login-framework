/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { writable } from 'svelte/store';
import { z } from 'zod';

import type { Writable } from 'svelte/store';

export const journeyConfigItemSchema = z
  .object({
    journey: z.string().optional(),
    match: z
      .string()
      .regex(/^(#\/service|\?journey)/, {
        message: 'HREF string must start with `?journey` or `#/service`',
      })
      .array(),
  })
  .optional();
export const journeyConfigSchema = z.object({
  forgotPassword: journeyConfigItemSchema,
  forgotUsername: journeyConfigItemSchema,
  login: journeyConfigItemSchema,
  register: journeyConfigItemSchema,
  fallbackJourney: z.string().optional(),
  autoRestart: z.boolean().optional(),
});

type ConfigItem = z.infer<typeof journeyConfigItemSchema>;
export type StoreItem = { key: string } & ConfigItem;

const linkKeys = ['forgotPassword', 'forgotUsername', 'login', 'register'] as const;

const defaultJourneys = {
  forgotPassword: {
    journey: 'ResetPassword',
    match: ['#/service/ResetPassword', '?journey=ResetPassword'],
  },
  forgotUsername: {
    journey: 'ForgottenUsername',
    match: ['#/service/ForgottenUsername', '?journey=ForgottenUsername'],
  },
  login: {
    journey: 'Login',
    match: ['#/service/Login', '?journey', '?journey=Login'],
  },
  register: {
    journey: 'Registration',
    match: ['#/service/Registration', '?journey=Registration'],
  },
} satisfies Record<(typeof linkKeys)[number], ConfigItem>;

// Ensure default follows schema
journeyConfigSchema.parse(defaultJourneys);

const fallbackJourneyConfig = linkKeys.map((key) => ({
  ...defaultJourneys[key],
  key,
}));

export const configuredJourneysStore: Writable<StoreItem[]> = writable(fallbackJourneyConfig);

/**
 * @function initialize - Initialize the configured journeys store
 * @param {object} customJourneys - An object of custom journeys to merge with the default
 * @returns {object} - The configured journeys store
 * @example initialize({ login: { journey: 'Login', match: ['?journey=Login'] } })
 */
export function initialize(customJourneys?: z.infer<typeof journeyConfigSchema> | null) {
  if (customJourneys) {
    // Provide developer feedback if customized
    journeyConfigSchema.parse(customJourneys);

    // Merge the two journey configs, dev's overwriting the default
    const mergedJourneyObjects = {
      ...defaultJourneys,
      ...customJourneys,
    };

    configuredJourneysStore.set(
      linkKeys.map((key) => ({
        ...mergedJourneyObjects[key],
        key,
      })),
    );
  } else {
    configuredJourneysStore.set(fallbackJourneyConfig);
  }
  return configuredJourneysStore;
}
