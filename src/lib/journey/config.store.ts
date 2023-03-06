import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const journeyConfigItemSchema = z.object({
  journey: z.string().optional(),
  match: z
    .string()
    .regex(/^(#\/service|\?journey)/, {
      message: 'HREF string must start with `?journey` or `#/service`',
    })
    .array(),
});
export const journeyConfigSchema = z.object({
  forgotPassword: journeyConfigItemSchema,
  forgotUsername: journeyConfigItemSchema,
  login: journeyConfigItemSchema,
  register: journeyConfigItemSchema,
});

type JourneyKeys = keyof z.infer<typeof journeyConfigSchema>;
type ConfigItem = z.infer<typeof journeyConfigItemSchema>;
export type StoreItem = { key: string } & ConfigItem;

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
    journey: undefined,
    match: ['#/service/Login', '?journey'],
  },
  register: {
    journey: 'Registration',
    match: ['#/service/Registration', '?journey=Registration'],
  },
} satisfies Record<JourneyKeys, ConfigItem>;

// Ensure default follows schema
journeyConfigSchema.parse(defaultJourneys);

export let configuredJourneysStore: Writable<StoreItem[]> = writable(
  (Object.keys(defaultJourneys) as JourneyKeys[]).map((key) => ({
    ...defaultJourneys[key],
    key,
  })),
);

export function initialize(customJourneys?: z.infer<typeof journeyConfigSchema> | null) {
  if (customJourneys) {
    // Provide developer feedback if customized
    journeyConfigSchema.parse(customJourneys);

    const arr = Object.keys(customJourneys) as JourneyKeys[];
    configuredJourneysStore = writable(
      arr.map((key) => ({
        ...customJourneys[key],
        key,
      })),
    );
  }
  return configuredJourneysStore;
}
