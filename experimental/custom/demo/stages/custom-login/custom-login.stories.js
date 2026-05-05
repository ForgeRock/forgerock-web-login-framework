/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { fn } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { customLoginStep } from './custom-login.mock';
import Story from './custom-login.story.svelte';

/**
 * Construct a Journey Client step from the mock AM response payload.
 * This provides the same step/callback contract used by the widget runtime.
 */
const step = createJourneyStep(customLoginStep);

// ─── Default export — story metadata ────────────────────────────────────────
export default {
  /**
   * argTypes — Storybook controls configuration.
   * Hiding `form`, `journey`, and `step` from the Controls panel because they
   * are complex objects. Expose simple scalar props (strings, booleans) as
   * controls instead — add them here and as `export let` props in the wrapper.
   */
  argTypes: {
    form: { control: false },
    journey: { control: false },
    step: { control: false },
  },

  /**
   * component — the Svelte component Storybook mounts for every story.
   * Always point to the story wrapper (*.story.svelte).
   */
  component: Story,

  parameters: {
    layout: 'fullscreen',
  },

  /**
   * title — the sidebar path for this component's stories.
   * Convention for custom stage components: 'Custom/Stage/<ComponentName>'.
   */
  title: 'Custom/Stage/CustomLogin',
};

// ─── Shared base args ────────────────────────────────────────────────────────
/**
 * baseArgs — prop values shared across all stories.
 * Define them once here and spread into each story's args to avoid repetition.
 *
 * form.submit   — spy function; Storybook Actions panel logs calls to it.
 * form.message  — empty string means no error banner is shown.
 * form.status   — empty string (no validation state on first render).
 * form.icon     — true enables the status icon in the form header.
 *
 * journey.loading — false; the submit button is enabled.
 * journey.stack   — writable store required by captureLinks().
 * journey.push / journey.pop — spy functions for navigation link testing.
 *
 * step — the JourneyStep built from the mock; drives the callback loop in the template.
 */
const baseArgs = {
  form: {
    icon: true,
    message: '',
    status: '',
    submit: fn(),
  },
  journey: {
    loading: false,
    pop: fn(),
    push: fn(),
    stack: writable([]),
  },
  step,
};

// ─── Base story ──────────────────────────────────────────────────────────────
/**
 * Base — default state: username + password fields, no error, submit button
 * enabled. Use this story to verify the initial visual appearance.
 */
export const Base = {
  args: baseArgs,
};

// ─── WithError story ─────────────────────────────────────────────────────────
/**
 * WithError — simulates the state after AM rejects the credentials.
 *
 * Overrides form.message with a non-empty string to render the <Alert> banner.
 * The alert component steals focus (needsFocus=true) on the next render cycle,
 * matching the behaviour users would experience after a failed login attempt.
 *
 * Use this story to:
 *   - verify the error alert renders and is visually distinct
 *   - confirm the alert text matches the AM error message
 *   - test screen-reader announcements with an accessibility audit tool
 */
export const WithError = {
  args: {
    ...baseArgs,
    form: {
      ...baseArgs.form,
      message: 'Invalid credentials. Please try again.',
      // Use a fresh fn() so the Actions panel tracks submit calls independently
      // from the Base story's spy.
      submit: fn(),
    },
  },
};

// ─── Loading story ───────────────────────────────────────────────────────────
/**
 * Loading — simulates the in-flight state while a step submission is pending.
 *
 * Sets journey.loading=true, which disables the submit button and shows a
 * spinner via the <Button busy={journey.loading}> prop. Use this story to:
 *   - verify the button's busy/disabled state renders correctly
 *   - confirm the spinner appears and the button text is still legible
 *   - test that the form cannot be double-submitted while loading
 */
export const Loading = {
  args: {
    ...baseArgs,
    journey: {
      ...baseArgs.journey,
      loading: true,
    },
  },
};
