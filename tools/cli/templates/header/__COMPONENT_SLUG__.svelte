<!--
@component
Type: header
Name: __COMPONENT_NAME__

Custom page header component.

A header is a static page-level branding slot rendered above the journey
container by the login app (apps/login-app/src/routes/(app)/+page.svelte).
It takes NO props and has no access to the journey, form, or step state.

Replace the markup below with your own logo, product name, and nav links.
-->

<script lang="ts">
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the framework's
   * centralized exports for custom components. No need to reach into internal
   * aliases like $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list).
   */
  import { interpolate } from '$login-framework';
</script>

<!--
  Page header — rendered above the journey card.

  All Tailwind classes use the framework's tw_ prefix so theme compilation
  picks them up (see themes/default/config.cjs — prefix: 'tw_').

  interpolate() looks up the key in the active locale catalog and falls back
  to the third argument when no translation exists.
-->
<header
  class="tw_flex tw_items-center tw_justify-between tw_gap-4 tw_px-8 tw_py-4 tw_border-b tw_border-gray-200 dark:tw_border-gray-700"
>
  <!--
    Logo / icon placeholder.
    Replace this <div> with your own logo, e.g.:
      <img src="/img/your-logo.svg" alt="Your company" class="tw_h-8" />
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
    Product name. The interpolate() fallback keeps the component readable
    without any locale setup.
  -->
  <span class="tw_text-base tw_font-semibold tw_text-secondary-dark dark:tw_text-secondary-light">
    {interpolate('__COMPONENT_SLUG__ProductName', null, '__COMPONENT_NAME__')}
  </span>

  <!--
    Static nav links. Use the framework's Link primitive for themed styling,
    or plain <a> elements for full control. The header renders outside the
    journey, so no captureLinks() wiring is needed here.
  -->
  <nav class="tw_flex tw_gap-4">
    <a class="tw_link dark:tw_link_dark" href="https://example.com/help">Help</a>
    <a class="tw_link dark:tw_link_dark" href="https://example.com/docs">Docs</a>
  </nav>
</header>
