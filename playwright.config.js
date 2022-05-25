/** @type {import('@playwright/test').PlaywrightTestConfig} */
const url = 'https://localhost:3000';
const config = {
  webServer: {
    command: 'npm run build && npm run preview',
    ignoreHTTPSErrors: true,
    url,
  },
  use: {
    baseURL: `${url}/e2e/`,
    ignoreHTTPSErrors: true,
  }
};

export default config;
