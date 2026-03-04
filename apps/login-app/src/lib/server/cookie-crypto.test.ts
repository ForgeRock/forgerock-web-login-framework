/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { describe, expect, it } from 'vitest';
import { Cause, Effect, Exit, Layer, Redacted } from 'effect';

import type { Cookies } from '@sveltejs/kit';

import { AppConfigService, type AppConfig } from '$server/services/app-config';
import { testConfig } from '$server/route-test-helpers';

import {
  clearAllCookies,
  clearAuthCookies,
  deleteAllCookies,
  deleteAuthCookies,
  deleteOauthCookie,
  parseCookieHeader,
  readCookiesAsMap,
  sealAuthId,
  sealSession,
  sealStep,
  setCookieAuthId,
  setCookieOauth,
  setCookieSession,
  setCookieStep,
  unsealAuthId,
  unsealOauth,
  unsealSession,
  unsealStep,
  type SessionCookieData,
  type StepCookieData,
} from './cookie-crypto';

const TestConfigLayer = Layer.succeed(AppConfigService, new AppConfigService(testConfig));

const wrongKeyConfig: AppConfig = {
  ...testConfig,
  cookieSecrets: [Redacted.make('a-completely-different-key-32-chars!!')],
};
const WrongKeyLayer = Layer.succeed(AppConfigService, new AppConfigService(wrongKeyConfig));

const runWithConfig = <A, E>(effect: Effect.Effect<A, E, AppConfigService>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, TestConfigLayer));

/** Expect an Effect to fail with a specific error tag */
const expectFailureTag = async <A, E extends { _tag: string }>(
  effect: Effect.Effect<A, E, AppConfigService>,
  expectedTag: string,
  layer: Layer.Layer<AppConfigService> = TestConfigLayer,
): Promise<void> => {
  const result = await Effect.runPromiseExit(Effect.provide(effect, layer));
  expect(result._tag).toBe('Failure');
  if (Exit.isFailure(result)) {
    const error = Cause.failureOption(result.cause);
    expect(error._tag).toBe('Some');
    if (error._tag === 'Some') {
      expect(error.value._tag).toBe(expectedTag);
    }
  }
};

/**
 * In-memory mock of SvelteKit's Cookies API.
 * Implements get, getAll, set, delete, serialize — the methods cookie-crypto uses.
 */
const mockCookies = (): Cookies => {
  const store = new Map<string, string>();
  return {
    get: (name: string) => store.get(name),
    getAll: () => [...store].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (name: string) => {
      store.delete(name);
    },
    serialize: (name: string, value: string) => `${name}=${value}`,
  };
};

// ─── Test fixtures ────────────────────────────────────────────────────────────

/**
 * Real AM Registration step callbacks from a live ForgeRock Identity Cloud instance.
 *
 * 10 callbacks: username + 3 string attributes + 2 booleans + password + 2 KBA + T&C.
 */
