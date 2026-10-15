<!--
  Custom page header wrapper.
  ─────────────────────────────
  This is your file: the framework renders it above the journey container
  (inside the root div of the login app's +page.svelte). It is never
  overwritten once it exists — not by rebuilds, not by `ping-lf update` — so
  edit it freely; your changes survive framework upgrades. If you ever delete
  or damage it, restore the default with `ping-lf generate wrapper header`.

  HOW IT RENDERS
  ──────────────
  The header mounts client-side only: it first renders once a journey step
  arrives, then stays mounted for the rest of the session (no flicker while
  steps load, switch journeys, or redirect on completion).

  PROPS
  ─────
  The wrapper receives exactly one prop:

    journeyName: string
      Name of the journey currently driving the page (e.g. "Login",
      "Register"). `''` means the AM default journey — the one the tenant
      serves when the URL names no journey. Show your default-journey view
      in that case; the header always renders something.

  The framework passes no other props. Do not add required props of your own —
  they will arrive undefined. Anything you need beyond `journeyName`, derive
  inside this component from the framework exports.
-->

<script lang="ts">
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework-exports' — the
   * framework's centralized exports for custom components. No need to reach
   * into internal aliases like $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list).
   */
  import type { CustomWrapperProps } from '$login-framework-exports';

  /** The one prop the framework passes: the active journey name (`''` = default). */
  export let journeyName: CustomWrapperProps['journeyName'] = '';
</script>

<!--
  Default markup: neutral no-op placeholder. Replace it with your own branding.

  Example — branch the markup on the prop value. Render a "Register" banner
  when journeyName is "Register", a default-journey banner when it is the
  empty string (that is the AM default journey, the case where the URL named
  no journey), and a journeyName-driven banner otherwise. In Svelte that is
  an if/else if/else chain on journeyName.

  All Tailwind classes use the framework's tw_ prefix so theme compilation
  picks them up (see themes/default/config.cjs — prefix: 'tw_').
-->
<header class="tw_hidden"></header>

<!--
  Scoped styles for this wrapper. They apply only here — they won't leak to the
  rest of the widget.
-->
<style>
  /* Add your custom header styles here. */
</style>
