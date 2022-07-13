<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Input from './stacked-label.svelte';

  export let checkValidity: (event: Event) => boolean = null;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let placeholder: string;
  export let withForm = false;

  let el;

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
      errorEl.setAttribute('aria-invalid', true);
    }
  });
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Input {checkValidity} {errorMessage} {isRequired} {key} {label} {onChange} {placeholder} />
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Input bind:this={el} {checkValidity} {errorMessage} {isRequired} {key} {label} {onChange} {placeholder} />
{/if}
