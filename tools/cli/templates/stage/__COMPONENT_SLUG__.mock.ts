/**
 * Mock journey step for the __COMPONENT_NAME__ stage's Storybook stories.
 *
 * A stage receives a full JourneyStep with one or more callbacks. Replace the
 * placeholder callback entries below with the real shape AM sends for the
 * page node this stage renders. Add more callbacks if your stage composes
 * multiple inputs.
 */

import { createJourneyStep } from '$login-framework';

export default createJourneyStep({
  authId: 'test-auth-id',
  callbacks: [
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: '__COMPONENT_NAME__',
});
