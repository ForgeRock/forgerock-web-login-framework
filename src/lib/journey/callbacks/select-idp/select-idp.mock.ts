export const socialStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6ImhkdDMza2g0cHRmN2Q5b2cxNXNlcmU2NWdpIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNTVkVlV6YTNsZldrMVlabEpXVVRGT1ptUnRRa1pCTG1Sc1VEaDFNMkUxU25aQmEydHdVa05pYXkwelJrUlBTa2x0VjFsSE0zbFpWMVpxUjBac1dUUmhOMnRvZUVSek9IZEpOM0JUTVV0dlVsbG1iWGQyZFUxb1ZXSmZSM1UxUW5wVldVcG1NRlZaVUZCR1J6WjFlWE5CZUU1cFNYVk1TMHhPZW5reE5WTkNWek0wTVd0WldHaE9hRk5UZUZCdFYzSkRjVnBDUjBwYVJrRm5ObWd4V2xCUFJIWTFSMnBYZUdwTGNXTkZjMmhwTTJaWmNHcFNNMEV0TWtzdFowZGxMVWhPYWtKRGJHTm9UMkpOZVUxSVdVWkRhSFZMVmxKNFZVbDRabFoyUW5OS01XWnZZVTFaVUZWVVVrMVRVMDlRTlZoMU1Fd3dPWFZEY1VZd2JFcFhSWGREU0Rka1lqbENWR3RtT1hobVdXZ3laazkzWjJkUWRYQjFNbTVMTUhNNFNsbHBUMjVSTlVweGVXSm5aMGRmZDJwUVQzbGplbGx5V25sZlYwY3lTRGhVTW05RU1tRXdiVTB0VEhJeGVFMDRWVk5rU1hVd2F6a3phWGRPTTI1bWR6WmxaMU5aU0ZScmRuUmljMWxxTVRoclZFbHNWMFZpZUhoWFdWRkpWVXhXTlRGcll6Z3pRWFJHYWxoemNISXlhVWcxU1ZKRWFYWm9NSFIwYkZOa1p6aDFWa2t4TmxaS1kybFhORlEwVnpOaWNESnljWGhaTlRVNU1XOXRVSEEyWlZVMmRWODRhMWxNV1VWR1NVc3ROWFJ5T1dwZmMzWjBjVEJRYm1Wb1h6ZHhiMkV0ZEU1dlZYSk5PRWRLVkRGalJHdHpNa1ZIWlhCMVVtZ3lkalJvV1ZwNFlVZHpOUzFtYUhWbU5VVldjbkE0V2pOM2J6aHlkSGsxWm1WS2RFUnNOMFpCYUU4eVgxZGFZM1pOTFVaS1dVbDFOa1ZuVmpKdU1uUnJkWEpvU2xCeU5IQnlWSEZtTldKbWJVcEZjMDl2U2xKeFNHZDBjMDh3ZDJOM01rRXlXVWhqVlVkVVNGbElWM054VUdsV1pYaDBPWGsxZEUxelVFVTBWVUU0Y0VjeWMwWldibTVIUWxCQ1JYWjJWSE16VGxaWFdVRmthamw0V2xBdVVsbGpVbEY2VlRsZlFUWmhabGRJY1V4NVJtMTVVUS5OMkU2WHREdlBqcUZud25vTl9keVBnVElURDNnaDdJZ25PTnlMRENTbU5RIiwiZXhwIjoxNjY5OTc4NzI3LCJpYXQiOjE2Njk5Nzg0Mjd9.Rydq8kHOTl6Zh3cnM1__9R8ml0b4N2ErQKH-L5Obu3g',
  callbacks: [
    {
      type: 'SelectIdPCallback',
      output: [
        {
          name: 'providers',
          value: [
            {
              provider: 'apple',
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

export const socialStepLocalAuthNoForm = {
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

export const socialStepLocalAuthWithForm = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlNvY2lhbExvZ2luLXdlYiIsIm90ayI6ImppZDZzYTc5ZnZlanM1amd2Njl2NzU1cjk5IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNXRWMXByZW5ZeWJGaEljR3RUTm5Kb1MzTTVia2RCTG5WTGFHUmpTVTVKVDNsTlVYaEtaRGh3V1dwbVZuRldWMWhVY25GcmVYZHFZV1l3Y0VSM1pISlVTWHBoVldocFJIWndjbmx6TVhObWNsbGFjeTExWWpaNk5uUlhlWE15Ums5WU5VRjBhMlIzU25ocWRqVlBVRjkxV0VkS1NFOU5WREowWmxsNFJHSTBiR0p5V0d0Zk5TMUtPV05zT0ZKUFVVUjFkVmxuTTA1S1FYSjRlVkJEVlVoclIzWnhUSGxFYURaVWFHZGlPSEZ2WWtOMlVYSmFaazV2ZWpOcVFXWm9kM05XYjFSWVJ6RjZTbkpwYkZWZlJGY3hUVWszUjB0VE9IWnpNVzFNTTFNeFEzbFVOVWR5ZHpOQ2NHRlRaMEpUZWs5M1lrZ3RTVU5tWDFSa2VHRm1UVXBtZG5SNWNtVTBabmRDY2xoRmFIRjZlbHBPT1RONldsVTVkWHBvZGtwemNrVkpha054VGxacGJFNXlNWEpKVFRjelJETjRTbU5oWDNwMU9HZ3hUVkozYm5waU5HNUdOM0ZZY3pOamJWUnRZV1p1WlZkalRuaFpibVF4V2sxQ1pUZFdORVp3YUU1Tk9XZ3pkR2RGV0RKUFJqWkNTMDgyT1dndGFEWmpMV3RvZGtKUFJrVlZaekJUVVhsaFpEbDBlRzF1UTJnMU5FdDVibU5VTWxod1JHdDZkV3hmVjNOdk9XZGpTREF5ZGt4TVYySjZPV28xTm5GNGVFWXRSekpQWkhoQ2IwOU1aR1V6U2pReFVVSk9kRFJIWVhSM1J6QnNaMUpRUTNZM2RHcGhjMmxDYkhONldEZEpPWFZPTTBGTFNrTmFPWEZUVEV4WFUxSTRhSFZVUjBsME5WaEliMHBYVDIwMVZsaE9WRzUyYkdKeGRubDZWMWhDWms5WVZIVmpMVGhUTlRsZlkwNTRTVGh3T0hod1l6bFZTMnB0ZUMxVlZrdHhXbnBKYkVSdlQxUTFlWEpOYW1kdldFMVZRMFJ5V2xFNFN6bHNVMWcxVUVRMGMyWldkblZyTVZodVFUWnJja1poWVhkVFExSmlZVGh2YUdKek5GUTFXRWQ2Y2pKelQzSlFXbUZPTFdGbVkxWlJTRVo0U3pKdlZYRjRUVnBqVDFBdFFuQTFRMG90Ym5oQlpHWnNiazl6UkdWc1NtVlhTRmhuT0VreFVISnNWa3R0WkVSNGNsaENhVFZwY0VGU2FGbDNiMFJqYmpkTVJWUkxhemhuTTJ0VExqUjVlVTlaY2xKdVZGaGhUM05PVVZKTFgycHNaM2MuWGllNDVVYXNPeXVrQ042cGxNVFZEcTEwQ3lIa05tVTVvclQzY3lYQW9pNCIsImV4cCI6MTY2OTk3ODg1NiwiaWF0IjoxNjY5OTc4NTU2fQ.vK0Kui85p41tMwa4dMBSO3o5YtTB2TLr-HPwINztzy0',
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
