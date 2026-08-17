<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

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

  interface Props {
    form: StageFormObject;
    journey: StageJourneyObject;
    stage: string;
    stageJson: Record<string, unknown>;
    step: JourneyStep;
    style: z.infer<typeof partialStyleSchema>;
  }

  let { form, journey, stage, stageJson = $bindable(), step, style }: Props = $props();

  let storyRootEl: HTMLElement | null = $state(null);
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

  run(() => {
    initializeStyles(style);
    applyThemeVars(storyRootEl, style?.theme);
  });
</script>

<div bind:this={storyRootEl} class="fr_widget-root">
  <Centered>
    <Generic componentStyle="modal" {form} {journey} {metadata} {step} />
  </Centered>
</div>
