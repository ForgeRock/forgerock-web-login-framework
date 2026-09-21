<!--
  @component
  Type: header
  Name: DemoHeader

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/headers/<your-name>/ to create your
  own page header, then rebuild with `pnpm build:widget`.

  HOW HEADERS WORK
  ─────────────────
  The framework's Vite plugin writes custom-registry.ts on every build (and
  watches in dev), mapping "DemoHeader" → this component. The login app renders
  the registered header component above the journey container
  (apps/login-app/src/routes/(app)/+page.svelte).

  Header components take NO props — they are static page-level branding slots
  rendered outside the journey flow. They have no access to the journey, form,
  or step state.

  NOTE (singleton rule)
  ─────────────────────
  The current build enforces at most one Type: header component across
  experimental/custom/headers/ — a second file fails the build. This rule is
  being reworked to allow multiple headers with one default (see the ticket's
  multi-entry design revision).
-->

<script lang="ts">
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the framework's centralized
   * exports for custom components. No need to reach into internal aliases like
   * $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list).
   */
  import { interpolate, Link } from '$login-framework';
</script>

<!--
  Page header — rendered above the journey card.

  Customize this markup with your own logo, product name, and nav links.
  All Tailwind classes use the framework's tw_ prefix so theme compilation
  picks them up (see themes/default/config.cjs — prefix: 'tw_').
-->
<header
  class="tw_flex tw_items-center tw_justify-between tw_gap-4 tw_px-8 tw_py-4 tw_border-b tw_border-gray-200 dark:tw_border-gray-700"
>
  <!--
    Logo / icon placeholder.
    Replace this <div> with your own logo, e.g.:
      <img src="/img/your-logo.svg" alt="Acme Corp" class="tw_h-8" />
    Assets placed in apps/login-app/static/ are served from the site root
    (also mounted as Storybook staticDirs).
  -->
  <div
    class="tw_w-8 tw_h-8 tw_rounded tw_bg-blue-600 tw_flex tw_items-center tw_justify-center"
    aria-hidden="true"
  >
    <span class="tw_text-white tw_text-sm tw_font-bold select-none">✦</span>
  </div>

  <!--
    Product name. interpolate() looks up the key in the active locale catalog
    and falls back to the third argument when no translation exists — the
    fallback keeps the demo readable without any locale setup.
  -->
  <span class="tw_text-base tw_font-semibold tw_text-secondary-dark dark:tw_text-secondary-light">
    {interpolate('demoHeaderProductName', null, 'Acme Identity')}
  </span>

  <!--
    Static nav links. Use the framework's Link primitive for themed styling,
    or plain <a> elements for full control. External links (help, docs) are
    normal anchors — the header renders outside the journey, so no
    captureLinks() wiring is needed here.
  -->
  <nav class="tw_flex tw_gap-4">
    <Link href="https://www.pingidentity.com" target="_blank">Help</Link>
    <Link href="https://docs.pingidentity.com" target="_blank">Docs</Link>
  </nav>
</header>
