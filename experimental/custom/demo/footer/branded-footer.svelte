<!--
  Custom page footer demo component.
  ─────────────────────────────────
  DEMO COMPONENT
  Page headers and footers are NOT registry components — there is no @component
  header here and none is needed. The framework renders the fixed wrapper files
  (experimental/custom/header/header.svelte and experimental/custom/footer/footer.svelte)
  above and below the journey container. This demo shows what a branded footer
  inside that wrapper can look like.

  HOW TO USE
  ──────────
  Copy the markup and styles you like into
  experimental/custom/footer/footer.svelte (the wrapper the framework renders),
  or use this file as a visual reference in Storybook. The wrapper is the only
  file the framework renders; this demo is the worked example of what to put in it.

  THE ONE PROP
  ────────────
  The wrapper receives exactly one prop:

    journeyName: string
      Name of the journey currently driving the page (e.g. "Login",
      "Register"). `''` means the AM default journey — the one the tenant
      serves when the URL names no journey. Show your default-journey view in
      that case; the footer always renders something.

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
   * renders the footer, so the default-journey branch is the fallback too.
   */
  $: view = journeyName === '' ? 'default' : journeyName === 'Register' ? 'register' : 'named';

  // Branding copy per view. Swap these strings for your own.
  const copy: Record<string, { legal: string; links: Array<{ href: string; label: string }> }> = {
    default: {
      legal: '© 2026 Acme Corporation. All rights reserved.',
      links: [
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
    },
    named: {
      legal: '© 2026 Acme Corporation. All rights reserved.',
      links: [
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
      ],
    },
    register: {
      legal: '© 2026 Acme Corporation. All rights reserved.',
      links: [
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
        { href: '#', label: 'Acceptable Use' },
      ],
    },
  };

  $: currentCopy = copy[view] ?? copy.named;
</script>

<!--
  Branding bar. Everything uses the framework's tw_ Tailwind prefix so theme
  compilation picks the classes up (themes/default/config.cjs — prefix: 'tw_').
-->
<footer class="tw_border-0 tw_border-t tw_border-secondary-light dark:tw_border-secondary-dark">
  <div
    class="tw_flex tw_flex-wrap tw_items-center tw_gap-x-6 tw_gap-y-2 tw_px-6 tw_py-4 tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
  >
    <span>{currentCopy.legal}</span>

    <nav aria-label="Footer links">
      {#each currentCopy.links as link}
        <a class="tw_text-primary-light hover:tw_underline" href={link.href}>{link.label}</a>
      {/each}
    </nav>
  </div>
</footer>

<!--
  Scoped styles for this component. They apply only here — they won't leak to
  the rest of the widget.
-->
<style>
  /* Add your custom footer styles here. */
</style>
