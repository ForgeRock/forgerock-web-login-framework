import { themes } from '@storybook/theming';

import '../src/app.css';

// Set background color quicker to ensure Accessibility contrast is properly measured
// const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
// const bg = prefersDarkTheme ? themes.dark.appBg : themes.dark.appBg;
// document.body.style = `background-color: ${bg}`;

// Set background color quicker to ensure Accessibility contrast is properly measured
const prefersDarkThemeString = window.localStorage.getItem('sb-addon-themes-3');
let prefersDarkTheme;
try {
  prefersDarkTheme = JSON.parse(prefersDarkThemeString).current === 'dark';
} catch (err) {
  prefersDarkTheme = false;
}
const bg = prefersDarkTheme ? themes.dark.appBg : themes.light.appBg;
document.body.style = `background-color: ${bg};`;

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  // backgrounds: {
  //   default: 'dark',
  //   values: [
  //     {
  //       name: 'dark',
  //       value: '#1e293b',
  //     },
  //   ],
  // },
  controls: {
    // matchers: {
    //   color: /(background|color)$/i,
    //   date: /Date$/,
    // },
  },
  darkMode: {
    classTarget: 'body',
    // Override the default dark theme
    // dark: { ...themes.dark, appBg: '#111111', appContentBg: '#171717', barBg: '#111111' },
    darkClass: 'tw_dark',
    // Override the default light theme
    // light: { ...themes.normal, appBg: '#f5f5f5', appContentBg: '#e5e5e5', barBg: '#f5f5f5' },
    lightClass: 'tw_light',
    stylePreview: true
  },
};
