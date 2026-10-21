/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the branded-footer demo component.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * The stories exercise the three states of the single `journeyName` prop:
 * `''` (AM default journey), a generic named journey, and a journey the demo
 * branches on explicitly (Register).
 */

import { expect, within } from 'storybook/test';

import Story from './branded-footer.story.svelte';

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
   * footer can pin to the bottom edge as it does on the real login page.
   */
  parameters: {
    layout: 'fullscreen',
  },

  /**
   * title — the sidebar path for this component's stories.
   * Segments separated by '/' create nested groups in the sidebar.
   * Convention for custom components: 'Custom/<Type>/<ComponentName>'.
   * Footers are not registry components, but the same title convention keeps
   * the sidebar organized.
   */
  title: 'Custom/Footer/BrandedFooter',
};

// ─── Default journey story ───────────────────────────────────────────────────
/**
 * DefaultJourney — `journeyName` is `''`: the AM default journey, the one the
 * tenant serves when the URL names no journey. The wrapper's contract says it
 * must still render its default-journey view (never blank), so this story
 * shows the branded bar with the standard legal line and links.
 */
export const DefaultJourney = {
  args: {
    journeyName: '',
  },
};

// ─── Named journey story ─────────────────────────────────────────────────────
/**
 * NamedJourney — a journey named in the URL (e.g. `?journey=Login`), so the
 * wrapper receives `journeyName: 'Login'`. The demo treats any journey it
 * does not branch on explicitly as the generic named-journey view.
 */
export const NamedJourney = {
  args: {
    journeyName: 'Login',
  },
};

// ─── Register journey story ──────────────────────────────────────────────────
/**
 * RegisterJourney — a journey the demo branches on explicitly. The link list
 * gains an "Acceptable Use" entry, showing how the same wrapper renders a
 * per-journey view when the journey stack changes (latest entry wins).
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
 * mounts. It asserts the branded footer content is present and switches with
 * the journey: the Register story must include the extra "Acceptable Use"
 * link.
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...RegisterJourney.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The demo branches on 'Register': the extra link must render.
    expect(canvas.getByText('Acceptable Use')).toBeTruthy();

    // The legal line and the standard links are present in every view.
    expect(canvas.getByText('© 2026 Acme Corporation. All rights reserved.')).toBeTruthy();
    expect(canvas.getByText('Privacy')).toBeTruthy();
    expect(canvas.getByText('Terms')).toBeTruthy();
  },
};
