<!--
@component
Type: callback
Name: __COMPONENT_NAME__

Custom callback component. Replace this description with your own.
-->

<script lang="ts">
  import type { BaseCallback } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    SelfSubmitFunction,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  /**
   * The callback instance for this component. Use `callback.getInputValue()`
   * and `callback.setInputValue()` to read/write values sent back to the server.
   */
  export let callback: BaseCallback;

  /**
   * Optional function to trigger self-submission (e.g. after an async action).
   * Set to `null` when the callback does not need to submit the form itself.
   */
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;

  /**
   * Metadata about the current step (page node) — includes stage name,
   * header/description overrides, and derived helpers like `isStepSelfSubmittable()`.
   */
  export const stepMetadata: Maybe<StepMetadata> = null;

  /**
   * Per-callback metadata from the step — may include policies, failed policies,
   * and other AM-provided hints for rendering.
   */
  export const callbackMetadata: Maybe<CallbackMetadata> = null;

  /**
   * The widget's resolved style configuration (colors, logos, labels, etc.).
   * Use this to keep your custom callback visually consistent with the theme.
   */
  export const style: StyleObject = {};

  // Suppress the "unused export" warning — remove `void` once you use `callback`.
  void callback;
</script>

<!-- Replace the markup below with your custom callback UI. -->
<div
  class="__COMPONENT_SLUG__ tw_p-4 tw_rounded-lg tw_border tw_border-secondary-light dark:tw_border-secondary-dark"
>
  <p class="tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light">
    __COMPONENT_NAME__ callback — replace this with your implementation.
  </p>
</div>

<!--
  Scoped styles for this callback.
  These styles only apply to this component — they won't leak to the rest of the widget.
  You can also use Tailwind utility classes (prefixed with `tw_`) in the markup above.
-->
<style>
  .__COMPONENT_SLUG__ {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
