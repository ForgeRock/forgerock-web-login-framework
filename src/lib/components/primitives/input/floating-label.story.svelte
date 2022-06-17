<script lang="ts">
  import Button from '$components/primitives/button/button.svelte';
  import FloatingLabel from './floating-label.svelte';

  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;

  function submitForm(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    console.log(event.target);
    const isValid = form.checkValidity();
    console.log(isValid);
    form.classList.add('was-validated');
  }
</script>

<form
  on:submit|preventDefault={submitForm}
  novalidate
>
  <FloatingLabel {key} {label} {onChange} {isRequired} />
  <Button style="primary">Trigger Error</Button>
</form>
