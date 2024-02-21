// .storybook/test-runner.ts

import type { TestRunnerConfig } from '@storybook/test-runner';

import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';
import { getStoryContext } from '@storybook/test-runner';

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
 * to learn more about the test-runner hooks API.
 */
const a11yConfig = {
  async preRender(page) {
    await injectAxe(page);
  },
  async postRender(page, context) {
    const storyContext = await getStoryContext(page, context);
    // Apply story-level a11y rules
    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules,
    });

    // Enable this to start having Accessibility checks in our tests!
    // await checkA11y(page, '#storybook-root', {
    //   detailedReport: true,
    //   detailedReportOptions: {
    //     html: true,
    //   },
    // });
  },
  testTimeout: 30000,
};

module.exports = a11yConfig;
