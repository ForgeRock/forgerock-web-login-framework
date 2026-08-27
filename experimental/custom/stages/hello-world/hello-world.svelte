<!--
@component
Type: stage
Name: HelloWorld
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <span style="color: #334155"> Hello World! </span>
  <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
</Form>

<style>
  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
