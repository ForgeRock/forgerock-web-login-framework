import { CallbackType, FRStep } from '@forgerock/javascript-sdk';

export const step1 = new FRStep({
  authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
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
        { name: 'failedPolicies', value: ['{ "policyRequirement": "VALID_USERNAME" }'] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Username' },
      ],
      input: [
        { name: 'IDToken1', value: 'jlowery-005' },
        { name: 'IDToken1validateOnly', value: false },
      ],
      _id: 23,
    },
    {
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: ['VALID_TYPE'],
            fallbackPolicies: null,
            name: 'password',
            policies: [
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
  ],
  header: 'Sign Up',
  description:
    "Signing up is fast and easy.<br>Already have an account? <a href='#/service/Login'>Sign In</a>",
  status: 200,
});

export const step2 = new FRStep({
  authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
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
        { name: 'failedPolicies', value: ['{ "policyRequirement": "VALID_USERNAME" }'] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Username' },
      ],
      input: [
        { name: 'IDToken1', value: 'jlowery-005' },
        { name: 'IDToken1validateOnly', value: false },
      ],
      _id: 23,
    },
    {
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: ['VALID_TYPE'],
            fallbackPolicies: null,
            name: 'password',
            policies: [
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
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: ['VALID_TYPE'],
            fallbackPolicies: null,
            name: 'password',
            policies: [
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
  ],
  header: 'Sign Up',
  description:
    "Signing up is fast and easy.<br>Already have an account? <a href='#/service/Login'>Sign In</a>",
  status: 200,
});

export const step3 = new FRStep({
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiMnA1czBwbzNqcmw4ZDJwZm5nNzdubjFpbXAiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1TlNFSkdXaTExU2tGSE9FTnVibUZhVVhCaFpITm5MazB4UzFKak1qRmhTa28wWWpadE56WnBObFl6ZVVwUVZXeENRMlpLTldaWlYzVmpkMjFYTm5wRGNsRk1aV0pGWnpVMVVVbFpiRmRWYmxGa2QwUTVUVnBUWkhWRlFUZHBPVjlsTTFCQ2NqUnhWREU1VG0xZlRWRnpiSHBMZVhGbFpUUndSREJYT1dadWJqSTRlRXMwVUdZemVtTmZXbW93U1ZKVlRYZFBWMUZtVGxsNVdXSk9UMGQwZERVdE1IQnlXRkpmVDNWd2MxcG5kbk5zVlRKRGJFTnFZbGRSYlVReWNXZ3dRVTQyZEU1SVFtMTJlbk5UWmxjdE1XSjFibWh0UjBsSlVWRkJURUpyTFZCRGFpMVdUMk5LTkVVdFh6ZFlhMkpyZVVOdlF6VXpiRWwxT1RoRFdVOUlSRmM1ZUZGNlkzRkdaWFp0ZGxjdE0yNDFkamhXWlhSUmRuSmhTVmN0YTFSU05sVkVTbWhzT0VsMVRXbFhVVVpmVkdGWmJUTktUVlJDU2xkUWFHSjVUVEkyWlRGRVVYRmhhRFYxVWt4cVJtZFpaRTVOYkdWdVQzVlRiRUo2V1ZOR2R6ZG9hVmhWV1cxcVFUQnVTVW90Wkdka1puSjBUVTFsTVU1Q1lrOTJlRFI2ZFZrMFlrUk1aemhqTjJKQ2JGTklSa2sxY1hSTVVFVldhVGhEWkRSeVVrbEpkWE5YTmpSZmVHRm5Ta3BMTjI1NU1IbENSamt5UlhWaldqZEtiekZKT0c5MFJHOVpURVZHTXpOeFlXbHZTMnhFY25aeU5uQTBPRTVLWTB0dE4zQTRjbGN6VFhOV09VODFTMVF4V0dSc1pGOTBXa2RyYzFCVFMyb3pabmczWW01NWFWZ3dYM2czYkVGaE5GVnJhMjFxTkdGaU0yRTNNeTFYZHpoVlJIbG9XakZZVldSU1EwbEllV3BYUVZabmIyVllaM3BWWTBkT2NVeEVlR1U1TUhONVJuTmFObDlOT1dSR2IwWkJaakZTVjJSbk4yUTNkR3BPUjBGSlNFcHZVRTltYVRjdGJXSTBNakZ3UjJsSVNsUnBUVnBVV2tOUVVWVTRVa3BIT1VKbVMyWlBlVEZEWDBadlFVcDBSREp4TlZKUVFXVXpWamw2VkVvMVFUWXhXVUk0WVVwcWFVUkdWMnhaWTBsSmVFTndkakZ2WjJORFUyNWtjMkZ3YXpWRGExaFJMbmRWVDJacFZuVjBha2xXUTBSQ1JrczJkVVp3UVVFLjltazc5XzhVODdZOS0wUU4yS3Z0eTR2ME5wcnlERE82ckdzRU1qZ25LOHMiLCJleHAiOjE2NTM2ODUyMTUsImlhdCI6MTY1MzY4NDkxNX0.184MJHkRvk8CNpmhpLaNWe4cK3vse90CVFkmoR9VF0Q',
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
  stage: 'DefaultLogin',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
});
