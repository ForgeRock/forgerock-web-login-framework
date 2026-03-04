<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Label from './label.svelte';

  export let key: string;
  export let classes: string;
  export let inputLabel: string;
</script>

<Label {key} {classes}>
  {inputLabel}
</Label>
