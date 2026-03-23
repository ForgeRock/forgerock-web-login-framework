<!--
  Story wrapper component for custom-name.svelte.
-->

<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

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
   * The story file uses `step.getCallbackOfType(CallbackType.NameCallback)`
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
    },
    idx: 0,
  };

  /**
   * stepMetadata — step-level metadata. The callback component receives this
   * but typically only reads it to decide whether to self-submit. Setting
   * isStepSelfSubmittable to return false is the safe default for stories.
   */
  const stepMetadata = {
    derived: {
      isStepSelfSubmittable: () => false,
      isUserInputOptional: false,
      numOfCallbacks: 1,
      numOfSelfSubmittableCbs: 0,
      numOfUserInputCbs: 1,
    },
  };
</script>

<Centered>
  <!--
    Pass all required props to the custom component.
    `callback` comes from Storybook args; the metadata objects are stubs above.
    selfSubmitFunction and stepMetadata are optional in this demo — they are
    included here to match the full callback prop contract.
  -->
  <CustomName {callback} {callbackMetadata} {stepMetadata} />
</Centered>
