import { type Step, CallbackType } from '@forgerock/javascript-sdk';

export const confirmPasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRFU1RfQ29uZmlybVBhc3N3b3JkIiwib3RrIjoiaThocm1iN2dqOTRkNHRna2Y3Z21wZWN0MTYiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1SmRGTjRjSGsyUlVONlgwWnZUWFZzUTFvdGVHZDNMbTlwTFY4emJsbFhhbUk0VDBSeGJuWlFjRWRhYW10T1RYWm5NamMyYVMxeVZsVkxkSEZPTkV4ME1uRkpkMWxJUlVsUmJHZHFkMVpoTmxCMVVuQklNWEoyYUV0YVZGVnpWbTAzV0daVk9YRkJRazFVY0UxQlNHeHVPSHBmWkhOQ01GWnlNVm8zYUdVelYwdEhNRTEwY210clZYWklVelZoVkRVeGJUQTNhRWN6Y0cxMVlXMXZkVGMwUmxGUFUwMDNaazlvV0ZCR1JtdHJhM2R0TFZZMFZsRnJXVmQwTVc5M1JHcFVOMnBaTlZGVFh6QlhiMlp4YmtRdE1UZHpRV2hTVjBaUkxVMUpNVFJoU25STlIxWlBNMHhCVlc5TlpXbFBZM0puYUVWMU5sSkRPRU5GWjFrdGVVbHNjRVpxV0ZSUlIwYzBPRmxvVERVM1RuTlJWR1ZZVlVGbk5GUkpZemxEUTB3eWRUbHdTWEpPUTBnMFNuVXhaa2hqU0ZsU2R6RnVUbkJwVGpJM00ySkJXSE4wU0hKb1FrdzFVbmhyVTBFNFRIbG1RbEpWWVZCV1NVeExRa1UwZDFWdWVuaE9jVTVGVkUxdlpUUnNNR0Z1ZVhGaFpHVTVTMkpaWmxobmNtOVVaMEpLWmtOV2RHWlBSWHBZV0VGT1prOWZXVm8zTlVkek5rcElVM2hsZEVoSU1tNTRhRVJEY0dKblp6SkVlbTUyT0ZGVWVsOTBNM0ZsZW1OTE9YRkZZVTVVYmxadVFqYzBkbGR6ZWxRMFYwbG5iM2hTUnpSTVNFMURNRzVKYUZCSU5IWmFlSGQyY0ZGWFpsaFRVbGRDY0VGUk5sUjZhalZYT0Y5cmVYTlNaRUo0U0hBMVRuVkRVa05CWmtSeFRVTjRWMVJ4VDJWMmVrTlViak5TTm1sVlkxZG1OV2RTTjBzNU1UbFRUMVZPVUV0eFVISk9jWFEwYVZWNGNWSllMVmRDYkRkM09GZHlNVmh3Ym5kdVYwZGtTRmRSYjBkTmFuZDNMV2d4YTFCQllVeG5UMFZaU2pOTmRVaGhWbVppYTJ4U1RteHhZekk0T0ZWRFgyODJSWEl5T1U1YWExVXdaMmx4YW5wT2JHaE1hbWc0WkZkaVFUbDZaRWhPVmxWUlZ6VkRSVjlwTUd4NFFrVk9VbUl6TWpKdVlsa3hVakowWVcxWFpYSkNZbmhHYUVWV2NFMWpMalZqVWkxMWJFNXlNbEpWWDFWSFVHVkpWazFxVFZFLmhnbll0cTRzWVJWWjZzU3c4cEhfT3FLWFkxT25GN0xUaE9DUnhrLWtUVFEiLCJleHAiOjE2NzQxNzI0ODgsImlhdCI6MTY3NDE3MjE4OH0.2M4EMYwOxms_0UrtqhoE5-DCE4Mfkcuk7ShpuamnYzs',
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
        { name: 'IDToken2', value: '' },
        { name: 'IDToken2validateOnly', value: false },
      ],
      _id: 1,
    },
  ],
  stage:
    '{"ValidatedCreatePasswordCallback":[{"id":"db09cd18-65a7-424a-9c9e-84c528c3e560","confirmPassword":true}]}',
  header: 'Quick Register',
};

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

