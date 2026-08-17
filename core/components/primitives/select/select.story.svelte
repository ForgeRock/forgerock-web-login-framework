<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Select from './select.svelte';

  interface Props {
    defaultOption: string;
    isRequired: boolean;
    key: string;
    label: string;
    labelOrder: 'first' | 'last' | undefined;
    onChange: (event: Event) => void;
    options: { text: string; value: string }[];
  }

  let { defaultOption, isRequired, key, label, labelOrder, onChange, options }: Props = $props();
</script>

<div>
  <Select
    {defaultOption}
    {isRequired}
    isFirstInvalidInput={false}
    {key}
    {label}
    {labelOrder}
    {onChange}
    {options}
  />
</div>
