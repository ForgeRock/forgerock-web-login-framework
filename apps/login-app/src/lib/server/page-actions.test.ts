/**
 * BFF Form Submission Pipeline Tests
 *
 * Verifies the core data flow:
 *
 *   AM response → store in cookie → read from cookie → merge FormData → AM request body
 *
 * The critical invariant: the HTML `<input name=...>` attribute comes from
 * `callback.input[N].name` (e.g., "IDToken1"). The browser submits FormData
 * keyed by that same name. The BFF must merge those values back into the
 * step's callbacks and produce a valid AM request body.
 *
 * Reference: +page.svelte renders `<input name={input.name}>` for each callback.
 * Reference: password.svelte uses `callback.payload.input[0].name` for the input name.
 */
import { describe, expect, it } from 'vitest';
import { Effect, Layer } from 'effect';

import { AppConfigService } from '$server/services/app-config';
import {
  setCookieAuthId,
  setCookieStep,
  unsealAuthId,
  unsealStep,
  readCookiesAsMap,
  type StepCookieData,
} from '$server/cookie-crypto';
import { mergeFormDataIntoStep, buildAmRequestBody, buildAmQueryString } from '$server/step-mapper';
import { mockCookies, testConfig } from '$server/route-test-helpers';

// ─── Shared Config ──────────────────────────────────────────────────────────

const TestConfigLayer = Layer.succeed(AppConfigService, new AppConfigService(testConfig));

const runWithConfig = <A, E>(effect: Effect.Effect<A, E, AppConfigService>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, TestConfigLayer));

// ─── Helper: simulate +page.svelte rendering to build FormData ──────────────

/**
 * Builds FormData the way +page.svelte would render it as HTML form inputs.
 *
 * For each callback, +page.svelte renders:
 *   - NameCallback / PasswordCallback / StringAttribute → `<input name={input.name}>`
 *   - ChoiceCallback → `<select name={input.name}>` with `<option value={idx}>`
 *   - ConfirmationCallback → `<button name={input.name} value={idx}>`
 *   - TermsAndConditionsCallback → `<input type="checkbox" name={input.name} value="true">`
 *   - BooleanAttributeInputCallback → `<input type="checkbox" name={input.name} value="true">`
 *
 * Unchecked checkboxes are absent from FormData (browser behavior).
 */
const buildFormData = (values: Record<string, string>): FormData => {
  const fd = new FormData();
  for (const [name, value] of Object.entries(values)) {
    fd.set(name, value);
  }
  return fd;
};

// ─── Helper: full pipeline ──────────────────────────────────────────────────

/**
 * Runs the full BFF pipeline:
 *   1. Store step + authId in cookies (what +page.server.ts does after AM responds)
 *   2. Read cookies back (what +page.server.ts does on next request)
 *   3. Merge FormData into the step (what step-mapper does)
 *   4. Build the AM request body (what gets sent to AM)
 *
 * Returns the parsed AM request body for assertion.
 */
