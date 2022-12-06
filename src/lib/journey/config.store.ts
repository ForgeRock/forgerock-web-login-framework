import { readable, type Readable } from 'svelte/store';
import { z } from 'zod';

export const journeyItemSchema = z.object({
  journey: z.string(),
  key: z.string(),
  match: z.string().array(),
});
export const journeysSchema = z.object({
  default: journeyItemSchema,
  forgotPassword: journeyItemSchema,
  forgotUsername: journeyItemSchema,
  login: journeyItemSchema,
  register: journeyItemSchema,
});

export const partialJourneysSchema = journeysSchema.partial();

export let configuredJourneys: Readable<z.infer<typeof journeyItemSchema>[]>;

/**
 * Change `any` here to something that actually works
 */
const defaultJourneys: any = {
  forgotPassword: {
    journey: 'ResetPassword',
    key: 'forgotPassword',
    match: ['#/service/ResetPassword'],
  },
  forgotUsername: {
    journey: 'ForgottenUsername',
    key: 'forgotUsername',
    match: ['#/service/ForgottenUsername'],
  },
  login: {
    journey: undefined,
    key: 'login',
    match: ['#/service/Login', '?journey'],
  },
  register: {
    journey: 'Registration',
    key: 'register',
    match: ['#/service/Registration', '?journey=Registration'],
  },
};

/**
 * TODO: My intention is to type the parameter with `z.infer<typeof partialJourneysSchema>`,
 * but when I do, the `map` does not like it. I tried a few things to fix it with no avail.
 * I just threw an `any` on it for the time being.
 */
export function initialize(customJourneys?: any) {
  if (customJourneys) {
    const arr = Object.keys(customJourneys);
    configuredJourneys = readable(
      arr.map(
        (key) => {
          return customJourneys[key];
        },
      ),
    );
  } else {
    const arr = Object.keys(defaultJourneys);
    configuredJourneys = readable(
      arr.map(
        (key) => {
          return defaultJourneys[key];
        },
      ),
    );
  }
}
