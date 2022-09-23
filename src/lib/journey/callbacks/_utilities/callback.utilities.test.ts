import { CallbackType, FRStep } from '@forgerock/javascript-sdk';
import { describe, expect, it } from 'vitest';

import {
  getAttributeValidationFailureText,
  getInputTypeFromPolicies,
  getPasswordValidationFailureText,
  getValidationFailureParams,
  getValidationFailures,
  getValidationPolicies,
  isInputRequired,
  parseFailedPolicies,
} from './callback.utilities';

describe('Test attribute validation failure getter', () => {
  it('should return NO error message when failed policy is NOT present', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
      callbacks: [
        {
          type: CallbackType.BooleanAttributeInputCallback,
          output: [
            { name: 'name', value: 'acceptance' },
            { name: 'prompt', value: 'Please accept this' },
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
      ],
    });
    const result = getAttributeValidationFailureText(
      step.getCallbackOfType(CallbackType.BooleanAttributeInputCallback),
    );
    const expected = '';

    expect(result).toStrictEqual(expected);
  });

  it('should return error message when failed policy is present', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
      callbacks: [
        {
          type: CallbackType.BooleanAttributeInputCallback,
          output: [
            { name: 'name', value: 'acceptance' },
            { name: 'prompt', value: 'Please accept this' },
            { name: 'required', value: true },
            { name: 'policies', value: {} },
            { name: 'failedPolicies', value: ['{ policyRequirement: "MUST_BE_ACCEPTED" }'] },
            { name: 'validateOnly', value: false },
            { name: 'value', value: false },
          ],
          input: [
            { name: 'IDToken6', value: false },
            { name: 'IDToken6validateOnly', value: false },
          ],
          _id: 5,
        },
      ],
    });
    const result = getAttributeValidationFailureText(
      step.getCallbackOfType(CallbackType.BooleanAttributeInputCallback),
    );
    const expected = 'Please Check Value';

    expect(result).toStrictEqual(expected);
  });
});

describe('Test generic callback policy getter', () => {
  it('should test username creation policy getter', () => {
    const policies = getValidationPolicies({
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
        {
          policyRequirements: ['REQUIRED'],
          policyId: 'required',
        },
        {
          policyRequirements: ['REQUIRED'],
          policyId: 'not-empty',
        },
        {
          policyId: 'maximum-length',
          params: {
            maxLength: 255,
          },
          policyRequirements: ['MAX_LENGTH'],
        },
        {
          policyRequirements: ['MIN_LENGTH'],
          policyId: 'minimum-length',
          params: {
            minLength: 1,
          },
        },
        {
          policyRequirements: ['VALID_TYPE'],
          policyId: 'valid-type',
          params: {
            types: ['string'],
          },
        },
        {
          policyId: 'valid-username',
          policyRequirements: ['VALID_USERNAME'],
        },
        {
          policyId: 'cannot-contain-characters',
          params: {
            forbiddenChars: ['/'],
          },
          policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
        },
      ],
      conditionalPolicies: null,
    });

    expect(policies).toStrictEqual([
      // {
      //   message: 'Required Field',
      //   policyId: 'required',
      // },
      // {
      //   message: 'Field Can Not Be Empty',
      //   policyId: 'not-empty',
      // },
      // {
      //   message: 'Exceeds Maximum Character Length',
      //   params: {
      //     maxLength: 255,
      //   },
      //   policyId: 'maximum-length',
      // },
      // {
      //   message: 'Does Not Meet Minimum Character Length',
      //   params: {
      //     minLength: 1,
      //   },
      //   policyId: 'minimum-length',
      // },
      // {
      //   message: '',
      //   params: {
      //     types: ['string'],
      //   },
      //   policyId: 'valid-type',
      // },
      // {
      //   message: 'Choose Different Username',
      //   policyId: 'valid-username',
      // },
      {
        message: 'Field Can Not Contain Following Characters',
        params: {
          forbiddenChars: ['/'],
        },
        policyId: 'cannot-contain-characters',
      },
    ]);
  });

  it('should test username failed policy getter', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
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
                policies: [],
                conditionalPolicies: null,
              },
            },
            {
              name: 'failedPolicies',
              value: ['{ "policyRequirement": "VALID_USERNAME" }'],
            },
            {
              name: 'validateOnly',
              value: false,
            },
            {
              name: 'prompt',
              value: 'Username',
            },
          ],
          input: [
            {
              name: 'IDToken1',
              value: 'existing-username',
            },
            {
              name: 'IDToken1validateOnly',
              value: false,
            },
          ],
          _id: 9,
        },
      ],
    });
    const failedPolicies = getValidationFailures(
      step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
      'username',
    );

    expect(failedPolicies).toStrictEqual([
      {
        params: undefined,
        policyRequirement: 'VALID_USERNAME',
        restructured: [
          {
            length: null,
            message: 'Choose Different Username',
            rule: 'validUsername',
          },
        ],
      },
    ]);
  });

  it('should test password failed policy getter', () => {
    const step = new FRStep({
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
              value: [
                // TODO: Fix validation crash
                '{ "policyRequirement": "LENGTH_BASED", "params": { "max-password-length": 0, "min-password-length": 8 } }',
                '{ "policyRequirement": "CHARACTER_SET", "params": { "allow-unclassified-characters": true, "character-set-ranges": [  ], "character-sets": [ "1:0123456789", "1:ABCDEFGHIJKLMNOPQRSTUVWXYZ", "1:abcdefghijklmnopqrstuvwxyz", "1:~!@#$%^&*()-_=+[]{}|;:,.<>/?" ], "min-character-sets": 0 } }',
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
    });
    const failedPolicies = getValidationFailures(
      step.getCallbackOfType(CallbackType.ValidatedCreatePasswordCallback),
      'username',
    );

    expect(failedPolicies).toStrictEqual([
      {
        params: { 'max-password-length': 0, 'min-password-length': 8 },
        policyRequirement: 'LENGTH_BASED',
        restructured: [
          {
            length: 8,
            message: 'Does Not Meet Minimum Character Length',
            rule: 'minimumLength',
          },
        ],
      },
      {
        params: {
          'allow-unclassified-characters': true,
          'character-set-ranges': [],
          'character-sets': [
            '1:0123456789',
            '1:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            '1:abcdefghijklmnopqrstuvwxyz',
            '1:~!@#$%^&*()-_=+[]{}|;:,.<>/?',
          ],
          'min-character-sets': 0,
        },
        policyRequirement: 'CHARACTER_SET',
        restructured: [
          {
            length: 1,
            message: 'Minimum Number Of Numbers',
            rule: 'numbers',
          },
          {
            length: 1,
            message: 'Minimum Number Of Uppercase',
            rule: 'uppercase',
          },
          {
            length: 1,
            message: 'Minimum Number Of Lowercase',
            rule: 'lowercase',
          },
          {
            length: 1,
            message: 'Minimum Number Of Symbols',
            rule: 'symbols',
          },
        ],
      },
    ]);
  });
});

