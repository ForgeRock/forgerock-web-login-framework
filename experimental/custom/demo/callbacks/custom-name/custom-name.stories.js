/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the custom-name demo callback component.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * Each named export can define:
 *   args   — prop values passed to the component wrapper (custom-name.story.svelte).
 *   play   — an async function that runs interaction tests in the canvas after
 *            the story mounts. Used for automated accessibility + behaviour checks.
 */

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { userEvent, within } from 'storybook/test';
import { expect } from 'storybook/test';

import response from './custom-name.mock';
import Story from './custom-name.story.svelte';

/**
 * Construct a real SDK FRStep from the mock AM response.
 * FRStep wraps the raw payload and exposes typed getters like
 * getCallbackOfType(), getStage(), getHeader(), etc.
 * Using a real FRStep (rather than a plain object) ensures the component
 * behaves exactly as it would with a live AM response.
 */
const step = new FRStep(response);

// ─── Default export — story metadata ────────────────────────────────────────
export default {
  /**
   * argTypes — Storybook controls configuration.
   * Setting `control: false` hides the `callback` arg from the Controls panel
   * because it is a complex SDK object that cannot be edited via a form field.
   * Add entries here for any simple props (strings, booleans) you want to
   * expose as interactive controls in the Storybook UI.
   */
  argTypes: {
    callback: { control: false },
  },

  /**
   * component — the Svelte component Storybook mounts for every story in this
   * file. This should always be the story wrapper (*.story.svelte), not the
   * component under development directly.
   */
  component: Story,

  /**
   * parameters — global rendering options.
   * layout: 'fullscreen' disables Storybook's default canvas padding so the
   * <Centered> wrapper in the story component controls layout instead.
   */
  parameters: {
    layout: 'fullscreen',
  },

  /**
   * title — the sidebar path for this component's stories.
   * Segments separated by '/' create nested groups in the sidebar.
   * Convention for custom components: 'Custom/Callback/<ComponentName>'.
   * Change this to match your own component name.
   */
  title: 'Custom/Callback/CustomName',
};

// ─── Base story ──────────────────────────────────────────────────────────────
/**
 * Base — the default rendering of the component with no interaction.
 * Use this story to verify the initial visual appearance.
 *
 * args.callback — a real NameCallback instance extracted from the mock step.
 * The story wrapper (custom-name.story.svelte) receives this as the `callback`
 * prop and passes it through to <CustomName>.
 */
export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.NameCallback),
  },
};

// ─── Interaction story ───────────────────────────────────────────────────────
/**
 * Interaction — runs an automated interaction test in the Storybook canvas.
 *
 * The `play` function is executed by Storybook's test runner after the story
 * mounts. It simulates real user input and asserts that the SDK callback value
 * is updated correctly, confirming that setValue() wires the input to the
 * callback as expected.
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Re-extract the callback so we can assert against the same instance that
    // the story mounted with (step is module-level, so it's the same object).
    const cb = step.getCallbackOfType(CallbackType.NameCallback);

    // Find the text input by its implicit ARIA role.
    const element = canvas.getByRole('textbox');

    // Simulate the user typing a value and tabbing away.
    await userEvent.type(element, 'custom-user');
    await userEvent.tab();

    // Assert that setValue() correctly wrote the typed value back into the SDK callback.
    expect(cb.getInputValue()).toBe('custom-user');
  },
};
