import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import Input from './validated-create-username.svelte';

const step = new FRStep({
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6InU2NmFvcGJjanFsaWk3azlpOGRzb3V0cW8yIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNXNMVGxKZGpOQ1NtcHFTemQwZEZoSmIzcE1VR04zTG04M2VVeEJZMjAxUzNkamQwdGhXbHB5VEMwNFl6ZEhUbEYwVVRoWlRHdGpOME40ZEdSck56aENTVlF0YkZKU2VHeFdja1Z1WDBWMlVEQkpWbGxzZW5kbWFrVkxSbVJDUzBwQ1FVbFlkVmxSWDJGelRHOTVlbmd4VDFOeU1FNXBPWGsxTkd4dGJXSk1ia2hwUkdveGRtVnNUWHBSVUhWUU5VRk9TMU4xZVVsQlF6Tm1RMmxzVXpoQmJXdzFRMU0yTFhWa1JVdDNSa3N3UjJ0Q1pqUTFZVFpVVW5WeVVVVmtXRm80YlhGUWVqQkpibXRRTUZvMlRGRmxVVWhuTVhFM2JUTTFjR1ZWVFc5MlNrb3hZMXBOVXpCRVYwdE9OVGMwVUhwM01IRTFUM3BDT0dSelRXRmhOa0l0WW1WSVkyOVFabG8yZEdkbU5GazBiMUZ1UlhkUlkydFBiV1JoVEU5ZlVYVXlWRVJrWWpKdmVXa3pURk42T1hoRWQzTnFiRzVrWVc4MlkxQmtSRTl3VG1SQmNpMTJiMHA1YTJWNmJtRnJSVWhVZEdacVZ5MDJkMFJzYzBwaFgxaEZZbmhNUlhKV1oyZERlVFp4U205YVFtaHZhRkpGTnpKMlJHVnZVV2R4VEU4NFVGZEhVV0k1UW1wb2NtRjRWVGxmYld4QmNsRXRiRjkyY1RWVlZ6aFhiRFJQVGw5RVRqSktOM1paUjAxSVp6UlBXbkJYUW1WS0xYWndhRTV6Y0c5a09HdFhOQzB6UXpkdGJuWTFSRWhZWmtsb1puVldhRmRQZFc5UlRHVnFSVXBNTkc1dFQxbFZaM1ZqZDBNelptOU9jbnBNVkZWWVpWUnVhVzlpVEVweE1ISlFTMVpqUlRGblNWaFJkSFI1VDJFelQwaFdaRk0wU2poSmVsZHBkamhaV0ZKeFpXeGtaVGxRVHpOaFUxaE1jR1JOT1d4V1ZHTlpNMlpHWkhwb2FtVXpMVVZ2YTNGbGJYaFJOemhtWWpkMkxVdEhObWw0V0Vwek1YZDJVVjlZTUhCUVMxbG9aMWxTWkRnd09HTktUVFUxV25OSFZIVjFWVzh4U21SeWVVRlVhMmxXYW1wQ1RGUk5ZbmhpWWtReWQwWm5NMVpJVEhORGRGazFhVFpOU1ZRME1IRklkR3hOY1daWVREbHNXVXhWUlhvMVVtaERkR3hKWDB0d2JUUnlUMXBCWDAxdFFrRmpiVnBQY25nMVNHUTVlWE0yUlVSMlUzWklkMVJ5V1ZsSGJuYzFiR1pNUTNrNE5YWkRaRU5zVUdoQ1ltWTRiazl3UTJkR2NraDRiRkV0VkVJNE16SXdTa1pYUWxaeWVWUjJlRmhEVEcxcVdWZEdkR3BSY0ZBd1EwUlFPRFJSUzB0VFdEbHdTbEV1Ym1Wa1ozbEdTMUF5ZDBvMFdYUktXbk5YUlRadlVRLjVjMEhaUnNmRjB1QXI4V1hqX3QwZmFlejZ6UzgtWHZWMW9JWFlBcnFJSnMiLCJleHAiOjE2NTM5MzU3MjksImlhdCI6MTY1MzkzNTQyOX0.G0np0M7TKLgF6e6tPK0MpujZUo0MHZLUTUwlEbmkk0I',
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
  ],
});

export default {
  component: Input,
  title: 'Callbacks/ValidatedCreateUsername',
  argTypes: {
    callback: { control: 'text' },
    inputName: { control: 'text' },
  },
};

export const Simple = {
  args: {
    callback: step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
    inputName: 'usernameCallback',
  },
};
