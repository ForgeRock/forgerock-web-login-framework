<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  export let key: string;
  export let classes = '';
</script>

<label for={key} class={`${classes} tw_input-label dark:tw_input-label_dark`}>
  <slot />
</label>
