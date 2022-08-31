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