const runPipeline = async (
  authId: string,
  step: StepCookieData,
  formValues: Record<string, string>,
): Promise<{ authId: string; callbacks: StepCookieData['callbacks'] }> => {
  // 1. Store in cookies (simulates what +page.server.ts does after AM responds)
  const cookies = mockCookies();
  await runWithConfig(setCookieAuthId(cookies, authId));
  await runWithConfig(setCookieStep(cookies, step));

  // 2. Read cookies back (simulates next request arriving with these cookies)
  const cookieMap = readCookiesAsMap(cookies);
  const recoveredAuthId = await runWithConfig(unsealAuthId(cookieMap));
  const recoveredStep = await runWithConfig(unsealStep(cookieMap));

  // 3. Merge FormData (simulates the browser's POST body)
  const formData = buildFormData(formValues);
  const { step: mergedStep } = mergeFormDataIntoStep(recoveredStep, formData);

  // 4. Build AM request
  const body = Effect.runSync(buildAmRequestBody(recoveredAuthId, mergedStep));
  return JSON.parse(body);
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('BFF form submission pipeline', () => {
  describe('Username + Password login', () => {
    // This is what AM returns for a simple Login tree
    const authId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-id-jwt';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'PasswordCallback',
          output: [{ name: 'prompt', value: 'Password' }],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
      ],
      stage: 'UsernamePassword',
      header: 'Sign In',
      authIndexType: 'service',
      authIndexValue: 'Login',
    };

    it('merges username and password into AM request body', async () => {
      // +page.svelte renders:
      //   <input type="text" name="IDToken1" />     (NameCallback)
      //   <input type="password" name="IDToken2" />  (PasswordCallback)
      // Browser submits FormData: IDToken1=jsmith, IDToken2=s3cret
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'jsmith',
        IDToken2: 's3cret',
      });

      expect(amBody.authId).toBe(authId);
      expect(amBody.callbacks[0].input[0]).toEqual({ name: 'IDToken1', value: 'jsmith' });
      expect(amBody.callbacks[1].input[0]).toEqual({ name: 'IDToken2', value: 's3cret' });
    });

    it('preserves authIndexType and authIndexValue in query string', async () => {
      const cookies = mockCookies();
      await runWithConfig(setCookieStep(cookies, step));
      const cookieMap = readCookiesAsMap(cookies);
      const recoveredStep = await runWithConfig(unsealStep(cookieMap));

      const qs = buildAmQueryString(recoveredStep);

      expect(qs).toContain('authIndexType=service');
      expect(qs).toContain('authIndexValue=Login');
    });
  });

  describe('Registration form with mixed callback types', () => {
    const authId = 'registration-auth-id-jwt';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'ValidatedCreateUsernameCallback',
          output: [{ name: 'prompt', value: 'Username' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'StringAttributeInputCallback',
          output: [{ name: 'prompt', value: 'First Name' }],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
        {
          type: 'StringAttributeInputCallback',
          output: [{ name: 'prompt', value: 'Last Name' }],
          input: [{ name: 'IDToken3', value: '' }],
          _id: 2,
        },
        {
          type: 'StringAttributeInputCallback',
          output: [{ name: 'prompt', value: 'Email Address' }],
          input: [{ name: 'IDToken4', value: '' }],
          _id: 3,
        },
        {
          type: 'BooleanAttributeInputCallback',
          output: [{ name: 'name', value: 'preferences/marketing' }],
          input: [{ name: 'IDToken5', value: false }],
          _id: 4,
        },
        {
          type: 'ValidatedCreatePasswordCallback',
          output: [{ name: 'prompt', value: 'Password' }],
          input: [{ name: 'IDToken6', value: '' }],
          _id: 5,
        },
        {
          type: 'TermsAndConditionsCallback',
          output: [
            { name: 'terms', value: 'You agree to our terms of service...' },
            { name: 'version', value: '1.0' },
          ],
          input: [{ name: 'IDToken7', value: false }],
          _id: 6,
        },
      ],
      stage: 'Registration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    };

    it('merges all text inputs and checked checkboxes', async () => {
      // +page.svelte renders:
      //   <input type="text"     name="IDToken1" />  (username)
      //   <input type="text"     name="IDToken2" />  (first name)
      //   <input type="text"     name="IDToken3" />  (last name)
      //   <input type="text"     name="IDToken4" />  (email)
      //   <input type="checkbox" name="IDToken5" value="true" />  (marketing opt-in, checked)
      //   <input type="password" name="IDToken6" />  (password)
      //   <input type="checkbox" name="IDToken7" value="true" />  (T&C, checked)
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'janedoe',
        IDToken2: 'Jane',
        IDToken3: 'Doe',
        IDToken4: 'jane@example.com',
        IDToken5: 'true', // checkbox checked → value="true"
        IDToken6: 'P@ssw0rd!',
        IDToken7: 'true', // checkbox checked → value="true"
      });

      expect(amBody.authId).toBe(authId);
      expect(amBody.callbacks[0].input[0].value).toBe('janedoe');
      expect(amBody.callbacks[1].input[0].value).toBe('Jane');
      expect(amBody.callbacks[2].input[0].value).toBe('Doe');
      expect(amBody.callbacks[3].input[0].value).toBe('jane@example.com');
      expect(amBody.callbacks[4].input[0].value).toBe(true); // coerced to boolean
      expect(amBody.callbacks[5].input[0].value).toBe('P@ssw0rd!');
      expect(amBody.callbacks[6].input[0].value).toBe(true); // coerced to boolean
    });

    it('unchecked checkboxes default to false (absent from FormData)', async () => {
      // Browser does NOT include unchecked checkboxes in FormData.
      // IDToken5 (marketing) and IDToken7 (T&C) are absent → should be false.
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'janedoe',
        IDToken2: 'Jane',
        IDToken3: 'Doe',
        IDToken4: 'jane@example.com',
        // IDToken5 absent (unchecked)
        IDToken6: 'P@ssw0rd!',
        // IDToken7 absent (unchecked)
      });

      expect(amBody.callbacks[4].input[0].value).toBe(false);
      expect(amBody.callbacks[6].input[0].value).toBe(false);
    });
  });

  describe('ChoiceCallback (MFA method selection)', () => {
    const authId = 'mfa-choice-auth-id';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'ChoiceCallback',
          output: [
            { name: 'prompt', value: 'Select authentication method' },
            { name: 'choices', value: ['Email', 'SMS', 'Push Notification'] },
            { name: 'defaultChoice', value: 0 },
          ],
          input: [{ name: 'IDToken1', value: 0 }],
          _id: 0,
        },
      ],
      stage: 'MfaChoice',
    };

    it('coerces select value from string to number', async () => {
      // +page.svelte renders:
      //   <select name="IDToken1">
      //     <option value="0">Email</option>
      //     <option value="1">SMS</option>
      //     <option value="2">Push Notification</option>
      //   </select>
      // Browser submits: IDToken1=1 (as string "1")
      const amBody = await runPipeline(authId, step, {
        IDToken1: '1', // string from <select> → must be coerced to number for AM
      });

      expect(amBody.callbacks[0].input[0].value).toBe(1); // number, not string
    });
  });

  describe('ConfirmationCallback (Submit / Cancel buttons)', () => {
    const authId = 'confirm-auth-id';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'ConfirmationCallback',
          output: [
            { name: 'options', value: ['Submit', 'Cancel', 'Reset'] },
            { name: 'optionType', value: -1 },
          ],
          input: [{ name: 'IDToken2', value: 0 }],
          _id: 1,
        },
      ],
    };

    it('clicking Submit sends index 0 as number', async () => {
      // +page.svelte renders:
      //   <button type="submit" name="IDToken2" value="0">Submit</button>
      //   <button type="submit" name="IDToken2" value="1">Cancel</button>
      //   <button type="submit" name="IDToken2" value="2">Reset</button>
      // Clicking "Submit" → FormData: IDToken2=0
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'jsmith',
        IDToken2: '0', // "Submit" button clicked
      });

      expect(amBody.callbacks[0].input[0].value).toBe('jsmith');
      expect(amBody.callbacks[1].input[0].value).toBe(0); // coerced to number
    });

    it('clicking Cancel sends index 1 as number', async () => {
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'jsmith',
        IDToken2: '1', // "Cancel" button clicked
      });

      expect(amBody.callbacks[1].input[0].value).toBe(1);
    });

    it('unclicked confirmation defaults to false (absent from FormData)', async () => {
      // If no confirmation button is clicked (e.g., form submitted by Enter key
      // and no confirmation button was in the DOM), IDToken2 is absent.
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'jsmith',
        // IDToken2 absent — ConfirmationCallback is a boolean type, defaults to false
      });

      expect(amBody.callbacks[1].input[0].value).toBe(false);
    });
  });

  describe('HiddenValueCallback (preserved through round-trip)', () => {
    const authId = 'hidden-auth-id';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'HiddenValueCallback',
          output: [{ name: 'id', value: 'csrf-token' }],
          input: [{ name: 'IDToken2', value: 'server-generated-csrf-value' }],
          _id: 1,
        },
      ],
    };

    it('preserves hidden value when absent from FormData', async () => {
      // +page.svelte does NOT render a visible input for HiddenValueCallback.
      // The value was set by AM and lives only in the cookie.
      // When the form is submitted, IDToken2 is absent from FormData.
      // The BFF must preserve the original value from the cookie.
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'jsmith',
        // IDToken2 absent — hidden value preserved from cookie
      });

      expect(amBody.callbacks[0].input[0].value).toBe('jsmith');
      expect(amBody.callbacks[1].input[0].value).toBe('server-generated-csrf-value');
    });
  });

  describe('KbaCreateCallback (multi-input per callback)', () => {
    const authId = 'kba-auth-id';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'KbaCreateCallback',
          output: [
            { name: 'prompt', value: 'Select a question' },
            {
              name: 'predefinedQuestions',
              value: ["What is your pet's name?", 'Where were you born?'],
            },
          ],
          input: [
            { name: 'IDToken1question', value: '' },
            { name: 'IDToken1answer', value: '' },
          ],
          _id: 0,
        },
        {
          type: 'KbaCreateCallback',
          output: [
            { name: 'prompt', value: 'Select a question' },
            { name: 'predefinedQuestions', value: ['Favorite color?', 'First car?'] },
          ],
          input: [
            { name: 'IDToken2question', value: '' },
            { name: 'IDToken2answer', value: '' },
          ],
          _id: 1,
        },
      ],
    };

    it('merges multiple inputs per callback', async () => {
      // Each KBA callback has TWO inputs: question + answer.
      // +page.svelte renders them as separate <input> / <select> fields.
      const amBody = await runPipeline(authId, step, {
        IDToken1question: "What is your pet's name?",
        IDToken1answer: 'Fluffy',
        IDToken2question: 'First car?',
        IDToken2answer: 'Honda Civic',
      });

      expect(amBody.callbacks[0].input[0].value).toBe("What is your pet's name?");
      expect(amBody.callbacks[0].input[1].value).toBe('Fluffy');
      expect(amBody.callbacks[1].input[0].value).toBe('First car?');
      expect(amBody.callbacks[1].input[1].value).toBe('Honda Civic');
    });
  });

  describe('SelectIdPCallback (social login)', () => {
    const authId = 'idp-auth-id';
    const step: StepCookieData = {
      callbacks: [
        {
          type: 'SelectIdPCallback',
          output: [
            { name: 'prompt', value: 'Select a provider' },
            {
              name: 'providers',
              value: [
                { provider: 'google', uiConfig: { buttonDisplayName: 'Sign in with Google' } },
                { provider: 'apple', uiConfig: { buttonDisplayName: 'Sign in with Apple' } },
                {
                  provider: 'localAuthentication',
                  uiConfig: { buttonDisplayName: 'Use credentials' },
                },
              ],
            },
          ],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
    };

    it('submits selected provider name as string', async () => {
      // +page.svelte renders:
      //   <button type="submit" name="IDToken1" value="google">Sign in with Google</button>
      //   <button type="submit" name="IDToken1" value="apple">Sign in with Apple</button>
      //   <button type="submit" name="IDToken1" value="localAuthentication">Use credentials</button>
      const amBody = await runPipeline(authId, step, {
        IDToken1: 'google',
      });

      expect(amBody.callbacks[0].input[0].value).toBe('google');
    });
  });

  describe('Cookie round-trip integrity', () => {
    it('step data survives encrypt → compress → chunk → reassemble → decompress → decrypt', async () => {
      // Use a large, realistic step to exercise chunking
      const authId = 'round-trip-auth-id';
      const step: StepCookieData = {
        callbacks: Array.from({ length: 10 }, (_, i) => ({
          type: 'StringAttributeInputCallback',
          output: [
            { name: 'prompt', value: `Field ${i + 1}` },
            {
              name: 'policies',
              value: { policyRequirements: ['REQUIRED', 'MIN_LENGTH'], name: `field${i + 1}` },
            },
          ],
          input: [{ name: `IDToken${i + 1}`, value: '' }],
          _id: i,
        })),
        stage: 'LargeRegistration',
        header: 'Create Account',
        description: 'Fill in all required fields',
        authIndexType: 'service',
        authIndexValue: 'DetailedRegistration',
      };

      const formValues: Record<string, string> = {};
      for (let i = 0; i < 10; i++) {
        formValues[`IDToken${i + 1}`] = `value-for-field-${i + 1}`;
      }

      const amBody = await runPipeline(authId, step, formValues);

      expect(amBody.authId).toBe(authId);
      expect(amBody.callbacks).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(amBody.callbacks[i].input[0]).toEqual({
          name: `IDToken${i + 1}`,
          value: `value-for-field-${i + 1}`,
        });
      }
    });
  });
});
