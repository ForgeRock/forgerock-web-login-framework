import { CallbackType } from '@forgerock/javascript-sdk';

export default {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6InU2NmFvcGJjanFsaWk3azlpOGRzb3V0cW8yIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNXNMVGxKZGpOQ1NtcHFTemQwZEZoSmIzcE1VR04zTG04M2VVeEJZMjAxUzNkamQwdGhXbHB5VEMwNFl6ZEhUbEYwVVRoWlRHdGpOME40ZEdSck56aENTVlF0YkZKU2VHeFdja1Z1WDBWMlVEQkpWbGxzZW5kbWFrVkxSbVJDUzBwQ1FVbFlkVmxSWDJGelRHOTVlbmd4VDFOeU1FNXBPWGsxTkd4dGJXSk1ia2hwUkdveGRtVnNUWHBSVUhWUU5VRk9TMU4xZVVsQlF6Tm1RMmxzVXpoQmJXdzFRMU0yTFhWa1JVdDNSa3N3UjJ0Q1pqUTFZVFpVVW5WeVVVVmtXRm80YlhGUWVqQkpibXRRTUZvMlRGRmxVVWhuTVhFM2JUTTFjR1ZWVFc5MlNrb3hZMXBOVXpCRVYwdE9OVGMwVUhwM01IRTFUM3BDT0dSelRXRmhOa0l0WW1WSVkyOVFabG8yZEdkbU5GazBiMUZ1UlhkUlkydFBiV1JoVEU5ZlVYVXlWRVJrWWpKdmVXa3pURk42T1hoRWQzTnFiRzVrWVc4MlkxQmtSRTl3VG1SQmNpMTJiMHA1YTJWNmJtRnJSVWhVZEdacVZ5MDJkMFJzYzBwaFgxaEZZbmhNUlhKV1oyZERlVFp4U205YVFtaHZhRkpGTnpKMlJHVnZVV2R4VEU4NFVGZEhVV0k1UW1wb2NtRjRWVGxmYld4QmNsRXRiRjkyY1RWVlZ6aFhiRFJQVGw5RVRqSktOM1paUjAxSVp6UlBXbkJYUW1WS0xYWndhRTV6Y0c5a09HdFhOQzB6UXpkdGJuWTFSRWhZWmtsb1puVldhRmRQZFc5UlRHVnFSVXBNTkc1dFQxbFZaM1ZqZDBNelptOU9jbnBNVkZWWVpWUnVhVzlpVEVweE1ISlFTMVpqUlRGblNWaFJkSFI1VDJFelQwaFdaRk0wU2poSmVsZHBkamhaV0ZKeFpXeGtaVGxRVHpOaFUxaE1jR1JOT1d4V1ZHTlpNMlpHWkhwb2FtVXpMVVZ2YTNGbGJYaFJOemhtWWpkMkxVdEhObWw0V0Vwek1YZDJVVjlZTUhCUVMxbG9aMWxTWkRnd09HTktUVFUxV25OSFZIVjFWVzh4U21SeWVVRlVhMmxXYW1wQ1RGUk5ZbmhpWWtReWQwWm5NMVpJVEhORGRGazFhVFpOU1ZRME1IRklkR3hOY1daWVREbHNXVXhWUlhvMVVtaERkR3hKWDB0d2JUUnlUMXBCWDAxdFFrRmpiVnBQY25nMVNHUTVlWE0yUlVSMlUzWklkMVJ5V1ZsSGJuYzFiR1pNUTNrNE5YWkRaRU5zVUdoQ1ltWTRiazl3UTJkR2NraDRiRkV0VkVJNE16SXdTa1pYUWxaeWVWUjJlRmhEVEcxcVdWZEdkR3BSY0ZBd1EwUlFPRFJSUzB0VFdEbHdTbEV1Ym1Wa1ozbEdTMUF5ZDBvMFdYUktXbk5YUlRadlVRLjVjMEhaUnNmRjB1QXI4V1hqX3QwZmFlejZ6UzgtWHZWMW9JWFlBcnFJSnMiLCJleHAiOjE2NTM5MzU3MjksImlhdCI6MTY1MzkzNTQyOX0.G0np0M7TKLgF6e6tPK0MpujZUo0MHZLUTUwlEbmkk0I',
  callbacks: [
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
        {
          name: 'failedPolicies',
          value: [],
        },
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
        {
          name: 'echoOn',
          value: false,
        },
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
        {
          name: 'failedPolicies',
          value: [],
        },
        {
          name: 'validateOnly',
          value: false,
        },
        {
          name: 'prompt',
          value: 'Password',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: '',
        },
        {
          name: 'IDToken1validateOnly',
          value: false,
        },
      ],
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
        {
          name: 'failedPolicies',
          value: [
            // TODO: Fix validation crash
            '{ "policyRequirement": "LENGTH_BASED", "params": { "max-password-length": 0, "min-password-length": 8 } }',
            '{ "policyRequirement": "CHARACTER_SET", "params": { "allow-unclassified-characters": true, "character-set-ranges": [  ], "character-sets": [ "1:0123456789", "1:ABCDEFGHIJKLMNOPQRSTUVWXYZ", "1:abcdefghijklmnopqrstuvwxyz", "1:~!@#$%^&*()-_=+[]{}|;:,.<>/?\\"\'\\\\`" ], "min-character-sets": 0 } }',
          ],
        },
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
};

export const docsExample = {
  type: 'ValidatedCreatePasswordCallback',
  output: [
    {
      name: 'echoOn',
      value: false,
    },
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
    {
      name: 'failedPolicies',
      value: [],
    },
    {
      name: 'validateOnly',
      value: false,
    },
    {
      name: 'prompt',
      value: 'Password',
    },
  ],
  input: [
    {
      name: 'IDToken1',
      value: '',
    },
    {
      name: 'IDToken1validateOnly',
      value: false,
    },
  ],
};
