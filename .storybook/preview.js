import { themes } from '@storybook/theming';
import '../src/app.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  // backgrounds: {
  //   default: 'black',
  //   values: [
  //     {
  //       name: 'black',
  //       value: '#111111',
  //     },
  //   ],
  // },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  darkMode: {
    // Override the default dark theme
    dark: { ...themes.dark },
    // Override the default light theme
    light: { ...themes.normal },
  },
};
