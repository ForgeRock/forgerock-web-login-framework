/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Storybook story file for the league-footer demo component.
 *
 * This file uses Component Story Format (CSF 3). It has two parts:
 *
 *   1. A default export — the story metadata (title, component, global config).
 *   2. Named exports — individual stories, each rendered as a separate canvas
 *      entry in the Storybook sidebar.
 *
 * The stories exercise the multi-league use case: the AM default journey ('')
 * renders the NBA view, and one journey per brand — NBA, WNBA, Lakers,
 * Celtics, Bulls, Knicks — re-skins the footer with that brand's colors.
 */

import { expect, within } from 'storybook/test';

import Story from './league-footer.story.svelte';

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
  title: 'Custom/Footer/LeagueFooter',
};

// ─── Default journey story ───────────────────────────────────────────────────
/**
 * DefaultJourney — `journeyName` is `''`: the AM default journey, the one the
 * tenant serves when the URL names no journey. The wrapper's contract says it
 * must still render its default-journey view (never blank), so this story
 * shows the NBA view: NBA Blue bar, white legal line, white links.
 */
export const DefaultJourney = {
  args: {
    journeyName: '',
  },
};

// ─── NBA story ───────────────────────────────────────────────────────────────
/**
 * NBA — a journey named in the URL (e.g. `?journey=NBA`), so the wrapper
 * receives `journeyName: 'NBA'`. Same view as the default journey: NBA Blue
 * #1D428A surface with white links.
 */
export const NBA = {
  args: {
    journeyName: 'NBA',
  },
};

// ─── WNBA story ──────────────────────────────────────────────────────────────
/**
 * WNBA — `?journey=WNBA`. Black bar with Fire Orange #FA4D00 links, mirroring
 * the league's orange-black-white identity.
 */
export const WNBA = {
  args: {
    journeyName: 'WNBA',
  },
};

// ─── Lakers story ────────────────────────────────────────────────────────────
/**
 * Lakers — `?journey=Lakers`. Lakers Purple #552583 bar with Lakers Gold
 * #FDB927 links.
 */
export const Lakers = {
  args: {
    journeyName: 'Lakers',
  },
};

// ─── Celtics story ───────────────────────────────────────────────────────────
/**
 * Celtics — `?journey=Celtics`. Celtics Green #007A33 bar with white links.
 */
export const Celtics = {
  args: {
    journeyName: 'Celtics',
  },
};

// ─── Bulls story ─────────────────────────────────────────────────────────────
/**
 * Bulls — `?journey=Bulls`. Black bar with Bulls Red #CE1141 links, mirroring
 * the team's red-on-black identity.
 */
export const Bulls = {
  args: {
    journeyName: 'Bulls',
  },
};

// ─── Knicks story ────────────────────────────────────────────────────────────
/**
 * Knicks — `?journey=Knicks`. Knicks Blue #006BB6 bar with Knicks Orange
 * #F58426 links.
 */
export const Knicks = {
  args: {
    journeyName: 'Knicks',
  },
};

// ─── Interaction story ───────────────────────────────────────────────────────
/**
 * Interaction — runs an automated interaction test in the Storybook canvas.
 *
 * The `play` function is executed by Storybook's test runner after the story
 * mounts. It asserts the branded footer content is present and switches with
 * the journey: the Lakers story must show the Lakers legal line and the
 * team-flavored links.
 *
 * Run interaction tests with: pnpm test:storybook (requires Storybook running).
 */
export const Interaction = {
  args: { ...Lakers.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The demo branches on 'Lakers': the Lakers legal line must render.
    expect(
      canvas.getByText('© 2026 Los Angeles Lakers. Demo only, not affiliated with the Lakers.'),
    ).toBeTruthy();

    // The team-flavored links are present in the Lakers view.
    expect(canvas.getByText('Tickets')).toBeTruthy();
    expect(canvas.getByText('My Account')).toBeTruthy();

    // The NBA wordmark links must not leak into the Lakers view.
    expect(canvas.queryByText('NBA.com')).toBeNull();
  },
};
