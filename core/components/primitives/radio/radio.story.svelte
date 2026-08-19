<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Radio from '$components/primitives/radio/radio.svelte';

  interface Props {
    defaultOption: string;
    isRequired?: boolean;
    key: string;
    name: string;
    onChange: (event: Event) => void;
    options: { value: string | null; text: string }[];
  }

  let { defaultOption, isRequired = false, key, name, onChange, options }: Props = $props();
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
