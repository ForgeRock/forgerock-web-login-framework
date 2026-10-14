/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the custom footer wrapper.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * The stories demonstrate how the footer wrapper receives the `journeyName`
 * prop the framework derives from the latest journey-stack entry, so you can
 * build per-journey views inside the wrapper.
 */

import { expect, within } from 'storybook/test';

import Story from './footer.story.svelte';

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
  title: 'Custom/Footer/Wrapper',
};

// ─── Base story ──────────────────────────────────────────────────────────────
/**
 * DefaultJourney — the wrapper as users first see it: no journey named in the
 * URL, so `journeyName` is `''` (the AM default journey). The wrapper shows
 * its default-journey view; it never renders blank.
 *
 * Since the tracked wrapper ships as a no-op placeholder, nothing visible
 * renders by default — edit the wrapper (or this story's args) to see the
 * per-journey views.
 */
export const DefaultJourney = {
  args: {
    journeyName: '',
    journeyPlaceholder: 'Default journey renders here (AM serves it when the URL names no journey)',
  },
};

// ─── Named journey story ─────────────────────────────────────────────────────
/**
 * NamedJourney — a journey named in the URL (e.g. `?journey=Login`), so the
 * wrapper receives `journeyName: 'Login'`. Branch your markup on this value
 * to render per-journey views.
 */
export const NamedJourney = {
  args: {
    journeyName: 'Login',
  },
};

// ─── Second journey story ────────────────────────────────────────────────────
/**
 * RegisterJourney — a second named journey, showing how the same wrapper
 * switches views when the journey stack changes (latest entry wins).
 */
export const RegisterJourney = {
  args: {
    journeyName: 'Register',
  },
};

// ─── Interaction story ───────────────────────────────────────────────────────
/**
 * Interaction — runs an automated interaction test in the Storybook canvas.
 *
 * The `play` function is executed by Storybook's test runner after the story
 * mounts. It asserts the wrapper renders the footer element (the no-op
 * placeholder ships hidden; the element itself must still mount).
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...NamedJourney.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The wrapper's default markup is a hidden placeholder; the <footer>
    // element itself must still be present in the DOM.
    const footerElement = canvasElement.querySelector('footer');

    expect(footerElement).toBeTruthy();
    expect(
      canvas.getByText('Journey renders here (between the custom header and footer)'),
    ).toBeTruthy();
  },
};
