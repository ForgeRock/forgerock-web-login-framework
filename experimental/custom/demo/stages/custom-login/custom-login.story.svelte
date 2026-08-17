<!--
  Story wrapper component for custom-login.svelte.
-->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize as initializeLinks } from '$core/links.store';
  import { initialize as initializeStyles } from '$core/style.store';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { initCheckValidation } from '$journey/stages/_utilities/step.utilities';
  import CustomLogin from './custom-login.svelte';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  // ─── Props from Storybook args ────────────────────────────────────────────
  

  

  
  interface Props {
    /** form — submission helpers; varies per story (Base, WithError, Loading). */
    form: StageFormObject;
    /** journey — navigation state and loading flag; varies per story. */
    journey: StageJourneyObject;
    /** step — the JourneyStep instance built from the mock AM response. */
    step: JourneyStep;
  }

  let { form, journey, step }: Props = $props();

  /**
   * Initialize the links store with a placeholder Terms & Conditions URL.
   * The stage component renders a <T key="dontHaveAnAccount" html={true} />
   * block that may include a T&C link — without initialization this throws.
   * Replace '/' with your actual T&C page URL if needed.
   */
  initializeLinks({ termsAndConditions: '/' });

  /**
   * Initialize the style store with framework defaults (empty object).
   * Pass your own token overrides here to test branded appearances:
   *   initializeStyles({ logoUrl: '/logo.svg', labels: 'floating' })
   */
  initializeStyles({});

  // ─── Derive metadata from the mock step ───────────────────────────────────
  /**
   * buildCallbackMetadata(step, checkFn, existingMetadata)
   *   Iterates step.callbacks and produces one CallbackMetadata object per
   *   callback, including derived flags like isFirstInvalidInput and
   *   isSelfSubmitting. initCheckValidation() provides the initial check
   *   function (no fields marked invalid on first render).
   */
  const callbackMetadata = buildCallbackMetadata(step, initCheckValidation(), undefined);

  /**
   * buildStepMetadata(callbackMetadata, pageHeader, stageName)
   *   Aggregates the per-callback metadata into step-level derived values:
   *   isStepSelfSubmittable, isUserInputOptional, numOfCallbacks, etc.
   */
  const stepMetadata = buildStepMetadata(callbackMetadata, undefined, 'DefaultLogin');

  /** Combined metadata object — matches the shape expected by the stage component. */
  const metadata = { callbacks: callbackMetadata, step: stepMetadata };
</script>

<Centered>
  <!--
    Render the custom stage component with all required props.
    - componentStyle="modal" — test in modal form factor (has header + links).
      Change to "inline" or "app" to test those form factors.
    - form / journey / step come from Storybook args (vary per story).
    - metadata is derived above from the mock step.
  -->
  <CustomLogin componentStyle="modal" {form} {journey} {metadata} {step} />
</Centered>
