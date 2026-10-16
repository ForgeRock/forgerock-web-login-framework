<!--
  Custom page header demo component.
  ─────────────────────────────────
  DEMO COMPONENT
  Page headers and footers are NOT registry components — there is no @component
  header here and none is needed. The framework renders the fixed wrapper files
  (experimental/custom/header/header.svelte and experimental/custom/footer/footer.svelte)
  above and below the journey container. This demo shows what a branded header
  inside that wrapper can look like.

  HOW TO USE
  ──────────
  Copy the markup and styles you like into
  experimental/custom/header/header.svelte (the wrapper the framework renders),
  or use this file as a visual reference in Storybook. The wrapper is the only
  file the framework renders; this demo is the worked example of what to put in it.

  THE ONE PROP
  ────────────
  The wrapper receives exactly one prop:

    journeyName: string
      Name of the journey currently driving the page (e.g. "Login",
      "Register"). `''` means the AM default journey — the one the tenant
      serves when the URL names no journey. Show your default-journey view in
      that case; the header always renders something.

  This demo branches visibly on the `''` default-journey contract and on a
  named journey, so you can see each state in the Storybook stories below.
-->

<script lang="ts">
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the
   * framework's centralized exports for custom components. No need to reach
   * into internal aliases like $core, $components, or $journey directly.
   */
  import type { CustomWrapperProps } from '$login-framework';

  /** The one prop the framework passes: the active journey name (`''` = default). */
  export let journeyName: CustomWrapperProps['journeyName'] = '';

  // ─── Derived view state ────────────────────────────────────────────────────
  /**
   * Which view to render: the default journey (`''`), the Register journey, or
   * any other named journey. The framework's contract guarantees `''` still
   * renders the header, so the default-journey branch is the fallback too.
   */
  $: view = journeyName === '' ? 'default' : journeyName === 'Register' ? 'register' : 'named';

  // Branding copy per view. Swap these strings (and the logo) for your own.
  const copy: Record<string, { brandLine: string; tagline: string }> = {
    default: { brandLine: 'Acme Identity', tagline: 'Sign in to your Acme workspace' },
    named: { brandLine: 'Acme Identity', tagline: 'Sign in to your Acme workspace' },
    register: { brandLine: 'Acme Identity', tagline: 'Create your Acme account' },
  };

  $: currentCopy = copy[view] ?? copy.named;
</script>

<!--
  Branding bar. Everything uses the framework's tw_ Tailwind prefix so theme
  compilation picks the classes up (themes/default/config.cjs — prefix: 'tw_').
-->
<header class="tw_border-0 tw_border-b tw_border-secondary-light dark:tw_border-secondary-dark">
  <div class="tw_flex tw_items-center tw_gap-3 tw_px-6 tw_py-4">
    <!--
      Logo placeholder. Replace this <div> with your own logo, e.g.:
        <img src="/your-logo.svg" alt="Acme Corp" class="tw_h-10" />
      Or import a Svelte icon component from your design system.
    -->
    <div
      class="tw_w-10 tw_h-10 tw_rounded-full tw_bg-primary-light tw_flex tw_items-center tw_justify-center"
      aria-hidden="true"
    >
      <span class="tw_text-white tw_text-lg tw_font-bold select-none">✦</span>
    </div>

    <div class="tw_flex tw_flex-col">
      <span class="tw_primary-header dark:tw_primary-header_dark">{currentCopy.brandLine}</span>
      <span class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light">
        {currentCopy.tagline}
      </span>
    </div>
  </div>
</header>

<!--
  Scoped styles for this component. They apply only here — they won't leak to
  the rest of the widget.
-->
<style>
  /* Add your custom header styles here. */
</style>
