<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Checkbox from './checkbox.svelte';

  interface Props {
    key: string;
    label: string;
    onChange: (event: Event) => void;
    value: boolean;
  }

  let {
    key,
    label,
    onChange,
    value
  }: Props = $props();
</script>

<div>
  <Checkbox isFirstInvalidInput={false} {key} {onChange} {value}>
    {label}
  </Checkbox>
</div>
