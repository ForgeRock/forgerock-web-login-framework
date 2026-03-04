/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * BFF Pipeline Benchmarks
 *
 * Measures the per-request CPU overhead the BFF adds on top of AM latency.
 * The goal: prove the overhead is negligible (<15ms) compared to a typical
 * AM round-trip (50-200ms).
 *
 * Key operations per form submission:
 *   1. unsealAuthId  — AES-256-GCM decrypt (~0.1ms expected)
 *   2. unsealStep    — AES decrypt + Brotli decompress (~1-3ms expected)
 *   3. mergeFormData  — merge FormData into callbacks (~0.01ms expected)
 *   4. sealAuthId    — AES-256-GCM encrypt (~0.1ms expected)
 *   5. sealStep      — Brotli compress + AES encrypt (~2-5ms expected)
 *
 * Run: pnpm --filter login-app exec vitest bench
 */
import { bench, describe } from 'vitest';
import { Duration, Effect, Layer, Redacted } from 'effect';

import type { Cookies } from '@sveltejs/kit';
import { AppConfigService, type AppConfig } from '$server/services/app-config';
import {
  sealAuthId,
  sealStep,
  unsealAuthId,
  unsealStep,
  setCookieAuthId,
  setCookieStep,
  readCookiesAsMap,
  type StepCookieData,
} from '$server/cookie-crypto';
import { mergeFormDataIntoStep, buildAmRequestBody } from '$server/step-mapper';
import { mockCookies } from '$server/route-test-helpers';

// ─── Config ─────────────────────────────────────────────────────────────────

const config: AppConfig = {
  amUrl: 'https://am.example.com/am',
  amCookieName: 'iPlanetDirectoryPro',
  realmPath: 'alpha',
  oauthClientId: 'TestClient',
  cookieSecrets: [Redacted.make('a-very-secret-key-that-is-at-least-32-chars')],
  cookieTtl: Duration.seconds(300),
  appDomain: 'localhost',
  appOrigin: 'http://localhost:5173',
  amRequestTimeout: Duration.millis(30_000),
  amMaxConcurrency: 50,
  rateLimitEnabled: false,
  rateLimitRpm: 60,
  rateLimitBurst: 10,
};

const ConfigLayer = Layer.succeed(AppConfigService, new AppConfigService(config));

const run = <A, E>(effect: Effect.Effect<A, E, AppConfigService>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, ConfigLayer));

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** Realistic authId JWT (~2KB, typical ForgeRock AM) */
const AUTH_ID =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
  'e' +
  'A'.repeat(1500) +
  '.' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/** Simple 2-callback step (username + password) */
const SIMPLE_STEP: StepCookieData = {
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

/** Large 10-callback registration step (~3KB JSON) */
const LARGE_STEP: StepCookieData = {
  callbacks: [
    {
      type: 'ValidatedCreateUsernameCallback',
      output: [
        { name: 'prompt', value: 'Username' },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE', 'MIN_LENGTH', 'MAX_LENGTH'],
            name: 'userName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              {
                params: { minLength: 1 },
                policyId: 'minimum-length',
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                params: { maxLength: 255 },
                policyId: 'maximum-length',
                policyRequirements: ['MAX_LENGTH'],
              },
            ],
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    ...Array.from({ length: 4 }, (_, i) => ({
      type: 'StringAttributeInputCallback',
      output: [
        { name: 'prompt', value: `Field ${i + 2}` },
        { name: 'name', value: `attribute${i + 2}` },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE'],
            name: `attribute${i + 2}`,
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
            ],
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: '' },
      ],
      input: [{ name: `IDToken${i + 2}`, value: '' }],
      _id: i + 1,
    })),
    {
      type: 'BooleanAttributeInputCallback',
      output: [
        { name: 'name', value: 'preferences/marketing' },
        { name: 'prompt', value: 'Marketing emails' },
        { name: 'required', value: false },
        { name: 'value', value: false },
      ],
      input: [{ name: 'IDToken6', value: false }],
      _id: 5,
    },
    {
      type: 'ValidatedCreatePasswordCallback',
      output: [
        { name: 'prompt', value: 'Password' },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'MIN_LENGTH'],
            name: 'password',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                params: { minLength: 8 },
                policyId: 'minimum-length',
                policyRequirements: ['MIN_LENGTH'],
              },
            ],
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
      ],
      input: [{ name: 'IDToken7', value: '' }],
      _id: 6,
    },
    {
      type: 'KbaCreateCallback',
      output: [
        { name: 'prompt', value: 'Security question' },
        {
          name: 'predefinedQuestions',
          value: ["What is your pet's name?", 'Where were you born?', 'Favorite color?'],
        },
      ],
      input: [
        { name: 'IDToken8question', value: '' },
        { name: 'IDToken8answer', value: '' },
      ],
      _id: 7,
    },
    {
      type: 'TermsAndConditionsCallback',
      output: [
        {
          name: 'terms',
          value:
            'By creating an account you agree to our Terms of Service and Privacy Policy. Your data will be processed in accordance with applicable data protection regulations.',
        },
        { name: 'version', value: '2.1' },
      ],
      input: [{ name: 'IDToken9', value: false }],
      _id: 8,
    },
    {
      type: 'HiddenValueCallback',
      output: [{ name: 'id', value: 'csrf' }],
      input: [{ name: 'IDToken10', value: 'server-csrf-token-value' }],
      _id: 9,
    },
  ],
  stage: 'Registration',
  header: 'Create Your Account',
  description: 'Fill in the fields below to register',
  authIndexType: 'service',
  authIndexValue: 'Registration',
};

