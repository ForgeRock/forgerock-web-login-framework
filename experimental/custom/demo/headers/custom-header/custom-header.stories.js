/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the custom-header demo component.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * Header components take no props, so stories differ only in the stand-in
 * journey placeholder rendered beneath the header.
 */

import { expect, within } from 'storybook/test';

import Story from './custom-header.story.svelte';

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
   * header can stretch edge-to-edge as it does on the real login page.
   */
  parameters: {
    layout: 'fullscreen',
  },

  /**
   * title — the sidebar path for this component's stories.
   * Segments separated by '/' create nested groups in the sidebar.
   * Convention for custom components: 'Custom/<Type>/<ComponentName>'.
   */
  title: 'Custom/Header/CustomHeader',
};

// ─── Base story ──────────────────────────────────────────────────────────────
/**
 * Base — default state: logo placeholder, product name, and two nav links.
 * Use this story to verify the initial visual appearance.
 */
export const Base = {
  args: {
    journeyPlaceholder: 'Journey renders here (below the custom header)',
  },
};

// ─── Interaction story ───────────────────────────────────────────────────────
/**
 * Interaction — runs an automated interaction test in the Storybook canvas.
 *
 * The `play` function is executed by Storybook's test runner after the story
 * mounts. It asserts that the logo placeholder, product name, and both nav
 * links render, confirming the header's markup and link wiring are intact.
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const helpLink = canvas.getByRole('link', { name: 'Help' });
    const docsLink = canvas.getByRole('link', { name: 'Docs' });

    expect(helpLink).toHaveAttribute('href', expect.stringContaining('pingidentity.com'));
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(canvas.getByText('Acme Identity')).toBeTruthy();
  },
};
