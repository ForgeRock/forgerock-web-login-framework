<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Input from './input.svelte';

  interface Props {
    isRequired: boolean;
    key: string;
    label: string;
    labelOrder: 'first' | 'last' | undefined;
    onChange: (event: Event) => void;
    placeholder: string;
  }

  let {
    isRequired,
    key,
    label,
    labelOrder,
    onChange,
    placeholder
  }: Props = $props();
</script>

<div>
  <Input
    {isRequired}
    isFirstInvalidInput={false}
    {key}
    {label}
    {labelOrder}
    {onChange}
    {placeholder}
  />
</div>