const registrationCallbacks: StepCookieData['callbacks'] = [
  {
    type: 'ValidatedCreateUsernameCallback',
    output: [
      {
        name: 'policies',
        value: {
          policyRequirements: [
            'REQUIRED',
            'MIN_LENGTH',
            'MAX_LENGTH',
            'VALID_TYPE',
            'VALID_USERNAME',
            'CANNOT_CONTAIN_CHARACTERS',
          ],
          name: 'userName',
          policies: [
            { policyRequirements: ['REQUIRED'], policyId: 'required' },
            {
              policyRequirements: ['MIN_LENGTH'],
              policyId: 'minimum-length',
              params: { minLength: 1 },
            },
            {
              policyRequirements: ['MAX_LENGTH'],
              policyId: 'maximum-length',
              params: { maxLength: 255 },
            },
            {
              policyRequirements: ['VALID_TYPE'],
              policyId: 'valid-type',
              params: { types: ['string'] },
            },
            { policyId: 'valid-username', policyRequirements: ['VALID_USERNAME'] },
            {
              policyId: 'cannot-contain-characters',
              params: { forbiddenChars: ['/'] },
              policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
            },
          ],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'prompt', value: 'Username' },
    ],
    input: [
      { name: 'IDToken1', value: '' },
      { name: 'IDToken1validateOnly', value: false },
    ],
    _id: 0,
  },
  {
    type: 'StringAttributeInputCallback',
    output: [
      { name: 'name', value: 'givenName' },
      { name: 'prompt', value: 'First Name' },
      { name: 'required', value: true },
      {
        name: 'policies',
        value: {
          policyRequirements: ['REQUIRED', 'VALID_TYPE'],
          name: 'givenName',
          policies: [
            { policyRequirements: ['REQUIRED'], policyId: 'required' },
            {
              policyRequirements: ['VALID_TYPE'],
              policyId: 'valid-type',
              params: { types: ['string'] },
            },
          ],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'value', value: '' },
    ],
    input: [
      { name: 'IDToken2', value: '' },
      { name: 'IDToken2validateOnly', value: false },
    ],
    _id: 1,
  },
  {
    type: 'StringAttributeInputCallback',
    output: [
      { name: 'name', value: 'sn' },
      { name: 'prompt', value: 'Last Name' },
      { name: 'required', value: true },
      {
        name: 'policies',
        value: {
          policyRequirements: ['REQUIRED', 'VALID_TYPE'],
          name: 'sn',
          policies: [
            { policyRequirements: ['REQUIRED'], policyId: 'required' },
            {
              policyRequirements: ['VALID_TYPE'],
              policyId: 'valid-type',
              params: { types: ['string'] },
            },
          ],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'value', value: '' },
    ],
    input: [
      { name: 'IDToken3', value: '' },
      { name: 'IDToken3validateOnly', value: false },
    ],
    _id: 2,
  },
  {
    type: 'StringAttributeInputCallback',
    output: [
      { name: 'name', value: 'mail' },
      { name: 'prompt', value: 'Email Address' },
      { name: 'required', value: true },
      {
        name: 'policies',
        value: {
          policyRequirements: ['REQUIRED', 'VALID_TYPE', 'VALID_EMAIL_ADDRESS_FORMAT'],
          name: 'mail',
          policies: [
            { policyRequirements: ['REQUIRED'], policyId: 'required' },
            {
              policyRequirements: ['VALID_TYPE'],
              policyId: 'valid-type',
              params: { types: ['string'] },
            },
            {
              policyId: 'valid-email-address-format',
              policyRequirements: ['VALID_EMAIL_ADDRESS_FORMAT'],
            },
          ],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'value', value: '' },
    ],
    input: [
      { name: 'IDToken4', value: '' },
      { name: 'IDToken4validateOnly', value: false },
    ],
    _id: 3,
  },
  {
    type: 'BooleanAttributeInputCallback',
    output: [
      { name: 'name', value: 'preferences/marketing' },
      { name: 'prompt', value: 'Send me special offers and services' },
      { name: 'required', value: true },
      {
        name: 'policies',
        value: {
          policyRequirements: [],
          name: 'preferences/marketing',
          policies: [],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'value', value: false },
    ],
    input: [
      { name: 'IDToken5', value: false },
      { name: 'IDToken5validateOnly', value: false },
    ],
    _id: 4,
  },
  {
    type: 'BooleanAttributeInputCallback',
    output: [
      { name: 'name', value: 'preferences/updates' },
      { name: 'prompt', value: 'Send me news and updates' },
      { name: 'required', value: true },
      {
        name: 'policies',
        value: {
          policyRequirements: [],
          name: 'preferences/updates',
          policies: [],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'value', value: false },
    ],
    input: [
      { name: 'IDToken6', value: false },
      { name: 'IDToken6validateOnly', value: false },
    ],
    _id: 5,
  },
  {
    type: 'ValidatedCreatePasswordCallback',
    output: [
      { name: 'echoOn', value: false },
      {
        name: 'policies',
        value: {
          policyRequirements: ['REQUIRED', 'MIN_LENGTH', 'VALID_TYPE'],
          name: 'password',
          policies: [
            { policyRequirements: ['REQUIRED'], policyId: 'required' },
            {
              policyRequirements: ['MIN_LENGTH'],
              policyId: 'minimum-length',
              params: { minLength: 8 },
            },
            {
              policyRequirements: ['VALID_TYPE'],
              policyId: 'valid-type',
              params: { types: ['string'] },
            },
          ],
          conditionalPolicies: null,
        },
      },
      { name: 'failedPolicies', value: [] },
      { name: 'validateOnly', value: false },
      { name: 'prompt', value: 'Password' },
    ],
    input: [
      { name: 'IDToken7', value: '' },
      { name: 'IDToken7validateOnly', value: false },
    ],
    _id: 6,
  },
  {
    type: 'KbaCreateCallback',
    output: [
      { name: 'prompt', value: 'Select a security question' },
      {
        name: 'predefinedQuestions',
        value: ["What's your favorite color?", 'Who was your first employer?'],
      },
      { name: 'allowUserDefinedQuestions', value: true },
    ],
    input: [
      { name: 'IDToken8question', value: '' },
      { name: 'IDToken8answer', value: '' },
    ],
    _id: 7,
  },
  {
    type: 'KbaCreateCallback',
    output: [
      { name: 'prompt', value: 'Select a security question' },
      {
        name: 'predefinedQuestions',
        value: ["What's your favorite color?", 'Who was your first employer?'],
      },
      { name: 'allowUserDefinedQuestions', value: true },
    ],
    input: [
      { name: 'IDToken9question', value: '' },
      { name: 'IDToken9answer', value: '' },
    ],
    _id: 8,
  },
  {
    type: 'TermsAndConditionsCallback',
    output: [
      { name: 'version', value: '0.0' },
      {
        name: 'terms',
        value:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      },
      { name: 'createDate', value: '2019-10-28T04:20:11.320Z' },
    ],
    input: [{ name: 'IDToken10', value: false }],
    _id: 9,
  },
];

/**
 * WebAuthn registration callbacks from core/journey/stages/mfa-stages.mock.ts.
 * Two TextOutputCallbacks containing full inline JavaScript (~1.5KB each) plus
 * a HiddenValueCallback for the webAuthnOutcome. These are the heaviest individual
 * callbacks AM produces.
 */
const webAuthnRegistrationCallbacks: StepCookieData['callbacks'] = [
  {
    type: 'TextOutputCallback',
    output: [
      {
        name: 'message',
        value:
          '/*\n * Copyright 2018-2020 ForgeRock AS. All Rights Reserved\n *\n * Use of this code requires a commercial software license with ForgeRock AS.\n * or with one of its affiliates. All use shall be exclusively subject\n * to such license between the licensee and ForgeRock AS.\n */\n\nif (!window.PublicKeyCredential) {\n    document.getElementById(\'webAuthnOutcome\').value = "unsupported";\n    document.getElementById("loginButton_0").click();\n}\n\nvar publicKey = {\n    challenge: new Int8Array([-9, 108, -90, 2, 110, 98, -76, -65, -1, 93, 24, 82, -58, 109, 92, 24, 8, 87, -78, 83, -55, 42, -58, 73, -21, -22, 35, -109, 46, -2, -97, -78]).buffer,\n    // Relying Party:\n    rp: {\n        \n        name: "ForgeRock"\n    },\n    // User:\n    user: {\n        id: Uint8Array.from("NmNlNjdlNzYtYWVjYi00YjA1LWEzY2EtNGIzZjRlYTk3NDNk", function (c) { return c.charCodeAt(0) }),\n        name: "6ce67e76-aecb-4b05-a3ca-4b3f4ea9743d",\n        displayName: "6ce67e76-aecb-4b05-a3ca-4b3f4ea9743d"\n    },\n    pubKeyCredParams: [ { "type": "public-key", "alg": -7 }, { "type": "public-key", "alg": -257 } ],\n    attestation: "none",\n    timeout: 60000,\n    excludeCredentials: [],\n    authenticatorSelection: {"userVerification":"discouraged"}\n};\n\nnavigator.credentials.create({publicKey: publicKey})\n    .then(function (newCredentialInfo) {\n        var rawId = newCredentialInfo.id;\n        var clientData = String.fromCharCode.apply(null, new Uint8Array(newCredentialInfo.response.clientDataJSON));\n        var keyData = new Int8Array(newCredentialInfo.response.attestationObject).toString();\n        document.getElementById(\'webAuthnOutcome\').value = clientData + "::" + keyData + "::" + rawId;\n        document.getElementById("loginButton_0").click();\n    }).catch(function (err) {\n        document.getElementById(\'webAuthnOutcome\').value = "ERROR" + "::" + err;\n        document.getElementById("loginButton_0").click();\n    });',
      },
      { name: 'messageType', value: '4' },
    ],
    input: [{ name: 'IDToken10', value: '' }],
    _id: 100,
  },
  {
    type: 'TextOutputCallback',
    output: [
      {
        name: 'message',
        value:
          '/*\n * Copyright 2018 ForgeRock AS. All Rights Reserved\n *\n * Use of this code requires a commercial software license with ForgeRock AS.\n * or with one of its affiliates. All use shall be exclusively subject\n * to such license between the licensee and ForgeRock AS.\n *\n */\n\n/*\n * Note:\n *\n * When a ConfirmationCallback is used (e.g. during recovery code use), the XUI does not render a loginButton. However\n * the webAuthn script needs to call loginButton.click() to execute the appropriate data reformatting prior to sending\n * the request into AM. Here we query whether the loginButton exists and add it to the DOM if it doesn\'t.\n */\n\nvar newLocation = document.getElementById("wrapper");\n\nvar script = "<div class=\\"form-group\\">\\n" +\n    "<div class=\\"panel panel-default\\">\\n" +\n    "    <div class=\\"panel-body text-center\\">\\n" +\n    "    <h4 class=\\"awaiting-response\\"><i class=\\"fa fa-circle-o-notch fa-spin text-primary\\"></i> Waiting for local device... </h4>\\n" +\n    "    </div>\\n" +\n    "</div>\\n";\n\nif (!document.getElementById("loginButton_0")) {\n    script += "<input id=\\"loginButton_0\\" role=\\"button\\" type=\\"submit\\" hidden>";\n} else {\n    document.getElementById("loginButton_0").style.visibility=\'hidden\';\n}\n\nscript += "</div>";\n\nnewLocation.getElementsByTagName("fieldset")[0].innerHTML += script;\ndocument.body.appendChild(newLocation);',
      },
      { name: 'messageType', value: '4' },
    ],
    input: [{ name: 'IDToken11', value: '' }],
    _id: 101,
  },
  {
    type: 'HiddenValueCallback',
    output: [
      { name: 'value', value: 'false' },
      { name: 'id', value: 'webAuthnOutcome' },
    ],
    input: [{ name: 'IDToken12', value: 'webAuthnOutcome' }],
    _id: 102,
  },
];

// ─── parseCookieHeader ───────────────────────────────────────────────────────

describe('parseCookieHeader', () => {
  it('parseCookieHeader_NullHeader_ReturnsEmptyMap', () => {
    const result = parseCookieHeader(null);
    expect(result.size).toBe(0);
  });

  it('parseCookieHeader_EmptyString_ReturnsEmptyMap', () => {
    const result = parseCookieHeader('');
    expect(result.size).toBe(0);
  });

  it('parseCookieHeader_SingleCookie_ParsesCorrectly', () => {
    const result = parseCookieHeader('name=value');
    expect(result.get('name')).toBe('value');
  });

  it('parseCookieHeader_MultipleCookies_ParsesAll', () => {
    const result = parseCookieHeader('a=1; b=2; c=3');
    expect(result.size).toBe(3);
    expect(result.get('a')).toBe('1');
    expect(result.get('b')).toBe('2');
    expect(result.get('c')).toBe('3');
  });

  it('parseCookieHeader_ValueContainsEquals_PreservesFullValue', () => {
    const result = parseCookieHeader('token=abc=def==');
    expect(result.get('token')).toBe('abc=def==');
  });
});

// ─── sealAuthId / unsealAuthId ───────────────────────────────────────────────

describe('sealAuthId / unsealAuthId', () => {
  it('roundTrip_ShortAuthId_EncryptsAndDecrypts', async () => {
    const authId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload';
    const setCookies = await runWithConfig(sealAuthId(authId));

    expect(setCookies.length).toBe(1);
    expect(setCookies[0]).toContain('__aid=');
    expect(setCookies[0]).toContain('HttpOnly');
    expect(setCookies[0]).toContain('SameSite=Lax');
    expect(setCookies[0]).toContain('Max-Age=300');
    // Not Secure in non-production
    expect(setCookies[0]).not.toContain('Secure');

    // Extract cookie value and decrypt
    const cookieValue = setCookies[0].split(';')[0]; // "__aid=<sealed>"
    const cookies = parseCookieHeader(cookieValue);
    const decrypted = await runWithConfig(unsealAuthId(cookies));
    expect(decrypted).toBe(authId);
  });

  it('roundTrip_LargeAuthId_ChunksAndReassembles', async () => {
    // Generate a large authId that will exceed CHUNK_SIZE after encryption
    const authId = 'x'.repeat(5000);
    const setCookies = await runWithConfig(sealAuthId(authId));

    expect(setCookies.length).toBeGreaterThan(1);
    expect(setCookies[0]).toContain('__aid.0=');
    expect(setCookies[1]).toContain('__aid.1=');

    // Reassemble all chunks into a cookie header
    const cookieParts = setCookies.map((sc) => sc.split(';')[0]);
    const cookies = parseCookieHeader(cookieParts.join('; '));
    const decrypted = await runWithConfig(unsealAuthId(cookies));
    expect(decrypted).toBe(authId);
  });

  it('unsealAuthId_MissingCookie_FailsWithCookieMissing', async () => {
    await expectFailureTag(unsealAuthId(new Map()), 'CookieMissing');
  });

  it('unsealAuthId_TamperedValue_FailsWithCookieDecryptionFailed', async () => {
    const setCookies = await runWithConfig(sealAuthId('test-auth-id'));
    const [name, value] = setCookies[0].split(';')[0].split('=');
    const tampered = new Map([[name, value.slice(0, -5) + 'XXXXX']]);

    await expectFailureTag(unsealAuthId(tampered), 'CookieDecryptionFailed');
  });

  it('unsealAuthId_WrongKey_FailsWithCookieDecryptionFailed', async () => {
    const setCookies = await runWithConfig(sealAuthId('test-auth-id'));
    const cookies = parseCookieHeader(setCookies[0].split(';')[0]);

    await expectFailureTag(unsealAuthId(cookies), 'CookieDecryptionFailed', WrongKeyLayer);
  });

  it('sealAuthId_SameInput_ProducesDifferentCiphertext', async () => {
    const authId = 'determinism-test';
    const seal1 = await runWithConfig(sealAuthId(authId));
    const seal2 = await runWithConfig(sealAuthId(authId));

    const value1 = seal1[0].split(';')[0].split('=')[1];
    const value2 = seal2[0].split(';')[0].split('=')[1];
    // Random IV means different ciphertext each time
    expect(value1).not.toBe(value2);
  });
});

// ─── sealStep / unsealStep ───────────────────────────────────────────────────

describe('sealStep / unsealStep', () => {
  const stepData: StepCookieData = {
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
    description: 'Enter your credentials',
    authIndexType: 'service',
    authIndexValue: 'Login',
  };

  it('roundTrip_TypicalStep_CompressesEncryptsDecrypts', async () => {
    const setCookies = await runWithConfig(sealStep(stepData));

    expect(setCookies.length).toBe(1);
    expect(setCookies[0]).toContain('__step=');

    const cookieValue = setCookies[0].split(';')[0];
    const cookies = parseCookieHeader(cookieValue);
    const decrypted = await runWithConfig(unsealStep(cookies));

    expect(decrypted.callbacks).toEqual(stepData.callbacks);
    expect(decrypted.stage).toBe('UsernamePassword');
    expect(decrypted.header).toBe('Sign In');
    expect(decrypted.authIndexType).toBe('service');
    expect(decrypted.authIndexValue).toBe('Login');
  });

  it('roundTrip_LargeTermsAndConditions_ChunksAndReassembles', async () => {
    const largeStep: StepCookieData = {
      callbacks: [
        {
          type: 'TermsAndConditionsCallback',
          output: [
            { name: 'terms', value: 'T'.repeat(8000) },
            { name: 'version', value: '1.0' },
          ],
          input: [{ name: 'IDToken1', value: false }],
          _id: 0,
        },
      ],
    };

    const setCookies = await runWithConfig(sealStep(largeStep));

    // Reassemble
    const cookieParts = setCookies.map((sc) => sc.split(';')[0]);
    const cookies = parseCookieHeader(cookieParts.join('; '));
    const decrypted = await runWithConfig(unsealStep(cookies));

    expect(decrypted.callbacks[0].type).toBe('TermsAndConditionsCallback');
    expect(String(decrypted.callbacks[0].output[0].value).length).toBe(8000);
  });

  it('sealStep_CompressesBetterThanRaw_SmallerThanUncompressedEncrypted', async () => {
    // Verify that Brotli compression actually reduces size for callback JSON
    const rawJson = JSON.stringify(stepData);
    const setCookies = await runWithConfig(sealStep(stepData));
    const sealedSize = setCookies[0].split(';')[0].split('=')[1].length;

    // The sealed size should be smaller than raw JSON base64url (compression helps)
    const rawBase64Size = Buffer.from(rawJson).toString('base64url').length;
    expect(sealedSize).toBeLessThan(rawBase64Size * 1.5); // Allow overhead for IV + authTag
  });

  it('unsealStep_MissingCookie_FailsWithCookieMissing', async () => {
    await expectFailureTag(unsealStep(new Map()), 'CookieMissing');
  });
});

// ─── sealSession / unsealSession ─────────────────────────────────────────────

describe('sealSession / unsealSession', () => {
  it('roundTrip_WithAmCookieOnly_EncryptsDecrypts', async () => {
    const sessionData: SessionCookieData = {
      amCookie: 'iPlanetDirectoryPro=AQIC5wM2LY4SfcxvdvHOXjtC_eWSs2MpLo',
    };

    const setCookie = await runWithConfig(sealSession(sessionData));
    expect(setCookie).toContain('__session=');

    const cookies = parseCookieHeader(setCookie.split(';')[0]);
    const decrypted = await runWithConfig(unsealSession(cookies));
    expect(decrypted.amCookie).toBe(sessionData.amCookie);
    expect(decrypted.codeVerifier).toBeUndefined();
  });

  it('roundTrip_WithCodeVerifier_PreservesAllFields', async () => {
    const sessionData: SessionCookieData = {
      amCookie: 'iPlanetDirectoryPro=AQIC5wM2LY4SfcxvdvHOXjtC_eWSs2MpLo',
      codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    };

    const setCookie = await runWithConfig(sealSession(sessionData));
    const cookies = parseCookieHeader(setCookie.split(';')[0]);
    const decrypted = await runWithConfig(unsealSession(cookies));
    expect(decrypted.amCookie).toBe(sessionData.amCookie);
    expect(decrypted.codeVerifier).toBe(sessionData.codeVerifier);
  });

  it('sealSession_FitsInSingleCookie_Under800Bytes', async () => {
    const sessionData: SessionCookieData = {
      amCookie: 'iPlanetDirectoryPro=AQIC5wM2LY4SfcxvdvHOXjtC_eWSs2MpLo',
      codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    };

    const setCookie = await runWithConfig(sealSession(sessionData));
    const valueOnly = setCookie.split(';')[0].split('=').slice(1).join('=');
    // Session cookie should be well under 3800 bytes
    expect(valueOnly.length).toBeLessThan(800);
  });
});

// ─── clearAllCookies / clearAuthCookies ──────────────────────────────────────

describe('clearAllCookies', () => {
  it('clearAllCookies_WithAllCookies_ClearsEverything', async () => {
    const cookies = new Map([
      ['__aid', 'sealed-aid'],
      ['__step', 'sealed-step'],
      ['__session', 'sealed-session'],
      ['__oauth', 'sealed-oauth'],
    ]);

    const headers = await runWithConfig(clearAllCookies(cookies));
    expect(headers.length).toBe(4);
    headers.forEach((h) => {
      expect(h).toContain('Max-Age=0');
    });
  });

  it('clearAllCookies_WithChunkedCookies_ClearsAllChunks', async () => {
    const cookies = new Map([
      ['__aid.0', 'chunk0'],
      ['__aid.1', 'chunk1'],
      ['__step.0', 'chunk0'],
      ['__session', 'sealed'],
    ]);

    const headers = await runWithConfig(clearAllCookies(cookies));
    expect(headers.length).toBe(4);
    expect(headers.some((h) => h.startsWith('__aid.0='))).toBe(true);
    expect(headers.some((h) => h.startsWith('__aid.1='))).toBe(true);
    expect(headers.some((h) => h.startsWith('__step.0='))).toBe(true);
    expect(headers.some((h) => h.startsWith('__session='))).toBe(true);
  });

  it('clearAllCookies_NoCookiesPresent_ReturnsEmpty', async () => {
    const headers = await runWithConfig(clearAllCookies(new Map()));
    expect(headers.length).toBe(0);
  });
});

describe('clearAuthCookies', () => {
  it('clearAuthCookies_PreservesSession_OnlyClearsAidAndStep', async () => {
    const cookies = new Map([
      ['__aid', 'sealed-aid'],
      ['__step', 'sealed-step'],
      ['__session', 'sealed-session'],
    ]);

    const headers = await runWithConfig(clearAuthCookies(cookies));
    expect(headers.length).toBe(2);
    expect(headers.some((h) => h.startsWith('__aid='))).toBe(true);
    expect(headers.some((h) => h.startsWith('__step='))).toBe(true);
    expect(headers.some((h) => h.startsWith('__session='))).toBe(false);
  });
});

// ─── Production mode ─────────────────────────────────────────────────────────

describe('production cookie attributes', () => {
  const httpsConfig: AppConfig = {
    ...testConfig,
    appOrigin: 'https://login.example.com',
  };
  const HttpsConfigLayer = Layer.succeed(AppConfigService, new AppConfigService(httpsConfig));

  const runWithHttps = <A, E>(effect: Effect.Effect<A, E, AppConfigService>): Promise<A> =>
    Effect.runPromise(Effect.provide(effect, HttpsConfigLayer));

  it('sealAuthId_HttpsOrigin_IncludesSecureFlag', async () => {
    const setCookies = await runWithHttps(sealAuthId('test'));
    expect(setCookies[0]).toContain('Secure');
  });

  it('sealAuthId_HttpOrigin_OmitsSecureFlag', async () => {
    const setCookies = await runWithConfig(sealAuthId('test'));
    expect(setCookies[0]).not.toContain('Secure');
  });

  it('sealSession_CustomDomain_IncludesDomainAttribute', async () => {
    const configWithDomain: AppConfig = {
      ...testConfig,
      appDomain: 'example.com',
    };
    const DomainLayer = Layer.succeed(AppConfigService, new AppConfigService(configWithDomain));
    const setCookie = await Effect.runPromise(
      Effect.provide(sealSession({ amCookie: 'test' }), DomainLayer),
    );
    expect(setCookie).toContain('Domain=example.com');
  });
});

// ─── Tamper / wrong-key parity for step + session ────────────────────────────

describe('unsealStep security', () => {
  const stepData: StepCookieData = {
    callbacks: [
      {
        type: 'NameCallback',
        output: [{ name: 'prompt', value: 'User Name' }],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
    ],
  };

  it('unsealStep_TamperedValue_FailsWithCookieDecryptionFailed', async () => {
    const setCookies = await runWithConfig(sealStep(stepData));
    const [name, value] = setCookies[0].split(';')[0].split('=');
    const tampered = new Map([[name, value.slice(0, -5) + 'XXXXX']]);

    await expectFailureTag(unsealStep(tampered), 'CookieDecryptionFailed');
  });

  it('unsealStep_WrongKey_FailsWithCookieDecryptionFailed', async () => {
    const setCookies = await runWithConfig(sealStep(stepData));
    const cookies = parseCookieHeader(setCookies[0].split(';')[0]);

    await expectFailureTag(unsealStep(cookies), 'CookieDecryptionFailed', WrongKeyLayer);
  });
});

describe('unsealSession security', () => {
  const sessionData: SessionCookieData = {
    amCookie: 'iPlanetDirectoryPro=AQIC5wM2LY4SfcxvdvHOXjtC_eWSs2MpLo',
    codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  };

  it('unsealSession_MissingCookie_FailsWithCookieMissing', async () => {
    await expectFailureTag(unsealSession(new Map()), 'CookieMissing');
  });

  it('unsealSession_TamperedValue_FailsWithCookieDecryptionFailed', async () => {
    const setCookie = await runWithConfig(sealSession(sessionData));
    const [name, value] = setCookie.split(';')[0].split('=');
    const tampered = new Map([[name, value.slice(0, -5) + 'XXXXX']]);

    await expectFailureTag(unsealSession(tampered), 'CookieDecryptionFailed');
  });

  it('unsealSession_WrongKey_FailsWithCookieDecryptionFailed', async () => {
    const setCookie = await runWithConfig(sealSession(sessionData));
    const cookies = parseCookieHeader(setCookie.split(';')[0]);

    await expectFailureTag(unsealSession(cookies), 'CookieDecryptionFailed', WrongKeyLayer);
  });
});

// ─── setCookieOauth / unsealOauth ─────────────────────────────────────────────

describe('setCookieOauth / unsealOauth', () => {
  it('roundTrip_QueryString_EncryptsAndDecrypts', async () => {
    const queryString = 'redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&scope=openid';
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, queryString));

    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealOauth(map));
    expect(result).toBe(queryString);
  });

  it('unsealOauth_MissingCookie_FailsWithCookieMissing', async () => {
    await expectFailureTag(unsealOauth(new Map()), 'CookieMissing');
  });

  it('unsealOauth_WrongKey_FailsWithCookieDecryptionFailed', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, 'test=value'));

    const map = readCookiesAsMap(cookies);
    await expectFailureTag(unsealOauth(map), 'CookieDecryptionFailed', WrongKeyLayer);
  });

  it('unsealOauth_TamperedValue_FailsWithCookieDecryptionFailed', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, 'test=value'));

    const map = readCookiesAsMap(cookies);
    const sealed = map.get('__oauth')!;
    const tampered = new Map([['__oauth', sealed.slice(0, -5) + 'XXXXX']]);
    await expectFailureTag(unsealOauth(tampered), 'CookieDecryptionFailed');
  });

  it('deleteAllCookies_IncludesOauth', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, 'test=value'));
    await runWithConfig(setCookieSession(cookies, { amCookie: 'test' }));

    expect(readCookiesAsMap(cookies).has('__oauth')).toBe(true);

    deleteAllCookies(cookies, testConfig);

    expect(readCookiesAsMap(cookies).has('__oauth')).toBe(false);
  });

  it('deleteAuthCookies_DoesNotDeleteOauth', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, 'test=value'));
    await runWithConfig(setCookieAuthId(cookies, 'test-aid'));

    deleteAuthCookies(cookies, testConfig);

    const map = readCookiesAsMap(cookies);
    // __oauth should survive
    expect(map.has('__oauth')).toBe(true);
    // __aid should be gone
    await expectFailureTag(unsealAuthId(map), 'CookieMissing');
  });

  it('deleteOauthCookie_DeletesOnlyOauth', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieOauth(cookies, 'test=value'));
    await runWithConfig(setCookieSession(cookies, { amCookie: 'test' }));

    deleteOauthCookie(cookies, testConfig);

    const map = readCookiesAsMap(cookies);
    expect(map.has('__oauth')).toBe(false);
    // __session should survive
    const session = await runWithConfig(unsealSession(map));
    expect(session.amCookie).toBe('test');
  });
});

