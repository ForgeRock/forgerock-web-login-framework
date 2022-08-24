<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Input from './floating-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let withForm = false;
  export let value: string;

  let el: SvelteComponent;

  function submitForm(event: SubmitEvent) {
    console.log('Form submitted');
    errorMessage = 'This field must have a value';
  }

  onMount(() => {
    if (!withForm && errorMessage) {
      // Only done to force an error without any user interaction
      let root = el.$$.root;
      console.log(root);
      let errorEl = root.querySelector('input');
      errorEl?.setAttribute('aria-invalid', 'true');
    }
  });
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Input
      {checkValidity}
      {errorMessage}
      firstInvalidInput={false}
      {key}
      {label}
      {onChange}
      {isRequired}
      {value}
    />
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Input
    bind:this={el}
    {checkValidity}
    {errorMessage}
    firstInvalidInput={false}
    {key}
    {label}
    {onChange}
    {isRequired}
    {value}
  />
{/if}
