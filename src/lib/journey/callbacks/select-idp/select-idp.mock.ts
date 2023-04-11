export const multipleProvidersLocalAuthFormStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6InJ0aGVsaTUyc3FlNDc0ZmhvNHBnNmE4ZXRrIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNHplSGRJVGxSTmRtVlZUMlpMYVdkYVNERlRRVEozTGxBd2NqZGFhMWR6VWxoZk1HOTVTVkF0YURCWFEwZHRXbGR2TVU1bVgyWnNhVkJ3WXpGbldrd3RabTlJTVdkSk5WRm1UelZXVlZwcU9VWlRNblJXTnkxdmNuQTRhMmRPZW1SS01GbFZVVzFsUWw5M2JIb3laRTVFVDFrdE16Sk1SRmgwZGpNNFJuWmliMDB3UXpBMlZGTkxTVEJsUlVWMU5uVTRkVUZ5UkVFM1JsOU1MV2cyTUdwMU1tMVBhVVl3Wm1ndFJtaGhWV1p5YldzM1RVUmliMjB0WlVsSGIzcExObE5JUWxKWU5rNUpla0ZZUjJGc09VWnBiVUk0ZDNBMFdXZEpWRWR2VGpkM09FSmhhbmx1VlRZME1UTlZOSGd3WldwaVNFOVRRa1ZVWlU0MVdXNVVURU5DUm5GMVUxWk9VVVZIU2xRNVVtMVdTbXBtWDAwMU9ERTBjbWwxWWs5emEyVjJTMUJVWnpoVWFsSjVNelpTY2sxSmFXWkJSelowZUZSUmEzTkNaSEY2YXpoYVlVbHJWRWQ0ZFVwcGJ6UllUelV4VVVoUVRVeDZSamxEYVVORWFtRTNZemh2TTBacFJVVm1iMmcxYWpOb09UUklPWEZDVDJwS1NYTXhhVTFxZWxoVFMzcDZaMHhEWlRONWNXMXljSFZ1ZUMxNllWTXRja3hzZDNKUU9UWlFPVkJpVjJsWVZHNDFRbVprUTNCSlVUSnBWalkxZUhCUmVrUlRNa1paYUhSdlpIVkhTelJyTmtGcU1GOVNRV1JTT0dad1RXNDBWMUpyTkVweVluaFdZMkZPWmpCR2NFSjZTVzFwT1ZnMFF6ZGZiR1ZJVGxSbFFVcHdRVGhrTXpWQ1QwMUpOMTlhVUhkdlYxVm9WelY2YzBJM1NVdFhWR3MzTVVGRlZVSlJaRVppTUVabk1tUnpaRzVVZFZKWFFVWlNaR2RMWTJ0VlFWSnRTbGxCZWtnelRVaDZjMU51WVRZMWJETlBkVGx0VDJkNGRqSkxiV3RHTjI5WGRWRTJkMmQ0VEdwU2JGVlNSMUZMY25aeFdIWkpVVTQxTUZKT1JYTXhhMHM1UVhOc1RWOVBTR013YUhsSFlXTktjbGRRVm5NdFdVeFVVMU5qTWpVMWRYZGlXR3hyVm5BM1ExQlRjRWR4VW1kNFdrcDJVMnR4ZFdJMWNHbExaWEJ4UmpWV1ltUm9XSEpLUldJd1dqWjRYM2hKWVZacGVGUXdZMDlhZWxwUExtcDRPVFk1WWtsaVMweERkVnAyYlc4MGVsQk1XRUUuYlZOV3ZKXzZ2Nm44ZUt2b2poX1g1RDlNSE54dUE5QTh5M2ppOFJRV1pZQSIsImV4cCI6MTY3MDYwOTg3MiwiaWF0IjoxNjcwNjA5NTcyfQ.E4oNfA-vVz-y02v17nbAhFj3p5qHb2stU_z8WTeCZug',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'facebook-web',
              uiConfig: {
                buttonCustomStyle: 'background-color: #3b5998;border-color: #3b5998; color: white;',
                buttonImage: '',
                buttonClass: 'fa-facebook-official',
                buttonCustomStyleHover:
                  'background-color: #334b7d;border-color: #334b7d; color: white;',
                buttonDisplayName: 'Facebook',
                iconClass: 'fa-facebook',
                iconFontColor: 'white',
                iconBackground: '#3b5998',
              },
            },
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
            {
              provider: 'google-web',
              uiConfig: {
                buttonImage: 'images/g-logo.png',
                buttonCustomStyle: 'background-color: #fff; color: #757575; border-color: #ddd;',
                buttonClass: '',
                buttonCustomStyleHover:
                  'color: #6d6d6d; background-color: #eee; border-color: #ccc;',
                buttonDisplayName: 'Google',
                iconFontColor: 'white',
                iconClass: 'fa-google',
                iconBackground: '#4184f3',
              },
            },
            { provider: 'localAuthentication' },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
    {
      type: 'PasswordCallback',
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken3', value: '' }],
      _id: 2,
    },
  ],
};

export const multipleProvidersLocalAuthNoFormStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6InJ0aGVsaTUyc3FlNDc0ZmhvNHBnNmE4ZXRrIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNHplSGRJVGxSTmRtVlZUMlpMYVdkYVNERlRRVEozTGxBd2NqZGFhMWR6VWxoZk1HOTVTVkF0YURCWFEwZHRXbGR2TVU1bVgyWnNhVkJ3WXpGbldrd3RabTlJTVdkSk5WRm1UelZXVlZwcU9VWlRNblJXTnkxdmNuQTRhMmRPZW1SS01GbFZVVzFsUWw5M2JIb3laRTVFVDFrdE16Sk1SRmgwZGpNNFJuWmliMDB3UXpBMlZGTkxTVEJsUlVWMU5uVTRkVUZ5UkVFM1JsOU1MV2cyTUdwMU1tMVBhVVl3Wm1ndFJtaGhWV1p5YldzM1RVUmliMjB0WlVsSGIzcExObE5JUWxKWU5rNUpla0ZZUjJGc09VWnBiVUk0ZDNBMFdXZEpWRWR2VGpkM09FSmhhbmx1VlRZME1UTlZOSGd3WldwaVNFOVRRa1ZVWlU0MVdXNVVURU5DUm5GMVUxWk9VVVZIU2xRNVVtMVdTbXBtWDAwMU9ERTBjbWwxWWs5emEyVjJTMUJVWnpoVWFsSjVNelpTY2sxSmFXWkJSelowZUZSUmEzTkNaSEY2YXpoYVlVbHJWRWQ0ZFVwcGJ6UllUelV4VVVoUVRVeDZSamxEYVVORWFtRTNZemh2TTBacFJVVm1iMmcxYWpOb09UUklPWEZDVDJwS1NYTXhhVTFxZWxoVFMzcDZaMHhEWlRONWNXMXljSFZ1ZUMxNllWTXRja3hzZDNKUU9UWlFPVkJpVjJsWVZHNDFRbVprUTNCSlVUSnBWalkxZUhCUmVrUlRNa1paYUhSdlpIVkhTelJyTmtGcU1GOVNRV1JTT0dad1RXNDBWMUpyTkVweVluaFdZMkZPWmpCR2NFSjZTVzFwT1ZnMFF6ZGZiR1ZJVGxSbFFVcHdRVGhrTXpWQ1QwMUpOMTlhVUhkdlYxVm9WelY2YzBJM1NVdFhWR3MzTVVGRlZVSlJaRVppTUVabk1tUnpaRzVVZFZKWFFVWlNaR2RMWTJ0VlFWSnRTbGxCZWtnelRVaDZjMU51WVRZMWJETlBkVGx0VDJkNGRqSkxiV3RHTjI5WGRWRTJkMmQ0VEdwU2JGVlNSMUZMY25aeFdIWkpVVTQxTUZKT1JYTXhhMHM1UVhOc1RWOVBTR013YUhsSFlXTktjbGRRVm5NdFdVeFVVMU5qTWpVMWRYZGlXR3hyVm5BM1ExQlRjRWR4VW1kNFdrcDJVMnR4ZFdJMWNHbExaWEJ4UmpWV1ltUm9XSEpLUldJd1dqWjRYM2hKWVZacGVGUXdZMDlhZWxwUExtcDRPVFk1WWtsaVMweERkVnAyYlc4MGVsQk1XRUUuYlZOV3ZKXzZ2Nm44ZUt2b2poX1g1RDlNSE54dUE5QTh5M2ppOFJRV1pZQSIsImV4cCI6MTY3MDYwOTg3MiwiaWF0IjoxNjcwNjA5NTcyfQ.E4oNfA-vVz-y02v17nbAhFj3p5qHb2stU_z8WTeCZug',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'facebook-web',
              uiConfig: {
                buttonCustomStyle: 'background-color: #3b5998;border-color: #3b5998; color: white;',
                buttonImage: '',
                buttonClass: 'fa-facebook-official',
                buttonCustomStyleHover:
                  'background-color: #334b7d;border-color: #334b7d; color: white;',
                buttonDisplayName: 'Facebook',
                iconClass: 'fa-facebook',
                iconFontColor: 'white',
                iconBackground: '#3b5998',
              },
            },
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
            {
              provider: 'google-web',
              uiConfig: {
                buttonImage: 'images/g-logo.png',
                buttonCustomStyle: 'background-color: #fff; color: #757575; border-color: #ddd;',
                buttonClass: '',
                buttonCustomStyleHover:
                  'color: #6d6d6d; background-color: #eee; border-color: #ccc;',
                buttonDisplayName: 'Google',
                iconFontColor: 'white',
                iconClass: 'fa-google',
                iconBackground: '#4184f3',
              },
            },
            { provider: 'localAuthentication' },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
};

export const multipleProvidersNoLocalAuthStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6InJ0aGVsaTUyc3FlNDc0ZmhvNHBnNmE4ZXRrIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNHplSGRJVGxSTmRtVlZUMlpMYVdkYVNERlRRVEozTGxBd2NqZGFhMWR6VWxoZk1HOTVTVkF0YURCWFEwZHRXbGR2TVU1bVgyWnNhVkJ3WXpGbldrd3RabTlJTVdkSk5WRm1UelZXVlZwcU9VWlRNblJXTnkxdmNuQTRhMmRPZW1SS01GbFZVVzFsUWw5M2JIb3laRTVFVDFrdE16Sk1SRmgwZGpNNFJuWmliMDB3UXpBMlZGTkxTVEJsUlVWMU5uVTRkVUZ5UkVFM1JsOU1MV2cyTUdwMU1tMVBhVVl3Wm1ndFJtaGhWV1p5YldzM1RVUmliMjB0WlVsSGIzcExObE5JUWxKWU5rNUpla0ZZUjJGc09VWnBiVUk0ZDNBMFdXZEpWRWR2VGpkM09FSmhhbmx1VlRZME1UTlZOSGd3WldwaVNFOVRRa1ZVWlU0MVdXNVVURU5DUm5GMVUxWk9VVVZIU2xRNVVtMVdTbXBtWDAwMU9ERTBjbWwxWWs5emEyVjJTMUJVWnpoVWFsSjVNelpTY2sxSmFXWkJSelowZUZSUmEzTkNaSEY2YXpoYVlVbHJWRWQ0ZFVwcGJ6UllUelV4VVVoUVRVeDZSamxEYVVORWFtRTNZemh2TTBacFJVVm1iMmcxYWpOb09UUklPWEZDVDJwS1NYTXhhVTFxZWxoVFMzcDZaMHhEWlRONWNXMXljSFZ1ZUMxNllWTXRja3hzZDNKUU9UWlFPVkJpVjJsWVZHNDFRbVprUTNCSlVUSnBWalkxZUhCUmVrUlRNa1paYUhSdlpIVkhTelJyTmtGcU1GOVNRV1JTT0dad1RXNDBWMUpyTkVweVluaFdZMkZPWmpCR2NFSjZTVzFwT1ZnMFF6ZGZiR1ZJVGxSbFFVcHdRVGhrTXpWQ1QwMUpOMTlhVUhkdlYxVm9WelY2YzBJM1NVdFhWR3MzTVVGRlZVSlJaRVppTUVabk1tUnpaRzVVZFZKWFFVWlNaR2RMWTJ0VlFWSnRTbGxCZWtnelRVaDZjMU51WVRZMWJETlBkVGx0VDJkNGRqSkxiV3RHTjI5WGRWRTJkMmQ0VEdwU2JGVlNSMUZMY25aeFdIWkpVVTQxTUZKT1JYTXhhMHM1UVhOc1RWOVBTR013YUhsSFlXTktjbGRRVm5NdFdVeFVVMU5qTWpVMWRYZGlXR3hyVm5BM1ExQlRjRWR4VW1kNFdrcDJVMnR4ZFdJMWNHbExaWEJ4UmpWV1ltUm9XSEpLUldJd1dqWjRYM2hKWVZacGVGUXdZMDlhZWxwUExtcDRPVFk1WWtsaVMweERkVnAyYlc4MGVsQk1XRUUuYlZOV3ZKXzZ2Nm44ZUt2b2poX1g1RDlNSE54dUE5QTh5M2ppOFJRV1pZQSIsImV4cCI6MTY3MDYwOTg3MiwiaWF0IjoxNjcwNjA5NTcyfQ.E4oNfA-vVz-y02v17nbAhFj3p5qHb2stU_z8WTeCZug',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'facebook-web',
              uiConfig: {
                buttonCustomStyle: 'background-color: #3b5998;border-color: #3b5998; color: white;',
                buttonImage: '',
                buttonClass: 'fa-facebook-official',
                buttonCustomStyleHover:
                  'background-color: #334b7d;border-color: #334b7d; color: white;',
                buttonDisplayName: 'Facebook',
                iconClass: 'fa-facebook',
                iconFontColor: 'white',
                iconBackground: '#3b5998',
              },
            },
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
            {
              provider: 'google-web',
              uiConfig: {
                buttonImage: 'images/g-logo.png',
                buttonCustomStyle: 'background-color: #fff; color: #757575; border-color: #ddd;',
                buttonClass: '',
                buttonCustomStyleHover:
                  'color: #6d6d6d; background-color: #eee; border-color: #ccc;',
                buttonDisplayName: 'Google',
                iconFontColor: 'white',
                iconClass: 'fa-google',
                iconBackground: '#4184f3',
              },
            },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
};

export const singleProviderLocalAuthFormStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6InJ0aGVsaTUyc3FlNDc0ZmhvNHBnNmE4ZXRrIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNHplSGRJVGxSTmRtVlZUMlpMYVdkYVNERlRRVEozTGxBd2NqZGFhMWR6VWxoZk1HOTVTVkF0YURCWFEwZHRXbGR2TVU1bVgyWnNhVkJ3WXpGbldrd3RabTlJTVdkSk5WRm1UelZXVlZwcU9VWlRNblJXTnkxdmNuQTRhMmRPZW1SS01GbFZVVzFsUWw5M2JIb3laRTVFVDFrdE16Sk1SRmgwZGpNNFJuWmliMDB3UXpBMlZGTkxTVEJsUlVWMU5uVTRkVUZ5UkVFM1JsOU1MV2cyTUdwMU1tMVBhVVl3Wm1ndFJtaGhWV1p5YldzM1RVUmliMjB0WlVsSGIzcExObE5JUWxKWU5rNUpla0ZZUjJGc09VWnBiVUk0ZDNBMFdXZEpWRWR2VGpkM09FSmhhbmx1VlRZME1UTlZOSGd3WldwaVNFOVRRa1ZVWlU0MVdXNVVURU5DUm5GMVUxWk9VVVZIU2xRNVVtMVdTbXBtWDAwMU9ERTBjbWwxWWs5emEyVjJTMUJVWnpoVWFsSjVNelpTY2sxSmFXWkJSelowZUZSUmEzTkNaSEY2YXpoYVlVbHJWRWQ0ZFVwcGJ6UllUelV4VVVoUVRVeDZSamxEYVVORWFtRTNZemh2TTBacFJVVm1iMmcxYWpOb09UUklPWEZDVDJwS1NYTXhhVTFxZWxoVFMzcDZaMHhEWlRONWNXMXljSFZ1ZUMxNllWTXRja3hzZDNKUU9UWlFPVkJpVjJsWVZHNDFRbVprUTNCSlVUSnBWalkxZUhCUmVrUlRNa1paYUhSdlpIVkhTelJyTmtGcU1GOVNRV1JTT0dad1RXNDBWMUpyTkVweVluaFdZMkZPWmpCR2NFSjZTVzFwT1ZnMFF6ZGZiR1ZJVGxSbFFVcHdRVGhrTXpWQ1QwMUpOMTlhVUhkdlYxVm9WelY2YzBJM1NVdFhWR3MzTVVGRlZVSlJaRVppTUVabk1tUnpaRzVVZFZKWFFVWlNaR2RMWTJ0VlFWSnRTbGxCZWtnelRVaDZjMU51WVRZMWJETlBkVGx0VDJkNGRqSkxiV3RHTjI5WGRWRTJkMmQ0VEdwU2JGVlNSMUZMY25aeFdIWkpVVTQxTUZKT1JYTXhhMHM1UVhOc1RWOVBTR013YUhsSFlXTktjbGRRVm5NdFdVeFVVMU5qTWpVMWRYZGlXR3hyVm5BM1ExQlRjRWR4VW1kNFdrcDJVMnR4ZFdJMWNHbExaWEJ4UmpWV1ltUm9XSEpLUldJd1dqWjRYM2hKWVZacGVGUXdZMDlhZWxwUExtcDRPVFk1WWtsaVMweERkVnAyYlc4MGVsQk1XRUUuYlZOV3ZKXzZ2Nm44ZUt2b2poX1g1RDlNSE54dUE5QTh5M2ppOFJRV1pZQSIsImV4cCI6MTY3MDYwOTg3MiwiaWF0IjoxNjcwNjA5NTcyfQ.E4oNfA-vVz-y02v17nbAhFj3p5qHb2stU_z8WTeCZug',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
            { provider: 'localAuthentication' },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
    {
      type: 'PasswordCallback',
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken3', value: '' }],
      _id: 2,
    },
  ],
};

export const singleProviderLocalAuthNoFormStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6ImFpMzZ2NHZwZ243c2JnZGo1YTN2aHZiM3V0IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNW5hRmRCWlVweVRtOTNYekZFY1RJNU4wUkhka2gzTGxJemVsWlJiblJWVkZFMVozWmFjVVZJTkdVMWJUTlFiRUZOVjNwU1RWZzNTV0ZVYld4c1RqRlpjakZQY0U5T1EySlViVEEyTFRsVlQwbDBNbEpQY0RsV2NXWlNUM2xtYWtSWldGWnhTV0l4UVZGdlpreFFRamhPVG10ak1Xb3pMVXBhUVVkNFlrRlRXRTR5U1daaVdFSlVOVlp3Y2xCMWVHMDNOMGcwV2tKSlNYcHRVek5mWVU1clJtRkNSbkJEYzNOUWNteERWM1F3YWxVNVMxTlFRVUpFUkhkRVRFbFRiMnBET1hCQ1NGbzVTRUZxTWxsUlRVUmFialk1VWpORE0xYzBNekZCYTB4d1ZWTmpSSFZEUkdacFEzVm5hVTlDYzJaemR6Tk1OWGt3TVhoZk5rUkVTMnBwT0ZWSGRIVkZWa3B4VGxGcVVUaExWMEZGZFZWSFNVbEthVkZIWjFOa2F6bHRXR1F3ZFhJeU5GcFFNV2hZVkROWVIxWnlaMmc0U2pGU2RUVlZaWFk0WjBobk5FTTNjR2R2ZEVoUFIyVnBWMk5QUTBoSlpXSndTalJWWm5odU1XVnVkVEpaVjFaSFVWTTFiMFo1WVRGalZWSlBPVTA0TUdadVZFTTJZVGh2YkV4c09XVkhZbFE1TkUxVFJYZG5NVk5QTFc1MGJsaHliR1J6TWxvMmVXMXlhR2hxTlc4MGRucEhTV1JvWDIxMU5rVkROMUpMWTFReFlXZGtkRXRUWDBZdFFXaHBZMVpCUWtGc1JrdDZTWGxSTFRRdExUSmpRMDFXWVRoRFRVbHlVV0U1YXpjMlRrWk9Sak5IY2twaGJIZFpiVzlrUnpGc0xWRnRRVmQyZVZrelRVSnJRa1l4UmxKMmFuaDZMVkZHZUd4d1J6SlJOR1p6VkZSVkxYVjFhakl5VWpneWJqQkhhVnBVZDFkbVZVbE9WV2x0VUdWSWVrSnBZbEU1TjJ4dlYwaHZkMUoxVEV3NE5rUjZOVTFVZDB0eFNUQTJNak42V0UweVJuVkJTRUp0V1ROc1NHdHhkWEptWnpOTmRrUjRZVE5mVTNFMmRXZEdPWG8wU2xCVVp6UTRWWE5rUWtwdVduZEdlRlF4TXpoTFdGbFphMUV5Y0dvdU4wWkhRa2QwZG5STE1FRlVibWxHY1ZacVIwTlJady5xa1NtUTM1X253X0lCUU11RlRueW5NMTN1NmFoTGR2bkVYRVhSaTNFSFBjIiwiZXhwIjoxNjY5OTc3OTg1LCJpYXQiOjE2Njk5Nzc2ODV9.iV-WX2dk_8oTug-zlou7SvL29CwfaCSlzR5N0huRsxc',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
            { provider: 'localAuthentication' },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
    },
  ],
};

export const singleProviderNoLocalAuthStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6ImFpMzZ2NHZwZ243c2JnZGo1YTN2aHZiM3V0IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNW5hRmRCWlVweVRtOTNYekZFY1RJNU4wUkhka2gzTGxJemVsWlJiblJWVkZFMVozWmFjVVZJTkdVMWJUTlFiRUZOVjNwU1RWZzNTV0ZVYld4c1RqRlpjakZQY0U5T1EySlViVEEyTFRsVlQwbDBNbEpQY0RsV2NXWlNUM2xtYWtSWldGWnhTV0l4UVZGdlpreFFRamhPVG10ak1Xb3pMVXBhUVVkNFlrRlRXRTR5U1daaVdFSlVOVlp3Y2xCMWVHMDNOMGcwV2tKSlNYcHRVek5mWVU1clJtRkNSbkJEYzNOUWNteERWM1F3YWxVNVMxTlFRVUpFUkhkRVRFbFRiMnBET1hCQ1NGbzVTRUZxTWxsUlRVUmFialk1VWpORE0xYzBNekZCYTB4d1ZWTmpSSFZEUkdacFEzVm5hVTlDYzJaemR6Tk1OWGt3TVhoZk5rUkVTMnBwT0ZWSGRIVkZWa3B4VGxGcVVUaExWMEZGZFZWSFNVbEthVkZIWjFOa2F6bHRXR1F3ZFhJeU5GcFFNV2hZVkROWVIxWnlaMmc0U2pGU2RUVlZaWFk0WjBobk5FTTNjR2R2ZEVoUFIyVnBWMk5QUTBoSlpXSndTalJWWm5odU1XVnVkVEpaVjFaSFVWTTFiMFo1WVRGalZWSlBPVTA0TUdadVZFTTJZVGh2YkV4c09XVkhZbFE1TkUxVFJYZG5NVk5QTFc1MGJsaHliR1J6TWxvMmVXMXlhR2hxTlc4MGRucEhTV1JvWDIxMU5rVkROMUpMWTFReFlXZGtkRXRUWDBZdFFXaHBZMVpCUWtGc1JrdDZTWGxSTFRRdExUSmpRMDFXWVRoRFRVbHlVV0U1YXpjMlRrWk9Sak5IY2twaGJIZFpiVzlrUnpGc0xWRnRRVmQyZVZrelRVSnJRa1l4UmxKMmFuaDZMVkZHZUd4d1J6SlJOR1p6VkZSVkxYVjFhakl5VWpneWJqQkhhVnBVZDFkbVZVbE9WV2x0VUdWSWVrSnBZbEU1TjJ4dlYwaHZkMUoxVEV3NE5rUjZOVTFVZDB0eFNUQTJNak42V0UweVJuVkJTRUp0V1ROc1NHdHhkWEptWnpOTmRrUjRZVE5mVTNFMmRXZEdPWG8wU2xCVVp6UTRWWE5rUWtwdVduZEdlRlF4TXpoTFdGbFphMUV5Y0dvdU4wWkhRa2QwZG5STE1FRlVibWxHY1ZacVIwTlJady5xa1NtUTM1X253X0lCUU11RlRueW5NMTN1NmFoTGR2bkVYRVhSaTNFSFBjIiwiZXhwIjoxNjY5OTc3OTg1LCJpYXQiOjE2Njk5Nzc2ODV9.iV-WX2dk_8oTug-zlou7SvL29CwfaCSlzR5N0huRsxc',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'apple-web',
              uiConfig: {
                buttonCustomStyle:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonImage: 'images/apple-logo.png',
                buttonClass: '',
                buttonCustomStyleHover:
                  'background-color: #000000; color: #ffffff; border-color: #000000;',
                buttonDisplayName: 'Apple',
                iconClass: 'fa-apple',
                iconFontColor: 'white',
                iconBackground: '#000000',
              },
            },
          ],
        },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
    },
  ],
};

