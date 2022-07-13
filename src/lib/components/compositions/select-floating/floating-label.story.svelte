<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Select from "./floating-label.svelte";
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: (event: Event) => boolean = null;
  export let defaultOption: number;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: number | null; text: string }[];
  export let withForm = false;

  let el;

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
      errorEl.setAttribute('aria-invalid', true);
    }
  });
</script>

{#if withForm}
  <Form onSubmitWhenValid={submitForm}>
    <Select {checkValidity} {defaultOption} {errorMessage} {isRequired} {key} {label} {onChange} {options} />
    <Button style="primary">Trigger Error</Button>
  </Form>
{:else}
  <Select bind:this={el} {checkValidity} {defaultOption} {errorMessage} {isRequired} {key} {label} {onChange} {options} />
{/if}