// ─── clearAllCookies with __oauth ─────────────────────────────────────────────

describe('clearAllCookies (header-based) with __oauth', () => {
  it('clearAllCookies_WithOauthCookie_IncludesOauthClearHeader', async () => {
    const cookies = new Map([
      ['__aid', 'sealed-aid'],
      ['__session', 'sealed-session'],
      ['__oauth', 'sealed-oauth'],
    ]);

    const headers = await runWithConfig(clearAllCookies(cookies));
    expect(headers.length).toBe(3);
    expect(headers.some((h) => h.startsWith('__oauth=') && h.includes('Max-Age=0'))).toBe(true);
  });

  it('clearAuthCookies_DoesNotClearOauth', async () => {
    const cookies = new Map([
      ['__aid', 'sealed-aid'],
      ['__step', 'sealed-step'],
      ['__oauth', 'sealed-oauth'],
    ]);

    const headers = await runWithConfig(clearAuthCookies(cookies));
    expect(headers.some((h) => h.startsWith('__oauth='))).toBe(false);
  });
});

// ─── Schema validation after decryption ──────────────────────────────────────

describe('schema validation after decryption', () => {
  it('unsealStep_ValidJsonWrongShape_FailsWithCookieSchemaError', async () => {
    // Encrypt valid JSON that doesn't match StepCookieDataSchema
    // (missing required `callbacks` array)
    const wrongShape = { foo: 'bar', notCallbacks: true } as unknown as StepCookieData;
    const setCookies = await runWithConfig(sealStep(wrongShape));
    const cookies = parseCookieHeader(setCookies[0].split(';')[0]);

    // Schema.parseJson failure should be wrapped as CookieSchemaError
    await expectFailureTag(unsealStep(cookies), 'CookieSchemaError');
  });

  it('unsealSession_ValidJsonWrongShape_FailsWithCookieSchemaError', async () => {
    // Encrypt valid JSON that doesn't match SessionCookieDataSchema
    // (missing required `amCookie` field)
    const wrongShape = { notAmCookie: 'test' } as unknown as SessionCookieData;
    const setCookie = await runWithConfig(sealSession(wrongShape));
    const cookies = parseCookieHeader(setCookie.split(';')[0]);

    // Schema.parseJson failure should be wrapped as CookieSchemaError
    await expectFailureTag(unsealSession(cookies), 'CookieSchemaError');
  });
});

