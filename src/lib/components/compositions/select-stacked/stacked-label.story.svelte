<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Select from './stacked-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: string | null = null;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: string; text: string }[];
  export let withForm = false;

  let el: SvelteComponent;

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
    }
  });
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Select
      {checkValidity}
      {defaultOption}
      firstInvalidInput={false}
      {isRequired}
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
    firstInvalidInput={false}
    {isRequired}
    {key}
    {label}
    message={errorMessage}
    {onChange}
    {options}
  />
{/if}
