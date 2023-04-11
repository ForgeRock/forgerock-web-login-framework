import { CallbackType } from '@forgerock/javascript-sdk';

export default {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6IjU3a3NhbGdwN2Rsa29vbTJsdGFqbmIybTA3IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNWZjblZoU0doRlpHRk9jVzVrU0ZOSFV5MVhNbXhuTG5sUVRrTnFjSGMwU25aalptSnRZVEEwUTA1WVFqbDRaRGRsVTJ4VmVHRTBNazFXUzJWdExUaDFZamd5TWxwVFRscEliV2RVY1VseWFXY3RSa1I0Wm5oTk0wUnliRVk0YWw5Mll5MW1kSGxtUkRNeE1VTmxiV2xLU2pCT1dXSmlWM293VFVsUVpFSkRVVkZhTkVkSWQyVktOR2RCVm1OSmVYUkJWbEpZTFc0ell5MXBWMDlzY0VjeU5IRkhRa1pVVVZkRFgyeDFNRTlGT1haaGFFTlpVazAyT0ZscFFWTlllVzVZV2t0T09HcEtkbWxJUXpsaE1VaGtTSE10VW5wT01tTjRZbTFoY0Vsck1YazROWEp3YURoRlkwY3dRMnRGY1RCUk9VTXplVkkwVW1SSVJpMVlOeTFEZEhka1NUZEVRbGhZWkVoMFVWbGhaa1pTVVd4T1VHUk9iRTlIYVVWQlozbHBjMjFxVlY4MVUwOXphMUJHZUhaUGRtWkJWVzFJU0VwcFYyRlNTVTAxYTFVemVHc3hUbTlxVFRocE9HTTRNMmhST0VWWFRHaFZZVU5HU1dOaVoyWnhRV3hPY1RoWllUQkdSRkphYkRGVFpXNWFUbFZ5T0cxdlFuSkZVbUUyV1dsWWVGWnJORWt4WDA5eFpXMVRXakJETmtWMWJtUmhTRjlNVVZKZmMyNXNWV1ZHU2s1dE9VeG1aa05OVkc5VE9FRjJNakJ6WDBsc1NrUk1TVlZwYVVsQ1lWSm1UbmM0VGxaRlpUZGZRa2xEWVdaVWJ6QjNiWEZMZW1GSGIyNDVZVmd3U2taeFREUk5iWFJ5UVhkVU1HVnBSbkV6VVZoQmNWTXRZMVIxVWpKWFprSjBPVGgzWTFabmNGbGpVV1p2TWtSbk4zVldUMHg0Y1c0MVNtNUhlRkYxUzA1dFdXcFpWbU5NYUVoVmFIVjVXR2N5TmtGQlNrbFpjM05vZFVsWVZXeFlZMWx4VlhWdE5tMWpRM0JDT1VaRU1YQm5Sa2hSZEZST2FUWmlVamhwUVZsTGRrWk9Na3MzTjJoSU9XNVJVaTFoZUZwek5tcFhhbXcyUW5KemNVSjBTbFJYUVhkemRsaFZVWEZWU1cxWGNXNWZSM1E1Ym5wUWMwOVdSMHhuTFZkTlYyRk1OV1Z0UWxSWFpYSXlOV05PYlRKeVMzRnZUMVZ1TkRKbmJuSkhaVXB1WHpkUVdqUTJkV1pUWXpkR1oySnBRVUo2ZGt4eE4xZE9lUzFGUWt4UlJrUmFWakZsV0RkTE0xUTFiRzVNT1dFeU5EUkNkVVUwYlUxdVltWnViR3hmVW5sNVJHaHdla2hPY0daWWIxVnlZbk0zUzFVMFREWnRRa2gwWWw5aFRrcFFUemRxV0UxeFgxWTNWamhqUlZscGRtbEVOelJDUjJSNGQxZE1SRkV4UXpkd1NXZDJWWFpXV0U1dFRWUTRSVmhaUkRkZmRteERRMGxUVlhCUmVUSlBaR1JJVGxaVlVXTkNiR1JyUmxSdU9WVjBkekkzTVRoalQzSlBVM04xTmpaaVYzUnFibTEyTlV3dFoyWm5PRzVFUkc1MFMwbGpRWEk1U3pGM2JXdzVXbmxDWjJOMU5YRlViVXh5YUZSemR6QnhTSGt6WWxCRFkxZFZRMUpZZWxjMmVtOXBYMFJhY1VwNWNGWmtaak0zVGpOcFdWbHJXVFJCWlY5eWIzTm9XVjh5UlRWSWVWTkJYMjVZU0dSVmNYWmxjaTAzTW5CUlEzaFhNRUpWUlY5SlNGY3dWbmxzZVdWM2RtbFFUblpwTVd4emIyd3hUa05wWVRKVGFVazNiM3ByY0hSUFZGZE5ORWN0VUZGNlJtNUlYMFpTZEVwT09UUXdaRkZsTkhKRFgxcFNORGgwUVZoMlVYQkdNekpEVVMxRmMxQllOSGt5WlVGQlprUnFYMXBOV1d4YVZtSlBiMmN3Y3pOb2RVRmFVR0phU1ZORVVXZ3dhSGMwWDBRek5qVjRUMjB0WjFCV2NERnZZMXBYWmtsTFprODNPR0Z1YTAxU2NsUXRYMVJQZUZOeE0xSnJMVk5pVFhsS1IyY3VTSEJNUWs5MU1teExUV2QyVmpWMVgwMXVkV2xsZHcudTA3WDhjczZPVFhiRlZKcjFhTWw5OUF0UXhPT1lvaUFsa0VfZWk4eVRQQSIsImV4cCI6MTY1MzkzODY1OCwiaWF0IjoxNjUzOTM4MzU4fQ.5dG4NJ1xC6gysjz2Scx8DWeuUcG2hFTypMJea7zy93k',
  callbacks: [
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        {
          name: 'prompt',
          value: '',
        },
        {
          name: 'messageType',
          value: 0,
        },
        {
          name: 'options',
          value: ['Yes', 'No'],
        },
        {
          name: 'optionType',
          value: -1,
        },
        {
          name: 'defaultOption',
          value: 1,
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: 0,
        },
      ],
    },
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        {
          name: 'prompt',
          value: '',
        },
        {
          name: 'messageType',
          value: 0,
        },
        {
          name: 'options',
          value: ['Cancel out of flow.'],
        },
        {
          name: 'optionType',
          value: -1,
        },
        {
          name: 'defaultOption',
          value: 0,
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: 100,
        },
      ],
    },
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        {
          name: 'prompt',
          value: '',
        },
        {
          name: 'messageType',
          value: 0,
        },
        {
          name: 'options',
          value: ['I confirm', 'No, I do not confirm'],
        },
        {
          name: 'optionType',
          value: -1,
        },
        {
          name: 'defaultOption',
          value: 1,
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: 0,
        },
      ],
    },
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        {
          name: 'prompt',
          value: '',
        },
        {
          name: 'messageType',
          value: 0,
        },
        {
          name: 'options',
          value: ['Yup', 'Nope'],
        },
        {
          name: 'optionType',
          value: -1,
        },
        {
          name: 'defaultOption',
          value: 1,
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: 0,
        },
      ],
    },
  ],
};

export const docsExample = {
  type: 'ConfirmationCallback',
  output: [
    {
      name: 'prompt',
      value: '',
    },
    {
      name: 'messageType',
      value: 0,
    },
    {
      name: 'options',
      value: ['Submit', 'Start Over', 'Cancel'],
    },
    {
      name: 'optionType',
      value: -1,
    },
    {
      name: 'defaultOption',
      value: 1,
    },
  ],
  input: [
    {
      name: 'IDToken1',
      value: 0,
    },
  ],
};
