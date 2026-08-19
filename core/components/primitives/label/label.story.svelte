<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Label from './label.svelte';

  interface Props {
    key: string;
    classes: string;
    inputLabel: string;
  }

  let { key, classes, inputLabel }: Props = $props();
</script>

<Label {key} {classes}>
  {inputLabel}
</Label>
