<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Checkbox from './checkbox.svelte';

  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
</script>

<div>
  <Checkbox isFirstInvalidInput={false} {key} {onChange} {value}>
    {label}
  </Checkbox>
</div>
