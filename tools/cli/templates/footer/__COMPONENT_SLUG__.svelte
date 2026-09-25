<!--
@component
Type: footer
Name: __COMPONENT_NAME__

Custom page footer component.

A footer is a static page-level slot rendered below the journey container
by the login app (apps/login-app/src/routes/(app)/+page.svelte). It takes
NO props and has no access to the journey, form, or step state.

Replace the markup below with your own copyright, legal links, and locale
switch.
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

  /**
   * Legal link hrefs — keep them here so implementers see one obvious place
   * to swap in their own URLs. Change them to your organization's terms and
   * privacy policy.
   */
  const TERMS_URL = 'https://example.com/terms';
  const PRIVACY_URL = 'https://example.com/privacy';
</script>

<!--
  Page footer — rendered below the journey card.

  Typical contents: copyright, terms / privacy / support links, locale switch.
  All Tailwind classes use the framework's tw_ prefix so theme compilation
  picks them up (see themes/default/config.cjs — prefix: 'tw_').
-->
<footer
  class="tw_flex tw_flex-col sm:tw_flex-row sm:tw_items-center sm:tw_justify-between tw_gap-2 tw_px-8 tw_py-4 tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
>
  <p>
    {interpolate('__COMPONENT_SLUG__Copyright', null, '© 2026 Your company. All rights reserved.')}
  </p>

  <nav class="tw_flex tw_gap-4">
    <a class="tw_link dark:tw_link_dark" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
      {interpolate('__COMPONENT_SLUG__Terms', null, 'Terms of use')}
    </a>
    <a
      class="tw_link dark:tw_link_dark"
      href={PRIVACY_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {interpolate('__COMPONENT_SLUG__Privacy', null, 'Privacy policy')}
    </a>
  </nav>
</footer>