// ─── Pre-sealed fixtures ────────────────────────────────────────────────────

let sealedSimpleCookies: Cookies;
let sealedLargeCookies: Cookies;
let simpleFormData: FormData;
let largeFormData: FormData;

const setupFixtures = async () => {
  sealedSimpleCookies = mockCookies();
  await run(setCookieAuthId(sealedSimpleCookies, AUTH_ID));
  await run(setCookieStep(sealedSimpleCookies, SIMPLE_STEP));

  sealedLargeCookies = mockCookies();
  await run(setCookieAuthId(sealedLargeCookies, AUTH_ID));
  await run(setCookieStep(sealedLargeCookies, LARGE_STEP));

  simpleFormData = new FormData();
  simpleFormData.set('IDToken1', 'jsmith');
  simpleFormData.set('IDToken2', 'P@ssw0rd!');

  largeFormData = new FormData();
  largeFormData.set('IDToken1', 'janedoe');
  largeFormData.set('IDToken2', 'Jane');
  largeFormData.set('IDToken3', 'Doe');
  largeFormData.set('IDToken4', 'jane@example.com');
  largeFormData.set('IDToken5', '+1-555-0123');
  largeFormData.set('IDToken6', 'true');
  largeFormData.set('IDToken7', 'SecureP@ssw0rd!');
  largeFormData.set('IDToken8question', "What is your pet's name?");
  largeFormData.set('IDToken8answer', 'Fluffy');
  largeFormData.set('IDToken9', 'true');
  // IDToken10 (hidden) — absent from FormData
};

// Ensure fixtures are ready before benchmarks run
const fixturesReady = setupFixtures();

// ─── Individual Operation Benchmarks ────────────────────────────────────────

describe('individual operations', () => {
  describe('sealAuthId (AES encrypt, ~2KB JWT)', () => {
    bench('encrypt authId', async () => {
      await run(sealAuthId(AUTH_ID));
    });
  });

  describe('unsealAuthId (AES decrypt)', () => {
    bench('decrypt authId', async () => {
      await fixturesReady;
      const map = readCookiesAsMap(sealedSimpleCookies);
      await run(unsealAuthId(map));
    });
  });

  describe('sealStep (Brotli compress + AES encrypt)', () => {
    bench('simple step (2 callbacks)', async () => {
      await run(sealStep(SIMPLE_STEP));
    });

    bench('large step (10 callbacks)', async () => {
      await run(sealStep(LARGE_STEP));
    });
  });

  describe('unsealStep (AES decrypt + Brotli decompress)', () => {
    bench('simple step (2 callbacks)', async () => {
      await fixturesReady;
      const map = readCookiesAsMap(sealedSimpleCookies);
      await run(unsealStep(map));
    });

    bench('large step (10 callbacks)', async () => {
      await fixturesReady;
      const map = readCookiesAsMap(sealedLargeCookies);
      await run(unsealStep(map));
    });
  });

  describe('mergeFormDataIntoStep', () => {
    bench('simple (2 inputs)', () => {
      mergeFormDataIntoStep(SIMPLE_STEP, simpleFormData);
    });

    bench('large (10 inputs)', async () => {
      await fixturesReady;
      mergeFormDataIntoStep(LARGE_STEP, largeFormData);
    });
  });
});

// ─── Full Pipeline Benchmarks ───────────────────────────────────────────────

describe('full request pipeline (total BFF overhead per form submission)', () => {
  bench('simple login step: unseal + merge + build', async () => {
    await fixturesReady;
    const map = readCookiesAsMap(sealedSimpleCookies);
    const authId = await run(unsealAuthId(map));
    const step = await run(unsealStep(map));
    const { step: merged } = mergeFormDataIntoStep(step, simpleFormData);
    buildAmRequestBody(authId, merged);
  });

  bench('large registration step: unseal + merge + build', async () => {
    await fixturesReady;
    const map = readCookiesAsMap(sealedLargeCookies);
    const authId = await run(unsealAuthId(map));
    const step = await run(unsealStep(map));
    const { step: merged } = mergeFormDataIntoStep(step, largeFormData);
    buildAmRequestBody(authId, merged);
  });

  bench('simple response: seal authId + seal step (what BFF does after AM responds)', async () => {
    const cookies = mockCookies();
    await run(setCookieAuthId(cookies, AUTH_ID));
    await run(setCookieStep(cookies, SIMPLE_STEP));
  });

  bench('large response: seal authId + seal step', async () => {
    const cookies = mockCookies();
    await run(setCookieAuthId(cookies, AUTH_ID));
    await run(setCookieStep(cookies, LARGE_STEP));
  });

  bench('full round-trip: seal → unseal → merge → build (both directions)', async () => {
    // Seal (what happens after AM responds)
    const cookies = mockCookies();
    await run(setCookieAuthId(cookies, AUTH_ID));
    await run(setCookieStep(cookies, SIMPLE_STEP));

    // Unseal + merge (what happens when user submits form)
    const map = readCookiesAsMap(cookies);
    const authId = await run(unsealAuthId(map));
    const step = await run(unsealStep(map));
    const { step: merged } = mergeFormDataIntoStep(step, simpleFormData);
    buildAmRequestBody(authId, merged);
  });
});