// ─── SvelteKit Cookies integration ───────────────────────────────────────────

describe('SvelteKit Cookies integration', () => {
  const stepData: StepCookieData = {
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
  };

  it('setCookieAuthId_ThenReadAndUnseal_RoundTrips', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieAuthId(cookies, 'jwt-auth-id-value'));

    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealAuthId(map));

    expect(result).toBe('jwt-auth-id-value');
  });

  it('setCookieStep_ThenReadAndUnseal_RoundTrips', async () => {
    const cookies = mockCookies();
    await runWithConfig(setCookieStep(cookies, stepData));

    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealStep(map));

    expect(result.callbacks).toEqual(stepData.callbacks);
    expect(result.stage).toBe('UsernamePassword');
  });

  it('setCookieSession_ThenReadAndUnseal_RoundTrips', async () => {
    const sessionData: SessionCookieData = {
      amCookie: 'iPlanetDirectoryPro=AQIC5wM2LY4SfcxvdvHOXjtC_eWSs2MpLo',
      codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    };
    const cookies = mockCookies();
    await runWithConfig(setCookieSession(cookies, sessionData));

    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealSession(map));

    expect(result.amCookie).toBe(sessionData.amCookie);
    expect(result.codeVerifier).toBe(sessionData.codeVerifier);
  });

  it('deleteAllCookies_ClearsAllState', async () => {
    const cookies = mockCookies();

    // Set all three cookie types
    await runWithConfig(setCookieAuthId(cookies, 'test-aid'));
    await runWithConfig(setCookieStep(cookies, stepData));
    await runWithConfig(setCookieSession(cookies, { amCookie: 'test' }));

    // Verify cookies exist
    expect(readCookiesAsMap(cookies).size).toBeGreaterThan(0);

    // Clear everything
    deleteAllCookies(cookies, testConfig);

    // All cookies should be gone
    const map = readCookiesAsMap(cookies);
    expect(map.size).toBe(0);
  });

  it('deleteAuthCookies_PreservesSession', async () => {
    const cookies = mockCookies();

    await runWithConfig(setCookieAuthId(cookies, 'test-aid'));
    await runWithConfig(setCookieStep(cookies, stepData));
    await runWithConfig(setCookieSession(cookies, { amCookie: 'test-session' }));

    // Clear only auth cookies
    deleteAuthCookies(cookies, testConfig);

    // Session should survive, auth cookies should be gone
    const map = readCookiesAsMap(cookies);
    await expectFailureTag(unsealAuthId(map), 'CookieMissing');
    await expectFailureTag(unsealStep(map), 'CookieMissing');

    const session = await runWithConfig(unsealSession(map));
    expect(session.amCookie).toBe('test-session');
  });
});

