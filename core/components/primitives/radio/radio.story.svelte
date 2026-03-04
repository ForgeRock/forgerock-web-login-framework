<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Radio from '$components/primitives/radio/radio.svelte';

  export let defaultOption: string;
  export let isRequired = false;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { value: string | null; text: string }[];
</script>

<div>
  {#each options as option}
    <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
      <Radio
        checked={defaultOption === option.value}
        {isRequired}
        isFirstInvalidInput={false}
        key={`${key}-${option.value}`}
        {name}
        {onChange}
        value={option.value}
      >
        {option.text}
      </Radio>
    </div>
  {/each}
</div>
