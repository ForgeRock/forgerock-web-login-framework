<!--
@component
Type: callback
Name: __COMPONENT_NAME__

Custom callback component. Replace this description with your own.
-->

<script lang="ts">
  import type { BaseCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  /**
   * The Journey Client callback instance for this component.
   * Typically you'll narrow this to a specific callback type:
   *   import type { NameCallback } from '@forgerock/journey-client/types'
   *   export let callback: NameCallback;
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
  export const style: z.infer<typeof styleSchema> = {};

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
