<!--
  Story wrapper component for custom-name.svelte.
-->

<script lang="ts">
  import type { NameCallback } from '@forgerock/journey-client/types';

  /**
   * Centered — a layout primitive that centers its slot content horizontally
   * and vertically inside a constrained box. Used here so the component
   * renders at a predictable size in the Storybook canvas.
   */
  import Centered from '$components/primitives/box/centered.svelte';

  import CustomName from './custom-name.svelte';

  /**
   * callback — the only arg passed in from Storybook stories.
   * Storybook controls map to exported `let` props in this wrapper.
  * The story file uses `step.getCallbackOfType(callbackType.NameCallback)`
   * to produce a real SDK callback instance from the mock response.
   */
  export let callback: NameCallback;

  /**
   * Stub metadata objects — these would normally be produced by the framework's
   * buildCallbackMetadata() and buildStepMetadata() utilities. For Storybook we
   * hard-code reasonable defaults so the component renders without a live AM step.
   *
   * callbackMetadata.derived.isFirstInvalidInput
   *   Set to false — if you want to test the auto-focus behaviour, add a story
   *   variant that passes `isFirstInvalidInput: true`.
   *
   * callbackMetadata.idx — the position of this callback in the step (0-based).
   */
  const callbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
      isPasskeyAutofillEligible: false,
    },
    idx: 0,
  };
</script>

<Centered>
  <!--
    Pass all required props to the custom component.
    `callback` comes from Storybook args; the metadata objects are stubs above.
  -->
  <CustomName {callback} {callbackMetadata} />
</Centered>
