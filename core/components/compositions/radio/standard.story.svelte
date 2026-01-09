<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Radio from './standard.svelte';

  export let defaultOption = '0';
  export let key: string;
  export let label: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { text: string; value: string | null }[];
</script>

<div>
  <Radio {defaultOption} isFirstInvalidInput={false} {key} {name} {onChange} {options}>
    {label}
  </Radio>
</div>