describe('Test input type getter', () => {
  it('should test input type of "text"', () => {
    const inputType = getInputTypeFromPolicies({
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
        policies: [],
        conditionalPolicies: null,
      },
    });
    const expected = 'text';

    expect(inputType).toBe(expected);
  });

  it('should test input type of "email"', () => {
    const inputType = getInputTypeFromPolicies({
      name: 'policies',
      value: {
        policyRequirements: ['REQUIRED', 'VALID_TYPE', 'VALID_EMAIL_ADDRESS_FORMAT'],
        fallbackPolicies: null,
        name: 'userName',
        policies: [],
        conditionalPolicies: null,
      },
    });
    const expected = 'email';

    expect(inputType).toBe(expected);
  });
});

describe('Password validation failure message getter', () => {
  it('should return no error message when no failed policies are present', () => {
    const step = new FRStep({
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
    });
    const errorMessage = getPasswordValidationFailureText(
      step.getCallbackOfType(CallbackType.ValidatedCreatePasswordCallback),
      'password',
    );
    const expected = 'Ensure Password Is More Than Ensure Password Has One ';

    expect(errorMessage).toBe(expected);
  });
});

describe('Username Validation Failure message getter', () => {
  it('should return NO error message when NO failed policies are present', () => {
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
          ],
          _id: 9,
        },
      ],
    });
    const errorMessage = getPasswordValidationFailureText(
      step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
      'password',
    );
    const expected = '';

    expect(errorMessage).toBe(expected);
  });

  it('should return an error message when failed policies are present', () => {
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
                  {
                    policyRequirements: ['REQUIRED'],
                    policyId: 'required',
                  },
                  {
                    policyRequirements: ['REQUIRED'],
                    policyId: 'not-empty',
                  },
                  {
                    policyRequirements: ['MIN_LENGTH'],
                    policyId: 'minimum-length',
                    params: {
                      minLength: 1,
                    },
                  },
                  {
                    policyRequirements: ['VALID_TYPE'],
                    policyId: 'valid-type',
                    params: {
                      types: ['string'],
                    },
                  },
                  {
                    policyId: 'valid-username',
                    policyRequirements: ['VALID_USERNAME'],
                  },
                  {
                    policyId: 'cannot-contain-characters',
                    params: {
                      forbiddenChars: ['/'],
                    },
                    policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
                  },
                  {
                    policyId: 'minimum-length',
                    params: {
                      minLength: 1,
                    },
                    policyRequirements: ['MIN_LENGTH'],
                  },
                  {
                    policyId: 'maximum-length',
                    params: {
                      maxLength: 255,
                    },
                    policyRequirements: ['MAX_LENGTH'],
                  },
                ],
                conditionalPolicies: null,
              },
            },
            {
              name: 'failedPolicies',
              value: ['{ "policyRequirement": "VALID_USERNAME" }'],
            },
            {
              name: 'validateOnly',
              value: false,
            },
            {
              name: 'prompt',
              value: 'Username',
            },
          ],
          input: [
            {
              name: 'IDToken1',
              value: 'existing-username',
            },
            {
              name: 'IDToken1validateOnly',
              value: false,
            },
          ],
          _id: 9,
        },
      ],
    });
    const errorMessage = getPasswordValidationFailureText(
      step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
      'password',
    );
    const expected = 'Please Check Value ';

    expect(errorMessage).toBe(expected);
  });
});

