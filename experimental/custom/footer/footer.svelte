<!--
  Custom page footer wrapper (seeded template).
  ────────────────────────────────────────────
  This file is your file: the framework renders it below the journey container
  (inside the root div of apps/login-app/src/routes/(app)/+page.svelte). It is
  never overwritten once it exists — not by rebuilds, not by `ping-lf update` —
  so edit it freely; your changes survive framework upgrades. If you delete it,
  the next build or dev-server start regenerates the default seed.

  THE NBA USE CASE
  ────────────────
  One wrapper serves many brands: the AM tree names arrive as the journeyName
  prop, so this footer re-skins per league/team:

    journeyName        Rendered as
    ─────────────────  ─────────────────────────────────────
    ''                 NBA (the default journey view)
    'NBA'              NBA
    'WNBA'             WNBA (Fire Orange links on black)
    'Lakers'           Los Angeles Lakers (purple and gold)
    'Celtics'          Boston Celtics (green and gold)
    'Bulls'            Chicago Bulls (red on black)
    'Knicks'           New York Knicks (blue and orange)
    anything else      falls back to the NBA default view

  The `''` contract matters: the framework guarantees the wrapper still renders
  for the AM default journey (never blank), so `''` maps to the NBA view here.

  HOW IT RENDERS
  ──────────────
  The footer mounts client-side only: it first renders once a journey step
  arrives, then stays mounted for the rest of the session (no flicker while
  steps load, switch journeys, or redirect on completion).

  PROPS
  ─────
  The wrapper receives exactly one prop:

    journeyName: string
      Name of the journey currently driving the page (e.g. "WNBA",
      "Lakers"). `''` means the AM default journey. Unknown names fall back
      to the default view, so the footer always renders something.

  The framework passes no other props. Do not add required props of your own —
  they will arrive undefined. Anything you need beyond `journeyName`, derive
  inside this component from the framework exports.

  BRAND COLORS
  ────────────
  Colors are plain hex values from each brand's published identity. They
  intentionally do NOT come from the theme token palette. The values travel
  as CSS custom properties on the root element (style attribute) and the
  scoped style block consumes them. Dark-mode variants are separate
  properties switched by the global .tw_dark class the framework puts on
  body (darkMode: 'class'). Keep brand surfaces paired with white text (AA
  contrast); never set the brand color as small text on a dark surface.

  Trademark note: use text wordmarks and generic marks in your own demos.
  The real NBA/WNBA/team logo files are IP of their owners and need written
  consent before commercial use.
-->

