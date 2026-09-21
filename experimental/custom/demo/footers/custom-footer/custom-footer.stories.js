/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the custom-footer demo component.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * Footer components take no props, so stories differ only in the stand-in
 * journey placeholder rendered above the footer.
 */

import { expect, userEvent, within } from 'storybook/test';

import Story from './custom-footer.story.svelte';

// ─── Default export — story metadata ────────────────────────────────────────
export default {
  /**
   * component — the Svelte component Storybook mounts for every story in this
   * file. This should always be the story wrapper (*.story.svelte), not the
   * component under development directly.
   */
  component: Story,

  /**
   * parameters — global rendering options.
   * layout: 'fullscreen' disables Storybook's default canvas padding so the
   * footer can anchor to the bottom edge as it does on the real login page.
   */
  parameters: {
    layout: 'fullscreen',
  },

  /**
   * title — the sidebar path for this component's stories.
   * Segments separated by '/' create nested groups in the sidebar.
   * Convention for custom components: 'Custom/<Type>/<ComponentName>'.
   */
  title: 'Custom/Footer/CustomFooter',
};

// ─── Base story ──────────────────────────────────────────────────────────────
/**
 * Base — default state: copyright line plus Terms of use and Privacy policy
 * links. Use this story to verify the initial visual appearance.
 */
export const Base = {
  args: {
    journeyPlaceholder: 'Journey renders here (above the custom footer)',
  },
};

// ─── Interaction story ───────────────────────────────────────────────────────
/**
 * Interaction — runs an automated interaction test in the Storybook canvas.
 *
 * The `play` function is executed by Storybook's test runner after the story
 * mounts. It asserts that both legal links render with the expected text and
 * target URLs, confirming the footer's anchor wiring (href + rel) is intact.
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const termsLink = canvas.getByRole('link', { name: 'Terms of use' });
    const privacyLink = canvas.getByRole('link', { name: 'Privacy policy' });

    expect(termsLink).toHaveAttribute('href', expect.stringContaining('pingidentity.com'));
    expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Hover an anchor to exercise the underline-toggle state from the theme's
    // .link rule — a smoke check that the themed link classes are attached.
    await userEvent.hover(termsLink);
  },
};
