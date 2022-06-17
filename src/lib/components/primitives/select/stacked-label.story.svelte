<script lang="ts">
  import Button from '$components/primitives/button/button.svelte';
  import Select from "./stacked-label.svelte";

  export let defaultOption: number;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: number | null; text: string }[];

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
  <Select {defaultOption} {isRequired} {key} {label} {onChange} {options} />
  <Button style="primary">Trigger Error</Button>
</form>
