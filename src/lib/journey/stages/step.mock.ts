import { type Step, CallbackType } from '@forgerock/javascript-sdk';

export const loginStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.PasswordCallback,
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: '',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
};

export const usernamePasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.PasswordCallback,
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: 'UsernamePassword',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
};

export const registrationStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6ImlnOXFqMWNrbjFkYnVjajE2dXBtYmlsYjZtIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNWpPRlJEUTJWRFkyaG9iR1l5ZVRkZmJDMDFSVXhSTGt3eUxWQlRSSFJzUldkVmIzUkZZV3RrZWpNMGQwSXlNekJDTTFGbVNGbGhhV2xZZGpFelV6RmxVWEl0UkcwNVRWY3dTR2htU3pKWk5WcGlPVlo2Yld0b2NFSjRiVGx5UXpFMVUyTmZaRTFSTm1oUk1rMTFOSFpsVm0xTlJUUTNTV3R1Y0djeU1sbE9lVUZRUzJKaGVucGpSMnRMVmxoVmJuWmpjVkpCU25KbGVGQkNRWGxLTURWZlNFdHdNMUIyWTBkaVlVOTRZMVJxVDFCWFQyRTRTbTF6UkRCbGFITk1XV1p3YzFOalIwMVdaVEZyYUU4dFJUZDZPR1YyVGxaVmNqUjNNRTgyVHpoS05GSTRkMHhwU3pseWJsTkpkVlpOZUU5RFFVbDZOVjh5UlhrdE5qazNabVUyTmtKek9UTm5ka3hUU1ZsWVYyVkZkVlF0Um1GRFJ6VTFWWGx5UWxSRGNUZzFTRE14TlZCSU5HMUVTRXhqU25GTWVIbElYM0pIV1RkcFpXRnhORUowV2xVM2RIbHJaVWhZYTBwUU5GVXhTRVJXUWs1M2MwMVhRME5QVUcxSVNGcHpRUzB0WkdkU1Jtb3pabkF3ZEZoWlgxSjRlR3hpUkdONU9WZHlZMG81VkROVWRrRlhSM2N3TTJoUlJISmZTMXBxY1d4bE1YRk5hWFp3TWpoemNHTnRURU5zWmtkYVZVdDZSRlIwTW5wamVqVlZkMVpEYnpsSU4zSmFhRVprZDJkM1lqQm5Ta2xsYTFKTWNXY3pRa3MzUzFCaFYwTnpNbTkxWVdrNExWUlBkM1J6VW14eGR6VTFRMjE0TVZGbFgzVnROVTFyY0dGUU9FSkJNRFUzTUVGNVpYQjNaVTFzVkRsd2FHTlJVSGhTY0Y5NU1FeHNRMkZIUWtOYWNqUmFYMVpqWlhGelIwMUlNbGR1YUdob1VXOTRhM2hNWkRkcFFWcEJNMjFqVlhWMFRtTnhRVlpOZFVwTFdsbHZPVkUxYm5oSk5IWnhWMEpKWkZWNk9IaFljR3BOVGpoR2EwSjVOVmMyY0V4M1lWQkVRaTF5V0dJNVlXeHljQzB0WWt0a2REVjZjRWxXWnpFelRFTjBhV1YzY1haSldFeFFZVEk1V2t0T2FVRjVTblJYWHpkV1gzTjRhbkpXWWxKMk5tMXdUM1ZRYW05dk4xWmZRbWRTWDFCaFZFbFBhR1ZxU0VwbVdtWlVPVjl3ZWw5T1kybFJTbFpFY0ZGTlRrMW9NRnBPZHpKT1dHdEVZMDh4VWtwb1pHNTFaRmRsVGxCc1psWk1NRGhHWm5CYWJFWlFZa3g1YVhsTU5USkZlVjl1ZVV0clIySnRTekEwWTFSaUxXRjNMVko0TVhCb2JqZEROMWhwYzA4elJWOVhYMmN1TTFZeldHNUNNbUZtZEV4NWRWUlVNME5aYldvemR3LmRKWUJVTk5Hb3h6WmZDNDZpQmp2c2VPcVNYVmJLcmNhcC11eko2cGl2ZmMiLCJleHAiOjE2NTQyMTM4ODgsImlhdCI6MTY1NDIxMzU4OH0.2TyyM5dBQYMfuOX24kIzwSy5GSGT8glabII8QN7Gl7A',
  callbacks: [
    {
      type: CallbackType.ValidatedCreateUsernameCallback,
      output: [
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'REQUIRED',
              'MIN_LENGTH',
              'VALID_TYPE',
              'VALID_USERNAME',
              'CANNOT_CONTAIN_CHARACTERS',
              'MAX_LENGTH',
            ],
            fallbackPolicies: null,
            name: 'userName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              { policyRequirements: ['REQUIRED'], policyId: 'not-empty' },
              {
                policyRequirements: ['MIN_LENGTH'],
                policyId: 'minimum-length',
                params: { minLength: 1 },
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
              {
                policyId: 'minimum-length',
                params: { minLength: 1 },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'maximum-length',
                params: { maxLength: 255 },
                policyRequirements: ['MAX_LENGTH'],
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
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'givenName' },
        { name: 'prompt', value: 'First Name' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE'],
            fallbackPolicies: null,
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
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'sn' },
        { name: 'prompt', value: 'Last Name' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE'],
            fallbackPolicies: null,
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
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'mail' },
        { name: 'prompt', value: 'Email Address' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE', 'VALID_EMAIL_ADDRESS_FORMAT'],
            fallbackPolicies: null,
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
      type: CallbackType.BooleanAttributeInputCallback,
      output: [
        { name: 'name', value: 'preferences/marketing' },
        { name: 'prompt', value: 'Send me special offers and services' },
        { name: 'required', value: true },
        { name: 'policies', value: {} },
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
      type: CallbackType.BooleanAttributeInputCallback,
      output: [
        { name: 'name', value: 'preferences/updates' },
        { name: 'prompt', value: 'Send me news and updates' },
        { name: 'required', value: true },
        { name: 'policies', value: {} },
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
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'VALID_TYPE',
              'MIN_LENGTH',
              'AT_LEAST_X_CAPITAL_LETTERS',
              'AT_LEAST_X_NUMBERS',
              'CANNOT_CONTAIN_OTHERS',
            ],
            fallbackPolicies: null,
            name: 'password',
            policies: [
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: {
                  types: ['string'],
                },
              },
              {
                policyId: 'minimum-length',
                params: {
                  minLength: 8,
                },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'at-least-X-capitals',
                params: {
                  numCaps: 1,
                },
                policyRequirements: ['AT_LEAST_X_CAPITAL_LETTERS'],
              },
              {
                policyId: 'at-least-X-numbers',
                params: {
                  numNums: 1,
                },
                policyRequirements: ['AT_LEAST_X_NUMBERS'],
              },
              {
                policyId: 'cannot-contain-others',
                params: {
                  disallowedFields: ['userName', 'givenName', 'sn'],
                },
                policyRequirements: ['CANNOT_CONTAIN_OTHERS'],
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
      type: CallbackType.KbaCreateCallback,
      output: [
        { name: 'prompt', value: 'Select a security question' },
        { name: 'predefinedQuestions', value: ["What's your favorite color?"] },
        {
          name: 'allowUserDefinedQuestions',
          value: true,
        },
      ],
      input: [
        { name: 'IDToken8question', value: '' },
        { name: 'IDToken8answer', value: '' },
      ],
      _id: 7,
    },
    {
      type: CallbackType.TermsAndConditionsCallback,
      output: [
        { name: 'version', value: '0.0' },
        {
          name: 'terms',
          value:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        { name: 'createDate', value: '2019-10-28T04:20:11.320Z' },
      ],
      input: [{ name: 'IDToken9', value: false }],
      _id: 8,
    },
  ],
  stage: 'Registration',
};