describe('Test if input is required', () => {
  it('should return false if output prop is not required', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
      callbacks: [
        {
          type: CallbackType.BooleanAttributeInputCallback,
          output: [
            { name: 'name', value: 'acceptance' },
            { name: 'prompt', value: 'Please accept this' },
            { name: 'required', value: false },
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
      ],
    });
    const result = isInputRequired(
      step.getCallbackOfType(CallbackType.BooleanAttributeInputCallback),
    );
    const expected = false;

    expect(result).toStrictEqual(expected);
  });

  it('should return true if output prop is required', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
      callbacks: [
        {
          type: CallbackType.BooleanAttributeInputCallback,
          output: [
            { name: 'name', value: 'acceptance' },
            { name: 'prompt', value: 'Please accept this' },
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
      ],
    });
    const result = isInputRequired(
      step.getCallbackOfType(CallbackType.BooleanAttributeInputCallback),
    );
    const expected = true;

    expect(result).toStrictEqual(expected);
  });

  it('should return false if policy requirement has no required', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
      callbacks: [
        {
          type: CallbackType.ValidatedCreateUsernameCallback,
          output: [
            {
              name: 'policies',
              value: {
                policyRequirements: [
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
    const result = isInputRequired(
      step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
    );
    const expected = false;

    expect(result).toStrictEqual(expected);
  });

  it('should return true if policy requirement has required', () => {
    const step = new FRStep({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
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
    const result = isInputRequired(
      step.getCallbackOfType(CallbackType.ValidatedCreateUsernameCallback),
    );
    const expected = true;

    expect(result).toStrictEqual(expected);
  });
});

describe('Test failed policies parser', () => {
  it('should convert serialized failed policy to PolicyRequirement obj', () => {
    const serializedPolicies = ['{ "policyRequirement": "VALID_EMAIL_ADDRESS_FORMAT" }'];
    const result = parseFailedPolicies(serializedPolicies, 'email');
    const expected = [{ policyRequirement: 'VALID_EMAIL_ADDRESS_FORMAT' }];

    expect(result).toStrictEqual(expected);
  });

  it('should NOT convert a parsed policy', () => {
    const serializedPolicies = [{ policyRequirement: 'VALID_EMAIL_ADDRESS_FORMAT' }];
    const result = parseFailedPolicies(serializedPolicies, 'email');
    const expected = [{ policyRequirement: 'VALID_EMAIL_ADDRESS_FORMAT' }];

    expect(result).toStrictEqual(expected);
  });
});

describe('Test validation failure message generator', () => {
  it('should convert failed username policy into user friendly message array', () => {
    const messages = getValidationFailureParams({ policyRequirement: 'VALID_USERNAME' });
    expect(messages).toStrictEqual([
      {
        length: null,
        message: 'Choose Different Username',
        rule: 'validUsername',
      },
    ]);
  });
  it('should convert failed length policy into user friendly message array', () => {
    const messages = getValidationFailureParams({
      policyRequirement: 'LENGTH_BASED',
      params: { 'max-password-length': 0, 'min-password-length': 8 },
    });
    expect(messages).toStrictEqual([
      {
        length: 8,
        message: 'Does Not Meet Minimum Character Length',
        rule: 'minimumLength',
      },
    ]);
  });
  it('should convert failed character set policy into user friendly message array', () => {
    const messages = getValidationFailureParams({
      policyRequirement: 'CHARACTER_SET',
      params: {
        'allow-unclassified-characters': true,
        'character-set-ranges': [],
        'character-sets': [
          '1:0123456789',
          '1:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          '1:abcdefghijklmnopqrstuvwxyz',
          '1:~!@#$%^&*()-_=+[]{}|;:,.<>/?',
        ],
        'min-character-sets': 0,
      },
    });
    expect(messages).toStrictEqual([
      {
        length: 1,
        message: 'Minimum Number Of Numbers',
        rule: 'numbers',
      },
      {
        length: 1,
        message: 'Minimum Number Of Uppercase',
        rule: 'uppercase',
      },
      {
        length: 1,
        message: 'Minimum Number Of Lowercase',
        rule: 'lowercase',
      },
      {
        length: 1,
        message: 'Minimum Number Of Symbols',
        rule: 'symbols',
      },
    ]);
  });
});