export const docsExample = {
  type: 'SelectIdPCallback',
  output: [
    {
      name: 'providers',
      value: [
        {
          provider: 'amazon',
          uiConfig: {
            buttonCustomStyle:
              'background: linear-gradient(to bottom, #f7e09f 15%,#f5c646 85%);color: black;border-color: #b48c24;',
            buttonImage: '',
            buttonClass: 'fa-amazon',
            buttonDisplayName: 'Amazon',
            buttonCustomStyleHover:
              'background: linear-gradient(to bottom, #f6c94e 15%,#f6c94e 85%);color: black;border-color: #b48c24;',
            iconClass: 'fa-amazon',
            iconFontColor: 'black',
            iconBackground: '#f0c14b',
          },
        },
        {
          provider: 'google',
          uiConfig: {
            buttonImage: 'images/g-logo.png',
            buttonCustomStyle: 'background-color: #fff; color: #757575; border-color: #ddd;',
            buttonClass: '',
            buttonCustomStyleHover: 'color: #6d6d6d; background-color: #eee; border-color: #ccc;',
            buttonDisplayName: 'Google',
            iconFontColor: 'white',
            iconClass: 'fa-google',
            iconBackground: '#4184f3',
          },
        },
        {
          provider: 'localAuthentication',
        },
      ],
    },
    {
      name: 'value',
      value: '',
    },
  ],
  input: [
    {
      name: 'IDToken1',
      value: '',
    },
  ],
};