export const oneTimePasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRFTU9fU29jaWFsTG9naW5XaXRoT1RQIiwib3RrIjoiNXRzbnMxa2duOWgxOWVoOGZtbThrNGszMnEiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1NGNUWlFlWEJvU2t4TFlVSnZhbEEzTURrM1JVSlJMa00yYW1nNFZrWlNZVkozZUVKSVpURlNWQzFXYVhoMmQydENVMlZRWVUwM1RrUmplRFJIWVY5eU5ESTJhRzVDYVVObGNEQnlVekI2T0RBMlNFZDFlSEU0WDB0U09Fc3pabmx0YkV3d1FWZHlhMlpGVDBsRGNVaFFYMDFXWlU1elRsbDNObVZ5VkROcWJXRlBNUzF2YVdKQ01UVnlUV05GVVVaVVZVaGtkelpPYzBkaWRHazJOMDFrTVVzeGVrWlFMVUZwTkRCb2MyWlRZbUozVTJ4cE5GbE5TazFOWlZWNFpYaEpWbTFRUjJsT2MzY3RXbWRaV0hsMk5HWXRWVTh6YjE4NU9VUjVTRGxHWXpKd05FRXlWWGhRU2xjMVkzazNWazlFU25kdE9UVlZUMTlpTkVGSldIUk1NSFJoYUY5V1ZUbDBVVU5LY21OME9URkVkM2xtWjFneU1IVktOV2RJYzE4M1NDMTNhVVpoVEdvMVlqVkdUV2d3Y0dGTk1YTjJkVEpsWWtkRlVFRmphblp3YzBaRFVrMWxhMUpXYUVwRll6aGlWVUpUTkhwQ1pIWkpkVUZOWlU1cFowUTJSVTh6ZWpSRGNqWlFaWE5oZGs1TmJHczBRV1ZGTUUxeGEzTTBkVXhaVFhCaGJrUlNNVTFKU2t0UmVHVnRZMjgwTlVsa2FWcHRUMFkyWmpjMVVFZGZTRlYxV1RrdFYwTmpTUzFPWVhaVFkzTnhRa3hEWWsxWmFUaGtTRmRzY1dKeE4yeElibUpMVWtVdFRsb3RVR2xFYVVkT1YzbGxUblE1VFV4dE0yVm9ZV2N3ZUVaWk5reEZRMUZVUm1KTlkzSkJWbVozVGpFNFgwVm5ZMmsyWTFGcVozZE5VVkZEY1Zsa1JXUmxSblJqV21kV1dqTmtXVVJJV0ZGQlkzZFNha1oyV1RaeFRrVmxVa1JHV1d4NVZtSldUbWM0V0hwQ2FYbHVNVzlIYm5sTWJUSnZXVEZxY3pkRlVWUkxhM1ZXUjFOVmFHSm1VRVI1YzJZeVYyMWplVkZvYzNsNVlrRTVhRmRxYVY5V1YyaHdZbVJaVERkclNrZ3RXbEE0ZGxSNGJVaDZUSGxKTkdwb1owUkRRVU5IUW14c2JUTjVTMms1T1ZKMFpHVnlhbUp6V0ROaFNXSnJNRXhVWmpGS0xYWlBjSGQyYTFsaVZrWm1TakJuYlVWcmFFTjJZbmx2U1hSc2NFOVdibGhPUldKSWJGSXdTRkZCY1hka2RubFpUa1IzVFRSMVgyaGpWbmRsY0ZGb05tWllZVWt4WVVoWlRrWnFaVVoxVFhod1VXcElhMEZxUWxNNWVGaHlUSGxNU1hWUVpYTlpla3BIT0VNNGVqUjJSRmwzWW1VME5EWlFiV010TXpKSFYwNU5XbkpDT1U5dk1ERnJhREY1ZVVGcmNtTmpTamgzV0VFNGJrNUhOa3RHVEdob09GODJla3gxYlhCemJVTXhXamx1VjBWYWRGZ3piMWRmVEVkYU1raERORXBoYmw5TVMzQnZhMjlEVmxaRmJXNW1aUzFsUVVkaloybDFaVVUwZVhCaWIwNU1ORzFYZFU0eVJUaG5WMnRGWVdacE1FOVBialZTY1cweGJVcERTaTFpU25CMFNsWkNUblZ5WVVWWkxXcE5NRTUzWVcxMFNXZzJjMnhZY2s5SGNHSm9lWHA0Y0RnelgyNUJZbmR5UjJkdWFqTldTM2xKYTFCTVNVRmtiMU5UVkdOd1pGVmZUbTF3VTFSdlltZG1iV1JpVkZoR1JtNWtabUp4ZWxKVlZtWlBhVEF5VVdJNVMzTm9ZMGhwVWpSRU9IWldOekF5U0ZvMk5GcG9SSGRzTTNoMVpqQllXVGcwZVRsSVpITlJlV04zY210WVZUVTJSekZpVDJoaWR6ZFFRMGMyUTNSaFFqSk9VelpWY0hkd1RXRmhURWhrVkRKdFIxWmxNVE5mVGw4M1dVdEpOWG8zZUcxdlVFVnRkMHhWVjJRNFl6SkdkVTkxVVU0M01HZEhPVmwzZFd4VVVUQXpWVE0yUlhSdVUxYzFYM1J2VkZBNFFVWmtaMUZHYjFORVdrZFRNRTQ0UmpkeVNqSm5RbFJXZDE4NVNFNDJlWFowVlVOYWExTjFUbWxFY2pOUFJITkNka05SUzJjNWMwSTBkazF6WmtweFVHZGtablJwVjJNMVpYQklhSFk1VGpWbU5YZEJSSGxyYkhnM1pHRXhjMmxYZWpsV1ZISXhaRll4U1dRelRsSlJVbGhZUlUwMlFrMTVhMWQxYVVScmFHVnRWWGwzZFdSU1UwZEhOMmt0TWxkVE5YQkVkRGRyTldGWGVFeG9VVzVOTUhkSFEwVnlaMmwxV25ReFkwUjVTRUZSVTJrM1gxOTNXSGRTY21kVFVHZFhiR3BwZG01cVRuSnZRVzF3ZFZWYU4zYzRjakJvU2pkSlpURllWVlE1YVhwS1VFNUdiV3RIYTFKalRFTm1RemRNVW1aRk9XUktVVFo0UzNOeWR5MXBSV2xHZVhVNFpqQkNZVVZmT0RkdWIzUjZOSFpaWTFoelgwUTRUMFZaVTA5RkxXbDRTR2d6WTNOMVIwaHVOVkUwWTNkd04yOHhSWE5FVUZGbVQzbzJPRjlwUkVac2IzWXljR0Z6VlhOTWRWZzNkVkp3TjNsSWQwSlVla1psUW1OaWNrMVVMWEZJWmpsWVZXWnZTelJ6TUdkd2JFNDJXSEZpU2xjelJGTmxVbTVGYURCcmNtSm1VbHBzY0d0a1ZXVnlaRU54TkVsU1ptaHpVbmh6YVRKTVVWOUJhM0Y1Y3poQlN6aEpielUxTldFdE9ETktiME5RZVRaV1UwZDVRMTk0Y1ZKVlluVjZUemh5T1hKTk5Xd3pVWFZ0TTFKMldXRkxaazVuU0ZSdVFrVTBNWGxxVUdSZmRrOTJSM0JWVlhsalpISTNjWEZGVDBWWFREbHNOMnRVY0hoaVdsOUNTWEJGUVVwNVRHbGlRVXhqVkhCR04zaFVZM1p3YkhwVFNHcHRPVmhETW5CQlprdHhkRXg2VHpGb2J6QlhZVnBEWVZWWFowZHRUMHBRTTAxYVFqVjVTWHAxZFZCYU9IRmhOekUyV0dScWQzUTVhR0pwU2t0Vk1uSlVkRkUyWDA1eWVXMDJRalZrVVc5TlREUkxXVmw1UmxweVVWODNUV0pSYUVabmFtZE9jekJFZERGaGQzUXpiMGRrWkZjNFIzRlhiMWxqUzJvMU1FRlpjSGs1T0hoTWFrUk1aMUpvUzFaTVVqbFhPVEpmTUdKQ00wRnRabWg1ZGxJMlVtZHFOeTFQYURkWUxUY3pSSGMzZDNwMmJEWndSR05VU0dKUFJVVmxUVFYxUlZCc1ZVMU5jbGhoU2t0TlRGOWhSelUzYWxkVlpqbGlkMjVXVFdGUVlsVk1jbFpPVjJoMVdVZHVTM2R0T0hGSFpUQnNNbU14YUV0RldHZGphSFJSYTAxdFIxRTFiMngwTFdwcllUSndURFIxWnpsd1JrbEhZMDR4YkdOdFRuRmZlVEpSWm5Sc2JuRXhSV0l4VFdoR1VEWTRPRE15WTA5UloxbHdXRGRLT1VwRFJVdEViMlp0TWtKalZYQklOVEZSYUhSeFVHNW9YMjVITkV0UGQxRjNhbTFaU0c1R1QwRkRSM1ZKZERRM1lUYzJSR0kzUlZsQmFrb3lkVEl0UW1aWExWSjZSazVxWlhsM2NFdzFWWEk1UmxWa05ISkpWMDk0TFhjeWJpMVJiM1p1V0hOWFNUSmpOR055YkRSYVptMUZNVjlaV2tGc2JWTlZOWGQzUW04NFRtbzJVR3hLVjAxWVJEbERaMlp0UlZkV056Y3lWMGxqTTBrMlVYTlhOMGN0V2tFeE5XeGtiakF4VTNNNVQzSjRZVnB2VUZGRExUQmZkR05JWW1ORFFrWklSbXBMT0ZwUU9GRnFPVEJ6Umxkd1ZraHhNbGd3TFMxS1NVRjNjazgwUVRSU2JEaG9iRlJFV1ZvNVJtVllXblZPTTE5V2FtVnFVRmxoVFZJd2NtSndOblpxTVU0eWJYbGthblJOWXpabmRteFlXRWgzV21kMmJFUlNaVFY2U0VsVVRWcFFRbEp2ZWt4TE9XZG5WRE5LTW1sblNqbHRjWFpoVGpGbldFRnZkRUp4TUZoclQySlphMk5DVm01elJrbEhORGhSYkdKNVZUVnFZa2RUUm5aSVRXOUVNMVZrVDJWV2NFOVBNRUV0ZGsxM2FrSjRlWFZETmxCc1dEZ3hjRXQ1WW5wT1FVMUZVbTFYWkhKUFozWjFia2t4UVRoalNtSTJUa1pwTVVFelZVRnJaV3BHVmxjNWMzZEJSSHBWWmxaNlkxWktZMUEzTUVsaFJVMWZkMngzYjFkRmNtcHJZM0F4YkZkcVJrRjBaRGs1UTIxTVRVNVhRemxEVjJFeFFYbFRlVWxVWWxJek5rNVJUSFJqYUV0aE5XeFlYMEZuVjJrMlEySlRYMUExTWtWTlQyWk9Za3N3YkVKRFZHWmhiV0pGWWxOQ2NUaDJXR3B0U21wdlJYZGxObVZSWlhSSFFYSlVkRXA1YVRoZmNUQnBlVVV3ZFMxUlRHWm9kSFJIU1ZKQ1JHSXdSVlV6VGpCbVNFMXBVVkUyVTNWVmEzRnNia3RYTTA5MlVVZDNiVFl3VERGcE1VUkRiVkpSTUd4Tk1YcEpTRW94U1VRd1ZTMXpTMHN6UnpKR01rMDNhWFZMYm1Wb1dHaEhUMGMxY21sd2JtczRiR0ZuV0hrM1ZVTXdaMmR0VFhZd2NEaG5NRU5rVG5BMlpFTnhXSGwyYkd4VVpreE5aR05VT0Mxb05rdDNObEl4TmtseWRIVjJWMUl0UVdWME1DMXBibUZKUkdScVFtcFFRMTltY2twMmJrbHhZbWhEYlc5NlFrTmlXVmh4UXpKbE5VTklRV2RTTUdkNmMyRmxkVE5VWmtSRFEycHhkVUpQTldoRU5sOUlWVjl1V0VGcWVURnNORlpvVUhwb1JUVTJRbFp5Y21Jd2MycGxkVGh2TWxrM01FaFRVa2xFZDBwVk5WQjBhbEpCVkZocFNscDJOekpRVVdWcVEzaFJNRUkwUWxaZmQzaEZUakF0UlRCbGFVeE1TVGxyZUZndFVVSnpTbFkzTjFsRU9FaDNVMGRUZEdSd1gxUmFVMFJLUVdKelpHbHpZV2hqVVU5VFYzQlZYMFZrWTFOckxWUkJXbFJGVEUxUmIzQTVPVzlMVGxaUk1VNVNWV1pMWDB0ZmQwcElRV1J5U2xOWU1HRjZNVEpzVW5kYU4xUTNNWFZ1T0Zsc2VWWk1VbEJKY1UxTWVsVlBYMmxhYW5WVVRqSXdlRWxuTVdGbVlYZFBSVXhIVkZoSmVsRldTVUo0ZEhKYVpHSkJRbXR5WVdWQlJEUm5SbFUxY0Y5UGJVWllRVE5WT1hsRE5sQTFhbEl6WWpKV05WQTNhMVE0ZDJOemJGSnliRTFNTkhGcVVsUllNV0pMTVhsTVp6VndZMWcxTmtoVWNuaEpNM2hSUWxBMVMxSkVRbEJSYXpSTFJVeDFPVk5hY1VGeFFXVldXV2czUzBGc1UyRkpXQzF5TkdWYWJXdzVMVmh0ZFdOeGQyaHFaa2RSYm1Wa1dFWjBha2xLTkVkV1RGaDFUM3AxVG5aU1N6aEdiQzFaY25scmJuWlZhWFpCU21wSlNEaHdiSFZVZGxod2RFSkNiV2hVZVVGSWQwaG5NSHB6ZDFsdlZqbExMV3BVU0VSR1dFZHdZV1F0VUZkS2MwOU9UVEpaU3pnNWJuWTBiMWxxU0ZOUVNGbHVXSFJNVEZRMFRXSlpia3BaVFd0YU1GQk9Na0ZTTUZsd2FVbHNhM05DYTB4V0xVRnRTMjQyZGtveVVuUjJObTF3TnpsUmRFeDZSVGs0UjFWZmQyRktlbEYxTkRNMGRrcGlRa2hFTlVRdE1tOWtXbE53Y0hwWWVGUTRlRVk1ZFRWSWEwOU5lblZyY2xCM2VFWk1RMU4wTFV3d2VtMXpXVUZrYUhkWlZrUktaVGhCVG10TlRGbHFORTFGUmxaMGJsbFRiVGRWUlcweVpsUmpRa3RxWmtaaUxXVlFRMnQyU0ZCRU5uVnpkVGRYZFdWb1oxVlZUVVJHVGpWYVlYTjBWRTVaZEc4eGNERnVNM1p1UWs0ek1EbHVXbVYwU1djNFIwaFRablZJV1Y4M2VIWXdhV1V0WDJoUGJYVllRVWRFUkUwMVQxcElaRGg0WjBka1owaG5hbFpwV0V3NWNUWjVjakpITm5wRFlVWk9lVUUwWkZSdFFtTkNlV3QyVUU0dFpsbGZlWEpKVGpoVGNVZHJRM1ZYZW1odlQwdFJYM0pxVmpoTldYRlBiMFJrZFdwcGNGSk9WbWxUZDFObWIwcFBRMFJNU0ZNM1VXbG1VV2hTTlhsYVgxOXZjbEJpTkdSNWFEQXRPVGM1TFhCdFJVdFVSa3gyUkZwbGRIUlhjVkZ6YkdSNFUxVllaVE5MYUhsME1HSmFURTVzVkY4d1dtRnVWMkp3TlhONFNUWmhiM3BwTlhWb1VqQTJVM2M0YmxFMmIwSlBXamg2YUhOaGNFSkpOMTlGYm1SV1VHaGlPV2hvV1dsWGFGUnBNRmg1TkVsNFdVYzBjbVZWTUc5V2NuTnNOMTlrWkRkMVNtTmpMWGt5WkVOU2FYcEhWbkJDT1ZwR1ZuUlpXV0pYZGtkbVFtTmlaVE5MTTNRM1IwcERiRkZrZGtwcmJGQlFTakZSTjJaeVRUZ3pSalExTlZGZk9XSkxja05IVWpWbUxVOXhORWszWm1OV2NITndhSGxsZEhKeFkwOWZNMnBLZEVKb00xSndialV0VFhwRE5pMW1la1kyWldsU1JFSnFNMmhDY0dOS1QyUjRWRTV5TjNGbWR6TjJXWFpoVTBWTmNGRXpaRTg1U1U1WWRFa3hPRGxDUm5sa2VubGlVbmhTTmpWU05FbDVVMGhpYlU5MmNVRjJVVGhtZFVRdGMwSjVXSFpyVmpkM1RURTVkVzFxY3pWR1ZUUXRjRGxSTFRaVGIyaFlWRFZ3WWxWYVNVMVRaWGxpTFZSV2RHVjFYek5ZZVRNeVR6aDVialZET0ZFM05URklkV2xUVFVsSWNXTkJhV2xCT1hWSVUxOXpUVEZKVjFkVk5rWk9PRWQzUVU1YU5uTTNjMXA1UXpkYU5qWkVlREJ3TW5ZeGRHMVFVRzFLT1ZoMFREVkpOR1IyYjAwMU4xcERZMk42Tm0xR2VYSlFUa0pmUlVSbFVsOVJiWEpFVW1oSFlXUjFUSHBtTVZOaVozcERVVXBXU0V4aVNtODFZVnBmV0VKRVkwTXpZMHMwY3paMFREWlJiRkJJVm5kelVrcEthVm8xVVdGMkxTMWpPVmd4ZDJOS05scFdhek5ZZEdveFRVNTZZM2xHU3pFNFpYRm1kVkU1TVV4MWFXb3piamd6WldkV1VVZFphMDlwTm5KME5sVXdibk0xTmxsU05TMXVaemwwWjBKYVpWQjNTRGxXWDBKVldsTkZaMnBYUzJsdFdWUm5kRGRrWkZScFdTMUlNbEpUTjBScGVGaHhYMlZRVkhCSE9VaG1TbkJsYmtadldVdGFZekozWm5GaVFVTjVRamsyTjJ4VE5sUmtZWGxuY1MwMFZVdEtWSEJsZW10NlVIZFhXbWhmTkUxT2FVOW1VWEZaV2xwdFFtMXpVVmR4UlhGVFdrVjRWVlo0V1RoV2FtVmZRMFZyUWtWbFpqWnFNWE5yY0c5S2NHVm5ibWs0UTNCeFEycFRUMVYzWjJablFtOXpkSFJGUXpsTU5VRXdMV3BJVm1wUWVrczNhell4V1c1eGMzTmxUM2N1VFRReFgzcG5lR2hhTmtWV1UxcDRRMTlQYTBKVFp3LlpjSEpEUnBMczNFNEVKb1c4WGY2TXY4RkhKdkZibDVGbmE2LXdmd2NiSjAiLCJleHAiOjE2NzcxNjU3NzcsImlhdCI6MTY3NzE2NTQ3N30.YPVZCdJbqwLp-HcVllCVXSd-j7EdVQ5XZ2ehMlTxjxA',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'Enter verification code' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 3,
    },
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        { name: 'prompt', value: '' },
        { name: 'messageType', value: 0 },
        { name: 'options', value: ['Submit'] },
        { name: 'optionType', value: -1 },
        { name: 'defaultOption', value: 0 },
      ],
      input: [{ name: 'IDToken2', value: 0 }],
      _id: 4,
    },
  ],
  stage: 'OneTimePassword',
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
      type: CallbackType.ChoiceCallback,
      output: [
        {
          name: 'prompt',
          value: 'Choose one',
        },
        {
          name: 'choices',
          value: ['Choice A', 'Choice B', 'Choice C'],
        },
        {
          name: 'defaultChoice',
          value: 2,
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: 0,
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
