<script lang="ts">
  import Select from '$components/primitives/select/select.svelte';
  import Error from '$components/primitives/message/error.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: number | null = null;
  export let errorMessage = '';
  export let isRequired: boolean;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }

  $: {
    isInvalid = !!errorMessage;
  }
</script>

<div class={`tw_input-spacing tw_relative`}>
  <Select
    {defaultOption}
    {isRequired}
    {isInvalid}
    {key}
    {label}
    labelClasses="tw_absolute tw_input-floating-label tw_select-floating-label"
    labelOrder="last"
    onChange={onChangeWrapper}
    {options}
    selectClasses="tw_select-floating"
  />
  <Error {errorMessage} {key} showError={isInvalid} />
</div>
