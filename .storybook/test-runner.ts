// .storybook/test-runner.ts

import type { TestRunnerConfig } from '@storybook/test-runner';

import { injectAxe, checkA11y as _checkA11y, configureAxe } from 'axe-playwright';
import { getStoryContext } from '@storybook/test-runner';

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
 * to learn more about the test-runner hooks API.
 */
const a11yConfig: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    try {
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
    } catch {
      // postVisit can fail if the play function threw — don't mask those errors
    }
  },
  testTimeout: 30000,
};

export default a11yConfig;