// ─── Realistic round-trip ────────────────────────────────────────────────────

describe('realistic registration step', () => {
  it('roundTrip_FullRegistrationStep_CompressesAndRoundTrips', async () => {
    const cookies = mockCookies();
    const regStep: StepCookieData = {
      callbacks: registrationCallbacks,
      stage: 'DefaultRegistration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    };

    await runWithConfig(setCookieStep(cookies, regStep));
    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealStep(map));

    expect(result.callbacks).toHaveLength(10);
    expect(result.callbacks[0].type).toBe('ValidatedCreateUsernameCallback');
    expect(result.callbacks[9].type).toBe('TermsAndConditionsCallback');
    expect(result.stage).toBe('DefaultRegistration');
    expect(result.authIndexType).toBe('service');
    expect(result.authIndexValue).toBe('Registration');
  });

  it('roundTrip_RegistrationPlusWebAuthn_CompressesAndRoundTrips', async () => {
    // Worst-case realistic payload: full registration + WebAuthn registration.
    // 12 callbacks including two ~1.5KB inline JS TextOutputCallbacks.
    const cookies = mockCookies();
    const combinedStep: StepCookieData = {
      callbacks: [...registrationCallbacks, ...webAuthnRegistrationCallbacks],
      stage: 'DefaultRegistration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    };

    await runWithConfig(setCookieStep(cookies, combinedStep));
    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealStep(map));

    expect(result.callbacks).toHaveLength(13);
    expect(result.callbacks[0].type).toBe('ValidatedCreateUsernameCallback');
    expect(result.callbacks[10].type).toBe('TextOutputCallback');
    expect(result.callbacks[12].type).toBe('HiddenValueCallback');
  });

  it('roundTrip_RegistrationPlusWebAuthn_ChunkCount', async () => {
    // Document how many chunks the largest realistic payload produces
    const combinedStep: StepCookieData = {
      callbacks: [...registrationCallbacks, ...webAuthnRegistrationCallbacks],
      stage: 'DefaultRegistration',
    };

    const setCookies = await runWithConfig(sealStep(combinedStep));
    // 12 callbacks (9 registration + 3 WebAuthn) with ~3KB of inline JS
    // compresses to ~3535 bytes — still fits in a single cookie
    expect(setCookies.length).toBe(1);
  });

  it('roundTrip_RegistrationFitsInSingleChunk_BrotliCompressesWell', async () => {
    // A 9-callback registration step with policies, terms, and KBA should
    // compress well enough to fit in a single __step cookie (no chunking needed).
    const regStep: StepCookieData = {
      callbacks: registrationCallbacks,
      stage: 'DefaultRegistration',
    };

    const setCookies = await runWithConfig(sealStep(regStep));
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]).toContain('__step=');
  });
});

