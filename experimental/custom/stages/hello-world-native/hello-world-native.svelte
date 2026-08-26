<!--
@component
Type: stage
Name: HelloWorldNative
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;

  let name = '';
  let rememberMe = false;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <h1>Hello World!</h1>

  <label>
    Your name
    <input bind:value={name} type="text" />
  </label>

  <label>
    <input bind:checked={rememberMe} type="checkbox" />
    Remember me
  </label>

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
