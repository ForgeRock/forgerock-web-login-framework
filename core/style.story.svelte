<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import { applyThemeVars } from '$core/_effects/theme.effects';
  import { initialize as initializeLinks } from '$core/links.store';
  import { initialize as initializeStyles } from '$core/style.store';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { initCheckValidation } from '$journey/stages/_utilities/step.utilities';
  import Generic from '$journey/stages/generic.svelte';

  import type { JourneyStep } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { partialStyleSchema } from '$core/style.store';
  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let stage: string;
  export let stageJson: Record<string, unknown>;
  export let step: JourneyStep;
  export let style: z.infer<typeof partialStyleSchema>;

  let storyRootEl: HTMLElement | null = null;
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
    applyThemeVars(storyRootEl, style?.theme);
  }
</script>

<div bind:this={storyRootEl} class="fr_widget-root">
  <Centered>
    <Generic componentStyle="modal" {form} {journey} {metadata} {step} />
  </Centered>
</div>
