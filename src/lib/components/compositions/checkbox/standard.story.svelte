<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Checkbox from './standard.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: (event: Event) => boolean = null;
  export let errorMessage: string = '';
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
  export let withForm = false;

  let el;

  function submitForm(event: SubmitEvent) {
    console.log('Form submitted');
    errorMessage = 'Please accept this';
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

  $: { console.log(errorMessage) }
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Checkbox bind:this={el} {checkValidity} {errorMessage} {key} {onChange} {value}>
      {label}
    </Checkbox>
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Checkbox bind:this={el} {checkValidity} {errorMessage} {key} {onChange} {value}>
    {label}
  </Checkbox>
{/if}
