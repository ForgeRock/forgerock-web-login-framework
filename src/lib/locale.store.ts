import { readable, writable, type Readable, type Writable } from 'svelte/store';
import { z } from 'zod';

import * as fallback from '$locales/us/en/index.json';

const stringsSchema = z.object({
  alreadyHaveAnAccount: z.string(),
  dontHaveAnAccount: z.string(),
  closeModal: z.string(),
  chooseDifferentUsername: z.string(),
  ensurePasswordIsMoreThan: z.string(),
  ensurePasswordHasOne: z.string(),
  givenName: z.string(),
  loading: z.string(),
  loginButton: z.string(),
  loginHeader: z.string(),
  loginSuccess: z.string(),
  mail: z.string(),
  NameCallback: z.string(),
  nextButton: z.string(),
  PasswordCallback: z.string(),
  pleaseCheckValue: z.string(),
  preferencesmarketing: z.string(),
  preferencesupdates: z.string(),
  registerButton: z.string(),
  registerHeader: z.string(),
  registerSuccess: z.string(),
  securityAnswer: z.string(),
  securityQuestions: z.string(),
  securityQuestionsPrompt: z.string(),
  showPassword: z.string(),
  sn: z.string(),
  submitButton: z.string(),
  successMessage: z.string(),
  termsAndConditions: z.string(),
  useValidEmail: z.string(),
  ValidatedCreatePasswordCallback: z.string(),
  ValidatedCreateUsernameCallback: z.string(),
});
const partialStringsSchema = stringsSchema.partial();

// Ensure fallback follows schema
stringsSchema.parse(fallback);

export const locale: Writable<string | null> = writable('en-US');
export let strings: Readable<Record<string, string> | null>;

export function initializeContent(userLocale?: z.infer<typeof partialStringsSchema>, partial?: boolean) {
  if (userLocale) {
    /**
     * Only parse userLocal if NOT using partial option
     */
    // TODO: Rethink this strategy
    // !partial && stringsSchema.parse(userLocale);

    /**
     * Allow widgets to overwrite select portions of the content
     */
    strings = readable({ ...fallback, ...userLocale });
  } else {
    strings = readable(fallback);
  }
}
