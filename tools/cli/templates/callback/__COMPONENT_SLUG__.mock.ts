/**
 * Mock journey step for the __COMPONENT_NAME__ callback's Storybook stories.
 *
 * Replace the placeholder `type`, `output`, and `input` fields with the real
 * AM payload your callback consumes. The shape mirrors what AM sends back from
 * an authentication tree.
 */

import { createJourneyStep } from '$login-framework';

export default createJourneyStep({
  authId: 'test-auth-id',
  callbacks: [
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: '__COMPONENT_NAME__ prompt' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
});
