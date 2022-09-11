<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Select from './floating-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: string;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: string; text: string }[];
  export let withForm = false;

  let el: SvelteComponent;
  let isInvalid: boolean;

  function submitForm(event: SubmitEvent) {
    console.log('Form submitted');
    errorMessage = 'Please select an option';
  }

  onMount(() => {
    if (!withForm && errorMessage) {
      // Only done to force an error without any user interaction
      let root = el.$$.root;
      console.log(root);
      let errorEl = root.querySelector('select');
      errorEl?.setAttribute('aria-invalid', 'true');
      isInvalid = true;
    }
  });
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Select
      {checkValidity}
      {defaultOption}
      {isRequired}
      firstInvalidInput={false}
      {key}
      {label}
      message={errorMessage}
      {onChange}
      {options}
    />
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Select
    bind:this={el}
    {checkValidity}
    {defaultOption}
    {isRequired}
    firstInvalidInput={false}
    {key}
    {label}
    message={errorMessage}
    {onChange}
    {options}
  />
{/if}
