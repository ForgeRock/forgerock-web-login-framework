<!--
  Multi-league branded page header demo component.
  ─────────────────────────────────────────────────
  DEMO COMPONENT
  Page headers and footers are NOT registry components — there is no @component
  header here and none is needed. The framework renders the fixed wrapper files
  (experimental/custom/header/header.svelte and experimental/custom/footer/footer.svelte)
  above and below the journey container. This demo shows how one wrapper can
  serve many brands: the NBA, the WNBA, and a few teams, each with its own
  brand colors, chosen per journey.

  THE NBA USE CASE
  ────────────────
  A single tenant hosts one login journey per league/team. The AM tree names
  arrive as the journeyName prop, so one header/footer pair re-skins itself:

    journeyName        Rendered as
    ─────────────────  ─────────────────────────────────────
    ''                 NBA (the default journey view)
    'NBA'              NBA
    'WNBA'             WNBA (Fire Orange on black)
    'Lakers'           Los Angeles Lakers (purple and gold)
    'Celtics'          Boston Celtics (green and gold)
    'Bulls'            Chicago Bulls (red on black)
    'Knicks'           New York Knicks (blue and orange)
    anything else      falls back to the NBA default view

  The `''` contract matters: the framework guarantees the wrapper still renders
  for the AM default journey (never blank), so `''` maps to the NBA view here.

  HOW TO USE
  ──────────
  Copy the markup, styles, and the BRANDS map you like into
  experimental/custom/header/header.svelte (the wrapper the framework renders),
  or use this file as a visual reference in Storybook. The wrapper is the only
  file the framework renders; this demo is the worked example of what to put
  in it.

  THE ONE PROP
  ────────────
  The wrapper receives exactly one prop:

    journeyName: string
      Name of the journey currently driving the page (e.g. "WNBA",
      "Lakers"). '' means the AM default journey. Unknown names fall back
      to the default view, so the header always renders something.

  BRAND COLORS
  ────────────
  Colors are plain hex values from each brand's published identity (league
  and team color codes, 2017+ era). They intentionally do NOT come from the
  theme token palette: the demo shows how a customer ships their own colors
  inside the wrapper. The values are passed as CSS custom properties on the
  root element (style attribute), and the scoped style block below consumes
  them. Dark-mode variants are separate properties switched by the global
  .tw_dark class the framework puts on body (darkMode: 'class').

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
   */
  import type { CustomWrapperProps } from '$login-framework';

  /** The one prop the framework passes: the active journey name ('' = default). */
  export let journeyName: CustomWrapperProps['journeyName'] = '';

  // ─── Brand configuration ───────────────────────────────────────────────────
  /**
   * One entry per journey the tenant hosts. Keys must match the AM tree names
   * exactly (AM journey names are case-sensitive). Every entry carries its own
   * light- and dark-mode colors, so dark variants never fall back to the theme
   * palette.
   *
   * surface/darkSurface: header bar background. text/darkText: copy on that
   * bar. accent/darkAccent: basketball mark, stripe, and link-like highlights.
   */
  type LeagueBrand = {
    wordmark: string;
    tagline: string;
    /** Logo URL (SVG or PNG with transparent background). Empty string falls back to the generic basketball mark. */
    logo: string;
    surface: string;
    darkSurface: string;
    text: string;
    darkText: string;
    accent: string;
    darkAccent: string;
  };

  const BRANDS: Record<string, LeagueBrand> = {
    NBA: {
      wordmark: 'NBA',
      tagline: 'Sign in with your NBA ID',
      logo: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
      surface: '#1D428A', // NBA Blue
      darkSurface: '#16356E', // NBA Blue, darkened for dark mode
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#C8102E', // NBA Red
      darkAccent: '#E8455F', // lifted NBA Red so the stripe reads on navy
    },
    WNBA: {
      wordmark: 'WNBA',
      tagline: 'Sign in with your WNBA ID',
      logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
      surface: '#000000', // the league identity anchors on black
      darkSurface: '#111111',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FA4D00', // WNBA Fire Orange
      darkAccent: '#FF6A1F', // lightened for interactive states on black
    },
    Lakers: {
      wordmark: 'LAKERS',
      tagline: 'Sign in with your Lakers ID',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
      surface: '#552583', // Lakers Purple
      darkSurface: '#31006F', // the deep purple nba.com/lakers ships for dark
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#FDB927', // Lakers Gold
      darkAccent: '#FDB927',
    },
    Celtics: {
      wordmark: 'CELTICS',
      tagline: 'Sign in with your Celtics ID',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
      surface: '#007A33', // Celtics Green
      darkSurface: '#00571F',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#BA9653', // Celtics Gold
      darkAccent: '#BA9653',
    },
    Bulls: {
      wordmark: 'BULLS',
      tagline: 'Sign in with your Bulls ID',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
      surface: '#000000', // Bulls identity is red on black
      darkSurface: '#111111',
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#CE1141', // Bulls Red
      darkAccent: '#E0194C', // slightly lifted red for dark surfaces
    },
    Knicks: {
      wordmark: 'KNICKS',
      tagline: 'Sign in with your Knicks ID',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/nyk.png',
      surface: '#006BB6', // Knicks Blue
      darkSurface: '#003D73', // deep navy keeps the blue readable in dark
      text: '#FFFFFF',
      darkText: '#FFFFFF',
      accent: '#F58426', // Knicks Orange
      darkAccent: '#F58426',
    },
  };

  /** The default journey ('') renders the NBA view; unknown names fall back to it. */
  const DEFAULT_BRAND = 'NBA';

  /**
   * Own-property guard: a plain-object lookup also matches inherited
   * Object.prototype keys ('constructor', 'toString', ...), which would defeat
   * the ?? fallback and render an unbranded header for such a journey name.
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

<!--
  Branding bar. Scoped styles consume the custom properties set on the header
  root; dark-mode variants switch under the framework's global .tw_dark class.
-->
<header class="league-header" style={styleVars}>
  <div class="league-stripe" aria-hidden="true"></div>

  <div class="league-bar">
    <!--
      Brand logo when the entry carries one, generic basketball mark otherwise.
      The logos here are hot-linked from the league/team CDNs; swap the URLs
      for your own assets (img imports or design-system icons) in a real
      deployment.
    -->
    {#if brand.logo}
      <img class="league-logo" src={brand.logo} alt="{brand.wordmark} logo" />
    {:else}
      <svg class="league-ball" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
        <path d="M3 12h18" stroke="currentColor" stroke-width="2" />
        <path d="M12 3a14 14 0 0 1 0 18" stroke="currentColor" stroke-width="2" />
        <path d="M12 3a14 14 0 0 0 0 18" stroke="currentColor" stroke-width="2" />
      </svg>
    {/if}

    <div class="tw_flex tw_flex-col">
      <span class="league-wordmark">{brand.wordmark}</span>
      <span class="league-tagline">{brand.tagline}</span>
    </div>
  </div>
</header>

<!--
  Scoped styles for this component. They apply only here — they won't leak to
  the rest of the widget. Light theme reads the base custom properties; the
  dark variants under :global(.tw_dark) override them when the framework's
  dark class is on body.
-->
<style>
  .league-header {
    display: block;
  }

  .league-stripe {
    height: 4px;
    background: var(--league-accent, #1d428a);
  }

  .league-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: var(--league-surface, #1d428a);
    color: var(--league-text, #ffffff);
  }

  .league-ball {
    width: 36px;
    height: 36px;
    color: var(--league-accent, #c8102e);
  }

  .league-logo {
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  .league-wordmark {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .league-tagline {
    font-size: 0.875rem;
    line-height: 1.25rem;
    /* Keep at or above 0.92: lower opacities push the 14px tagline under
       WCAG AA (4.5:1) on the Celtics and Knicks green/blue surfaces. */
    opacity: 0.92;
  }

  :global(.tw_dark) .league-stripe {
    background: var(--league-dark-accent, #fa4d00);
  }

  :global(.tw_dark) .league-bar {
    background: var(--league-dark-surface, #16356e);
    color: var(--league-dark-text, #ffffff);
  }

  :global(.tw_dark) .league-ball {
    color: var(--league-dark-accent, #fa4d00);
  }
</style>
