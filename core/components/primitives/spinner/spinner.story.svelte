<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Spinner from './spinner.svelte';

  export let colorClass: string;
  export let layoutClasses: string;
</script>

<div class="tw_text-center">
  <Spinner {colorClass} {layoutClasses} />
</div>