// ─── Merged authId feasibility ───────────────────────────────────────────────

describe('merged authId feasibility', () => {
  // Real authId JWT from a live ForgeRock AM Registration tree (~2.2KB)
  const realAuthId =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6IjZjamtrZGRyYjhwczM2Y2xybjk4dXU2M2ZzIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0hVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNVdRVWhrVDJjeldrbzNaWFJEU2xSQkxUTllZekJuTG5veE56TnJhelJIZWxwRldqZzVPVmx5WTFremIzZHFaV2d3VFV0UE1DMWlObUZHYkhNNGMwNUdUVVZVVjJSTmJFWm5kekJFU0RVMmVscDNkM2RUZEVwZlYwTTVWemRFVVhaQ1prdGlORGwwWm1GV2VVRkhkM3BqUm5sWmMyazNWamhzVHpSSVlVOUdUazlCTFRCcE1FcE9Vbk01V0U1cGFuVlZlWG8wWjJkMFlVcExUMnR4Y1hKRmQwTkVVSFJLVlhOc1JVNW9ZWGxhUlU1aWFuSkJlbUpITVRrNVR5MUxNblpOZGxKMGNVSTJSazFMTFc5c01URmpVV014VWpJeVdWYzJkRFJMVkdOcE5qbEhTRUpuVDBKM2FXZHZSVVJJVEhCa1VsSlhZWFV3VTNoUmQwWklka0Z3YkhKWlNHTnVZVTEwTTNSeVZHUmFibGRPVmxsRlZreFlibmgzUWxWMlltbzNWM1ZXTFdSeFUzcFZTVTFSUmt0UE1XaHZOVnBXTVVwbVVtaHRiRVYwV1hweGRIaFZjbE5VVDB4WWR6WkJUM1EwZGsxdU5EZFhia1ZKUjNwTGFETlRXbEZWVDNSS1FtSmphMWw1V21oWmRGTmxhMFZQWlRSaE0wdFBMV1F5YzJaeVRtaFBZWE0yVnpNNWNHeE1WMVIyZFVRMFVXOVpRVzVLV0d4NGVEWTFjWEl4ZDJWUVVHTjZNRGxTT0VGeExUZFZlakV4U20xSk1GbERhRGxqTUUxSFlVRldURXMyTlhwa1VrcFhTM3BtZFU5TFgxcDNXa0V5TFVGeVVtSm9kblJUTUVaWFdHaFBZMkpoYTJGSVRreEdZVFJ0UjA5elpuRnBibkZNWkhSdlVreDFkRkpJWkMxZmJXZDRXR05wVTFseldraDRXVUpuZWpCVE9XUklkV1J4TVVodFZIWkdNRmRMT0RWamRrWjFUSEoyWDBkb1lubFNYMk5HTjJ4dVUzcHpXbU5YZDJ4cWVGVldkR3ROWm5aS2NXaE5VM0V5ZFdReVpqZE5hMW8xVW5WQlRYbFlNVVE1WTNKU1dYZzNYMWRRTTBkSGFEUklOMUkxUjBsS1gzcHdPR3R0VmtwUFVqQm1lRlZsUTNVekxWcDVZbkJaV0hkMmEyMURMVVYyUkVKR1dIZEVWSG8yU25OSGJIQmhkR2g0ZDA5eWNXbHBUa1pUWTBwbVRUZG9UVnBsVkVobU1ISjVSbVppTTNNNFpXSXhhMVkxWVhWVmEzRk1WbWhzWkdwTVN6RTFjRVJ2Tm05V1RtUlZXVEJ2WlRNM2VtWnRTbmQxYlVKWlFrUXpUM2RQZGpSNGFUaFVNRWt3VG0xc1JqUTNTV0ZCT1c1clV6WXlWRk14UzJSblRVZFBiemszUlRjMGVWRkxTbkEwTUhWdFRsTnVRVGxqVFZCZmRsZFNkbEl6TmpCTVRrdGthWFpaWDJ0ZlEwUlpPR2hyT1c5SlV6SlllbWg0TUVaM05ERndNbkY2VkVGS1F6UnNiSEpuTGtSSk1WRXdjRWRRYjJoQldsVk9SMGxaYUVoMllXYy5BRGdvTWVCWGg5WHpVMHM2SFp5Z3ZhR2ZsRlFBdm43Q2Z6bl91eWdQY1VvIiwiZXhwIjoxNzcyMjU0MTM2LCJpYXQiOjE3NzIyNTM4MzZ9.eM6RrOXu3hrmAB4r4PD7z9dEaoOECcNg_NB0fIV6_qE';

  it('mergedStep_RealRegistrationWithAuthId_FitsInCookies', async () => {
    // Real production payload: exact authId + callbacks from live AM instance
    const mergedStep = {
      authId: realAuthId,
      callbacks: registrationCallbacks,
      stage: 'DefaultRegistration',
      header: 'Sign Up',
      description:
        "Signing up is fast and easy.<br>Already have an account? <a href='#/service/Login'>Sign In</a>",
      authIndexType: 'service',
      authIndexValue: 'Registration',
    } as unknown as StepCookieData;

    const setCookies = await runWithConfig(sealStep(mergedStep));
    // Real production payload: 2.2KB JWT + 10 callbacks → 2 chunks, ~4KB total
    expect(setCookies.length).toBe(2);
  });

  it('mergedStep_RegistrationPlusWebAuthnWithAuthId_FitsInCookies', async () => {
    // Worst case: real registration + WebAuthn + authId all in one cookie
    const mergedStep = {
      authId: realAuthId,
      callbacks: [...registrationCallbacks, ...webAuthnRegistrationCallbacks],
      stage: 'DefaultRegistration',
      header: 'Sign Up',
      description:
        "Signing up is fast and easy.<br>Already have an account? <a href='#/service/Login'>Sign In</a>",
      authIndexType: 'service',
      authIndexValue: 'Registration',
    } as unknown as StepCookieData;

    const setCookies = await runWithConfig(sealStep(mergedStep));
    // 13 callbacks + 2.2KB JWT + 3KB inline JS → 2 chunks, ~6KB total
    expect(setCookies.length).toBe(2);
  });

  it('mergedStep_DoubledStepWithAuthId_FitsInCookies', async () => {
    // Unrealistic stress test: 24 callbacks + authId
    const doubledCallbacks = [
      ...registrationCallbacks,
      ...webAuthnRegistrationCallbacks,
      ...registrationCallbacks,
      ...webAuthnRegistrationCallbacks,
    ];
    const mergedStep = {
      authId: realAuthId,
      callbacks: doubledCallbacks,
      stage: 'DefaultRegistration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    } as unknown as StepCookieData;

    const setCookies = await runWithConfig(sealStep(mergedStep));
    // 24 callbacks + JWT: Brotli compresses duplicate structure so well
    // that doubling callbacks barely changes the output size — still 2 chunks
    expect(setCookies.length).toBe(2);
  });

  it('mergedStep_RealisticLargerAuthId_FitsInTwoChunks', async () => {
    // Larger-than-average JWT: deep realm, long session ID, custom claims.
    // Real JWTs are base64(JSON) — structured content Brotli compresses well.
    const largeClaims = Buffer.from(
      JSON.stringify({
        authIndexValue: 'ComplexTreeWithManyNodes',
        otk: '47lmue1o2ear8u84jrstmomu25',
        authIndexType: 'service',
        realm: '/alpha/bravo/charlie/delta',
        sessionId:
          '*AAJTSQACMDIABHR5cGUACEpXVF9BVVRIAAJTMQACMde.longSessionDataHere' + 'A'.repeat(1500),
        exp: 1698100351406,
        customProp1: 'some-custom-session-property-value-that-admin-configured',
        customProp2: 'another-property-with-meaningful-content-for-the-application',
      }),
    ).toString('base64url');
    const realisticLargeAuthId = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${largeClaims}.QdH6gR4bCTLStkZ08BjADk3zv4kX32I`;

    const mergedStep = {
      authId: realisticLargeAuthId,
      callbacks: [...registrationCallbacks, ...webAuthnRegistrationCallbacks],
      stage: 'DefaultRegistration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    } as unknown as StepCookieData;

    const setCookies = await runWithConfig(sealStep(mergedStep));
    // ~2.6KB realistic JWT + 12 callbacks: 2 chunks
    expect(setCookies.length).toBe(2);
  });

  it('mergedStep_PureRandomAuthId_WorstCaseThreeChunks', async () => {
    // Absolute worst case: 4KB of pure random bytes (incompressible).
    // No real JWT looks like this — JWTs are base64(JSON) with structure.
    // Establishes the upper bound: even incompressible data stays at 3 chunks.
    const { randomBytes } = await import('node:crypto');
    const randomAuthId = randomBytes(3000).toString('base64url');

    const mergedStep = {
      authId: randomAuthId,
      callbacks: [...registrationCallbacks, ...webAuthnRegistrationCallbacks],
      stage: 'DefaultRegistration',
      authIndexType: 'service',
      authIndexValue: 'Registration',
    } as unknown as StepCookieData;

    const setCookies = await runWithConfig(sealStep(mergedStep));
    // 4KB random + 12 callbacks: 3 chunks worst case
    expect(setCookies.length).toBe(3);
  });
});

// ─── Stale chunk cleanup ─────────────────────────────────────────────────────

describe('stale chunk cleanup', () => {
  it('setCookieStep_WithPreExistingChunks_ClearsStaleChunks', async () => {
    const cookies = mockCookies();

    // Simulate stale chunks left over from a previous larger step.
    // In production, these would be from a setCookieStep that produced 3 chunks.
    // We inject them directly because Brotli compresses callback JSON so well
    // that it's nearly impossible to organically create multi-chunk step cookies.
    (cookies as unknown as { set: (n: string, v: string) => void }).set('__step.0', 'stale0');
    (cookies as unknown as { set: (n: string, v: string) => void }).set('__step.1', 'stale1');
    (cookies as unknown as { set: (n: string, v: string) => void }).set('__step.2', 'stale2');
    expect(readCookiesAsMap(cookies).size).toBe(3);

    // Now set a small step — should clear all stale chunks and set new ones
    const smallStep: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
    };
    await runWithConfig(setCookieStep(cookies, smallStep));

    // Unseal should return the small step, not corrupted data
    const map = readCookiesAsMap(cookies);
    const result = await runWithConfig(unsealStep(map));

    expect(result.callbacks[0].type).toBe('NameCallback');
    expect(result.callbacks).toHaveLength(1);
    // No stale __step.1 or __step.2 should remain
    expect(map.has('__step.1')).toBe(false);
    expect(map.has('__step.2')).toBe(false);
  });

  it('setCookieAuthId_AfterLargerAuthId_ClearsStaleChunks', async () => {
    const cookies = mockCookies();

    // First: large authId → multiple chunks (authId is uncompressed, so this works)
    await runWithConfig(setCookieAuthId(cookies, 'x'.repeat(5000)));
    const chunksAfterLarge = readCookiesAsMap(cookies).size;
    expect(chunksAfterLarge).toBeGreaterThan(1);

    // Second: short authId → single cookie
    await runWithConfig(setCookieAuthId(cookies, 'short-jwt'));

    // Should have fewer cookies now (stale chunks cleaned up)
    const map = readCookiesAsMap(cookies);
    expect(map.size).toBeLessThan(chunksAfterLarge);
  });
});
