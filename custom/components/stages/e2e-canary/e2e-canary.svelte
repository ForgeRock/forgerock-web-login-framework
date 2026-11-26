<!--
@component
Type: stage
Name: E2eCanaryStage

E2E canary stage (SDKS-5511). Never matched by a real AM journey — the name
is unique to this repo's e2e suite, which mocks the /authenticate response
with stage: "E2eCanaryStage". Proves the full custom-stage pipeline:
registry scan → custom-registry.ts generation → mapStepToStage override →
journey render with documented stage props.

PROP RULES (Custom Components public API contract)
──────────────────────────────────────────────────
The framework passes exactly the props declared below and nothing else.
Submit through `form.submit()` — never call the journey store. Render
feedback from `form.status` and `form.message`.
-->

<script lang="ts">
  import { Alert, Button, CallbackMapper, Form } from '$login-framework';

  import type { JourneyStep } from '$login-framework';
  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$login-framework';

  /** Display mode — determines which chrome is visible. */
  export let componentStyle: 'app' | 'inline' | 'modal';

  /** Form helpers — `form.submit()` triggers the journey's next step. */
  export let form: StageFormObject;

  /** Journey-level state — includes `loading` flag. */
  export let journey: StageJourneyObject;

  /** Step + callback metadata from AM. */
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;

  /** The raw JourneyStep from Journey Client. */
  export let step: JourneyStep;
</script>

<div data-testid="e2e-canary" data-canary-style={componentStyle}>
  <p>E2E canary stage is rendering this step</p>
  {#if form?.message}
    <Alert type="error">{form.message}</Alert>
  {/if}
  <Form onSubmitWhenValid={form?.submit}>
    {#each step?.callbacks as callback, idx}
      <CallbackMapper
        props={{
          callback,
          callbackMetadata: metadata?.callbacks[idx],
          selfSubmitFunction: form?.submit,
          stepMetadata: metadata?.step && { ...metadata.step },
        }}
      />
    {/each}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      Canary submit
    </Button>
  </Form>
</div>

<style>
  /* Canary markup is asserted by data-testid; styles intentionally minimal. */
</style>
