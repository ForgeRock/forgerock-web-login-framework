<!--
  @component
  Type: footer
  Name: DemoFooter

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/footers/<your-name>/ to create your
  own page footer, then rebuild with `pnpm build:widget`.

  HOW FOOTERS WORK
  ─────────────────
  The framework's Vite plugin writes custom-registry.ts on every build (and
  watches in dev), mapping "DemoFooter" → this component. The login app renders
  the registered footer component below the journey container
  (apps/login-app/src/routes/(app)/+page.svelte).

  Footer components take NO props — they are static page-level slots rendered
  outside the journey flow. They have no access to the journey, form, or step
  state.

  NOTE (selection)
  ────────────────
  Multiple Type: footer components may be registered, each under its own Name:.
  The login app selects one via the PUBLIC_CUSTOM_FOOTER_NAME environment
  variable (Name: of the component to render). An unset variable renders no
  footer; a variable naming an unregistered component fails loudly.
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
  import { interpolate } from '$login-framework';

  /**
   * Legal link hrefs — keep them here so implementers see one obvious place to
   * swap in their own URLs. These point at real Ping legal pages; change them
   * to your organization's terms and privacy policy.
   */
  const TERMS_URL = 'https://www.pingidentity.com/en/legal/terms-of-use.html';
  const PRIVACY_URL = 'https://www.pingidentity.com/en-us/docs/legal/privacy';
</script>

<!--
  Page footer — rendered below the journey card.

  Typical contents: copyright, terms / privacy / support links, locale switch.
  All Tailwind classes use the framework's tw_ prefix so theme compilation
  picks them up (see themes/default/config.cjs — prefix: 'tw_').

  The interpolate() fallback (third argument) keeps the demo readable without
  any locale setup.
-->
<footer
  class="tw_flex tw_flex-col sm:tw_flex-row sm:tw_items-center sm:tw_justify-between tw_gap-2 tw_px-8 tw_py-4 tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
>
  <p>
    {interpolate('demoFooterCopyright', null, '© 2026 Acme Identity. All rights reserved.')}
  </p>

  <nav class="tw_flex tw_gap-4">
    <a class="tw_link dark:tw_link_dark" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
      {interpolate('demoFooterTerms', null, 'Terms of use')}
    </a>
    <a
      class="tw_link dark:tw_link_dark"
      href={PRIVACY_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {interpolate('demoFooterPrivacy', null, 'Privacy policy')}
    </a>
  </nav>
</footer>
