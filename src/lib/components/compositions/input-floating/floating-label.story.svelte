<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Input from './floating-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let withForm = false;
  export let value: string;

  let el: SvelteComponent;
  let isInvalid: boolean;

  function submitForm(event: SubmitEvent) {
    message = 'This field must have a value';
  }

  onMount(() => {
    if (!withForm && message) {
      // Only done to force an error without any user interaction
      let root = el.$$.root;
      let errorEl = root.querySelector('input');
      errorEl?.setAttribute('aria-invalid', 'true');
      isInvalid = true;
    }
  });
</script>

{#if withForm}
  <Form ariaDescribedBy="floatingLabelInputStory" onSubmitWhenValid={submitForm}>
    <Input
      {checkValidity}
      isFirstInvalidInput={false}
      {isRequired}
      {isInvalid}
      {key}
      {label}
      {message}
      {onChange}
      {value}
    />
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Input
    bind:this={el}
    {checkValidity}
    isFirstInvalidInput={false}
    {isRequired}
    {isInvalid}
    {key}
    {label}
    {message}
    {onChange}
    {value}
  />
{/if}
