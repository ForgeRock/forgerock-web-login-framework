<script lang="ts">
  import Radio from '$components/primitives/radio/radio.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  export let defaultOption: number;
  export let message = '';
  export let firstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];
</script>

{#each options as option}
  <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
    <Radio
      checked={defaultOption === option.value}
      {firstInvalidInput}
      {isRequired}
      {isInvalid}
      key={`${key}-${option.value}`}
      {name}
      {onChange}
      value={option.value}
    >
      {option.text}
    </Radio>
  </div>
{/each}
<!--
  NOTE: The below places the error message on the second row and in second
  column to match the label's layout.
 -->
<span class="tw_col-start-2 tw_row-start-2">
  <Message {message} {key} showMessage={isInvalid} type={isInvalid ? 'error' : 'info'} />
</span>
