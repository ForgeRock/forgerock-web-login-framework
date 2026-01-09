<!--

 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->
 
<script lang="ts">
  import type { FRStep } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Centered from '$components/primitives/box/centered.svelte';
  import Generic from '$journey/stages/generic.svelte';
  import { initialize as initializeLinks } from '$core/links.store';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { initCheckValidation } from '$journey/stages/_utilities/step.utilities';
  import { initialize as initializeStyles, partialStyleSchema } from '$core/style.store';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let stage: string;
  export let stageJson: Record<string, unknown>;
  export let step: FRStep;
  export let style: z.infer<typeof partialStyleSchema>;

  let stageName;

  // Mimic what happens in the `journey.store` module
  // Check if stage attribute is serialized JSON
  if (stage && stage.includes('{')) {
    try {
      stageJson = JSON.parse(stage) as Record<string, unknown>;
    } catch (err) {
      console.warn('Stage attribute value was not parsable');
    }
  } else if (stage) {
    stageName = stage;
  }

  // Create metadata
  const callbackMetadata = buildCallbackMetadata(step, initCheckValidation(), stageJson);
  const stepMetadata = buildStepMetadata(callbackMetadata, stageJson, stageName);
  const metadata = {
    callbacks: callbackMetadata,
    step: stepMetadata,
  };

  // Initialize stores
  initializeLinks({ termsAndConditions: '/' });

  $: {
    initializeStyles(style);
  }
</script>

<Centered>
  <Generic componentStyle="modal" {form} {journey} {metadata} {step} />
</Centered>