<script lang="ts">
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the
   * framework's centralized exports for custom components. No need to reach
   * into internal aliases like $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list).
   */
  import type { CustomWrapperProps } from '$login-framework';

  /** The one prop the framework passes: the active journey name (`''` = default). */
  export let journeyName: CustomWrapperProps['journeyName'] = '';

  // ─── Brand configuration ───────────────────────────────────────────────────
  /**
   * One entry per journey the tenant hosts. Keys must match the AM tree names
   * exactly (AM journey names are case-sensitive). Every entry carries its own
   * light- and dark-mode colors, so dark variants never fall back to the theme
   * palette. Keep this map in sync with the header wrapper's map — the two
   * files are intentionally independent (the framework renders them as fixed
   * single files, so there is no shared module to import from).
   *
   * surface/darkSurface: footer bar background. text/darkText: copy on that
   * bar. accent/darkAccent: footer links and highlights.
   */
  type LeagueBrand = {
    legal: string;
    links: Array<{ href: string; label: string }>;
    surface: string;
    darkSurface: string;
    text: string;
    darkText: string;
    accent: string;
    darkAccent: string;
  };

  const BRANDS: Record<string, LeagueBrand> = {
    NBA: {
      legal: '© 2026 NBA Media Ventures, LLC. Demo only, not affiliated with the NBA.',
      links: [
        { href: 'https://www.nba.com', label: 'NBA.com' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#1D428A', // NBA Blue
      darkSurface: '#16356E', // NBA Blue, darkened for dark mode
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FFFFFF', // white links clear AA on both blues
      darkAccent: '#FFFFFF',
    },
    WNBA: {
      legal: '© 2026 WNBA Enterprises, LLC. Demo only, not affiliated with the WNBA.',
      links: [
        { href: 'https://www.wnba.com', label: 'WNBA.com' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#000000', // the league identity anchors on black
      darkSurface: '#111111',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FA4D00', // WNBA Fire Orange
      darkAccent: '#FF6A1F', // lightened for interactive states on black
    },
    Lakers: {
      legal: '© 2026 Los Angeles Lakers. Demo only, not affiliated with the Lakers.',
      links: [
        { href: '#', label: 'Tickets' },
        { href: '#', label: 'My Account' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#552583', // Lakers Purple
      darkSurface: '#31006F', // the deep purple nba.com/lakers ships for dark
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FDB927', // Lakers Gold
      darkAccent: '#FDB927',
    },
    Celtics: {
      legal: '© 2026 Boston Celtics. Demo only, not affiliated with the Celtics.',
      links: [
        { href: '#', label: 'Tickets' },
        { href: '#', label: 'My Account' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#007A33', // Celtics Green
      darkSurface: '#00571F',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FFFFFF', // white links clear AA on both greens
      darkAccent: '#FFFFFF',
    },
    Bulls: {
      legal: '© 2026 Chicago Bulls. Demo only, not affiliated with the Bulls.',
      links: [
        { href: '#', label: 'Tickets' },
        { href: '#', label: 'My Account' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#000000', // Bulls identity is red on black
      darkSurface: '#111111',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FFFFFF', // white links clear AA; red fails as 14px text on black
      darkAccent: '#FFFFFF',
    },
    Knicks: {
      legal: '© 2026 New York Knicks. Team names are trademarks of their owners. Demo only.',
      links: [
        { href: '#', label: 'Tickets' },
        { href: '#', label: 'My Account' },
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
      surface: '#006BB6', // Knicks Blue
      darkSurface: '#003D73', // deep navy keeps the blue readable in dark
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FFFFFF', // white links clear AA; orange fails on blue
      darkAccent: '#FFFFFF',
    },
  };

  /** The default journey ('') renders the NBA view; unknown names fall back to it. */
  const DEFAULT_BRAND = 'NBA';

  /**
   * Own-property guard: a plain-object lookup also matches inherited
   * Object.prototype keys ('constructor', 'toString', ...), which would defeat
   * the ?? fallback and render an unbranded footer for such a journey name.
   */
  const hasBrand = (name: string): boolean => Object.hasOwn(BRANDS, name);

  $: brand = hasBrand(journeyName) ? BRANDS[journeyName] : BRANDS[DEFAULT_BRAND];

  // ─── Derived view state ────────────────────────────────────────────────────
  /**
   * Brand colors travel to the scoped styles as CSS custom properties on the
   * root element. One reactive string keeps the markup readable; the style
   * attribute is component-authored static markup, so it passes through the
   * render path untouched.
   */
  $: styleVars = [
    `--league-surface: ${brand.surface}`,
    `--league-dark-surface: ${brand.darkSurface}`,
    `--league-text: ${brand.text}`,
    `--league-dark-text: ${brand.darkText}`,
    `--league-accent: ${brand.accent}`,
    `--league-dark-accent: ${brand.darkAccent}`,
  ].join('; ');
</script>

<footer class="league-footer" style={styleVars}>
  <div class="league-bar">
    <span class="league-legal">{brand.legal}</span>

    <nav class="league-nav" aria-label="Footer links">
      {#each brand.links as link (link.label)}
        <a class="league-link" href={link.href}>{link.label}</a>
      {/each}
    </nav>
  </div>
</footer>

<!--
  Scoped styles for this wrapper. They apply only here — they won't leak to the
  rest of the widget. Light theme reads the base custom properties; the dark
  variants under :global(.tw_dark) override them when the framework's dark
  class is on body.
-->
<style>
  .league-footer {
    display: block;
  }

  .league-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 24px;
    padding: 16px 24px;
    background: var(--league-surface, #1d428a);
    color: var(--league-text, #ffffff);
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .league-legal {
    /* Keep at or above 0.92: lower opacities push the 14px legal line under
       WCAG AA (4.5:1) on the Celtics and Knicks green/blue surfaces. */
    opacity: 0.92;
  }

  .league-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .league-link {
    color: var(--league-accent, #ffffff);
    text-decoration: none;
  }

  .league-link:hover {
    text-decoration: underline;
  }

  :global(.tw_dark) .league-bar {
    background: var(--league-dark-surface, #16356e);
    color: var(--league-dark-text, #ffffff);
  }

  :global(.tw_dark) .league-link {
    color: var(--league-dark-accent, #fa4d00);
  }
</style>
